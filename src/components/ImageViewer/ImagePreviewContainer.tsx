
import React, { useState, useCallback } from 'react';
import { ImageData } from "@/types/ImageData";
import StatusBadges from '@/components/ImageViewer/StatusBadges';
import { ExtractedDataEditor } from "@/components/ExtractedData";
import DraggableImage from '@/components/ImageList/DraggableImage';
import { Grid, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting?: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => Promise<boolean>;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
  onRetry?: (imageId: string) => void;
}

const ImagePreviewContainer: React.FC<ImagePreviewContainerProps> = ({
  images,
  isSubmitting = false,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false,
  onRetry
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  
  // مرشحات الصور
  const getFilteredImages = useCallback(() => {
    return images.filter((image: ImageData) => {
      if (showOnlySession && !image.sessionImage) return false;
      
      if (filter === 'all') return true;
      if (filter === 'completed' && image.status === 'completed') return true;
      if (filter === 'pending' && image.status === 'pending') return true;
      if (filter === 'processing' && image.status === 'processing') return true;
      if (filter === 'error' && image.status === 'error') return true;
      if (filter === 'incomplete' && image.code === '') return true;
      return false;
    });
  }, [images, filter, showOnlySession]);

  const filteredImages = getFilteredImages();

  // إحصاءات الصور
  const imageCounts = {
    all: filteredImages.length,
    pending: filteredImages.filter(img => img.status === 'pending').length,
    completed: filteredImages.filter(img => img.status === 'completed').length,
    processing: filteredImages.filter(img => img.status === 'processing').length,
    incomplete: filteredImages.filter(img => 
      img.status === 'completed' && (!img.code || img.code.trim() === '')
    ).length,
    error: filteredImages.filter(img => img.status === 'error').length
  };

  // اختيار صورة
  const handleImageClick = useCallback((image: ImageData) => {
    console.log("تم النقر على الصورة:", image.id);
    setSelectedImage(prev => prev?.id === image.id ? null : image);
  }, []);

  // تبديل وضع العرض
  const toggleLayoutMode = () => {
    setLayoutMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  // معالج إعادة تحميل الصورة
  const handleImageRetry = useCallback((imageId: string) => {
    console.log("طلب إعادة تحميل الصورة:", imageId);
    if (onRetry) {
      onRetry(imageId);
    }
  }, [onRetry]);

  // معالج حذف الصورة
  const handleDeleteImage = useCallback(async (imageId: string) => {
    console.log("طلب حذف الصورة:", imageId);
    try {
      const result = await onDelete(imageId);
      if (result && selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
      return result;
    } catch (error) {
      console.error("خطأ أثناء حذف الصورة:", error);
      return false;
    }
  }, [onDelete, selectedImage]);

  return (
    <div className="relative min-h-[400px] rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
      {/* شريط الفلترة والأدوات */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleLayoutMode}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Grid className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          <StatusBadges
            counts={imageCounts}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
        </div>
      </div>

      {/* عرض الصور أو رسالة فارغة */}
      {filteredImages.length > 0 ? (
        <div className="p-6">
          {selectedImage ? (
            <div className="mb-8">
              {/* عرض بيانات الصورة المحددة */}
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                بيانات الصورة المحددة
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative">
                  <DraggableImage 
                    image={selectedImage} 
                    onImageClick={() => setSelectedImage(null)}
                    formatDate={formatDate}
                    onRetryLoad={handleImageRetry}
                  />
                </div>
                <div>
                  <ExtractedDataEditor
                    image={selectedImage}
                    onTextChange={onTextChange}
                    isSubmitting={isSubmitting}
                    onDelete={handleDeleteImage}
                    onSubmit={onSubmit}
                  />
                </div>
              </div>
              <hr className="my-8 border-gray-300 dark:border-gray-700" />
            </div>
          ) : null}
          
          {/* عرض الشبكة أو القائمة */}
          <div className={cn(
            "grid gap-6",
            layoutMode === 'grid' 
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          )}>
            {filteredImages.map((image) => (
              <div 
                key={image.id}
                className={layoutMode === 'list' ? "flex flex-col md:flex-row gap-6" : ""}
              >
                <div className={layoutMode === 'list' ? "w-full md:w-1/3" : "w-full"}>
                  <DraggableImage 
                    image={image} 
                    onImageClick={handleImageClick}
                    formatDate={formatDate}
                    onRetryLoad={handleImageRetry}
                  />
                </div>
                
                {layoutMode === 'list' && (
                  <div className="w-full md:w-2/3">
                    <ExtractedDataEditor
                      image={image}
                      onTextChange={onTextChange}
                      isSubmitting={isSubmitting}
                      onDelete={handleDeleteImage}
                      onSubmit={onSubmit}
                      compact={true}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
              لا توجد صور متاحة
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'all'
                ? 'لم يتم تحميل أي صور بعد. يرجى تحميل الصور أولاً.'
                : `لا توجد صور متطابقة مع تصفية "${filter}".`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewContainer;
