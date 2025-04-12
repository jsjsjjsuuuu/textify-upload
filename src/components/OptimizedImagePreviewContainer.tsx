
import { ImageData } from "@/types/ImageData";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader, SendHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import ExtractedDataEditor from "@/components/ExtractedData/ExtractedDataEditor";
import { ImageViewer } from "@/components/ImagePreview";
import StatusBadges from "@/components/ImageViewer/StatusBadges";
import ImageThumbnail from "./ImageThumbnail";
import ImagePagination from "./ImagePagination";
import { useCache } from "@/hooks/useCache";

interface OptimizedImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting?: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
}

// تحديد الحد الأقصى لعدد الصور التي سيتم عرضها في كل مجموعة
const ITEMS_PER_PAGE = 10;

const OptimizedImagePreviewContainer = ({
  images,
  isSubmitting = false,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false
}: OptimizedImagePreviewContainerProps) => {
  const [activeImage, setActiveImage] = useState<ImageData | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  
  // حالات تكبير الصورة
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // استخدام التخزين المؤقت للصور المصفاة
  const { getCache, setCache, isStale } = useCache<ImageData[]>(`filtered-images-${activeTab}`, { ttl: 30000 });
  
  // التحقق مما إذا كانت الصورة مكتملة (لديها البيانات الإلزامية)
  const isImageComplete = useCallback((image: ImageData): boolean => {
    const hasRequiredFields = Boolean(image.code) && Boolean(image.senderName) && 
                            Boolean(image.province) && Boolean(image.price);
    const hasValidPhone = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
    return hasRequiredFields && hasValidPhone;
  }, []);

  // التحقق مما إذا كانت الصورة تحتوي على خطأ في رقم الهاتف
  const hasPhoneError = useCallback((image: ImageData): boolean => {
    return Boolean(image.phoneNumber) && image.phoneNumber.replace(/[^\d]/g, '').length !== 11;
  }, []);
  
  // تصفية الصور مع التخزين المؤقت
  const filteredImages = useMemo(() => {
    // محاولة استرداد النتائج من التخزين المؤقت
    if (!isStale) {
      const cached = getCache();
      if (cached) return cached;
    }
    
    // إذا لم تكن هناك نتائج مخزنة، قم بالتصفية
    let result = [...images];
    if (activeTab === "pending") {
      result = result.filter(img => img.status === "pending");
    } else if (activeTab === "completed") {
      result = result.filter(img => img.status === "completed" && isImageComplete(img));
    } else if (activeTab === "error") {
      result = result.filter(img => img.status === "error" || hasPhoneError(img));
    } else if (activeTab === "processing") {
      result = result.filter(img => img.status === "processing");
    } else if (activeTab === "incomplete") {
      result = result.filter(img => img.status === "completed" && !isImageComplete(img) && !hasPhoneError(img));
    }
    
    // تخزين النتائج في التخزين المؤقت
    setCache(result);
    return result;
  }, [images, activeTab, isImageComplete, hasPhoneError, getCache, setCache, isStale]);

  // الاستماع إلى حدث معالجة الصورة
  useEffect(() => {
    const handleImageProcessed = (event: CustomEvent) => {
      const { imageId } = event.detail;
      const processedImage = images.find(img => img.id === imageId);
      
      if (processedImage) {
        console.log("تم معالجة الصورة وتعيينها كصورة نشطة:", imageId);
        setActiveImage(processedImage);
        
        // تحديث الصفحة إذا لزم الأمر
        const imageIndex = filteredImages.findIndex(img => img.id === imageId);
        if (imageIndex >= 0) {
          const page = Math.floor(imageIndex / ITEMS_PER_PAGE) + 1;
          if (page !== currentPage) {
            setCurrentPage(page);
          }
        }
      }
    };

    window.addEventListener('image-processed', handleImageProcessed as EventListener);
    
    return () => {
      window.removeEventListener('image-processed', handleImageProcessed as EventListener);
    };
  }, [images, currentPage, filteredImages]);

  // تعيين أول صورة كصورة نشطة تلقائيًا
  useEffect(() => {
    if (images.length > 0 && !activeImage) {
      setActiveImage(images[0]);
    } else if (images.length > 0 && activeImage) {
      // تحديث الصورة النشطة إذا تغيرت
      const updatedActiveImage = images.find(img => img.id === activeImage.id);
      if (updatedActiveImage && JSON.stringify(updatedActiveImage) !== JSON.stringify(activeImage)) {
        setActiveImage(updatedActiveImage);
      }
      
      // إذا تم حذف الصورة النشطة
      if (!updatedActiveImage) {
        setActiveImage(images[0]);
      }
    } else if (images.length === 0) {
      setActiveImage(null);
    }
  }, [images, activeImage]);

  // حساب عدد الصفحات
  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);

  // الصور للصفحة الحالية
  const paginatedImages = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredImages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredImages, currentPage]);

  // تحديث الصفحة عند تغيير علامة التبويب
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // وظائف التكبير/التصغير
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  }, []);
  
  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);
  
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoomLevel(newZoom);
  }, []);
  
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(!isFullScreen);
  }, [isFullScreen]);

  // وظيفة التنقل بين الصفحات
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // وظيفة معالجة النقر على الصورة
  const handleImageClick = useCallback((image: ImageData) => {
    setActiveImage(image);
  }, []);

  // وظيفة معالجة حذف الصورة
  const handleDelete = useCallback(() => {
    if (activeImage) {
      onDelete(activeImage.id);

      // تحديث الصورة النشطة بعد الحذف
      const currentIndex = filteredImages.findIndex(img => img.id === activeImage.id);
      if (filteredImages.length > 1) {
        const nextIndex = Math.min(currentIndex + 1, filteredImages.length - 1);
        setActiveImage(filteredImages[nextIndex]);
      } else {
        setActiveImage(null);
      }
    }
  }, [activeImage, onDelete, filteredImages]);

  // وظيفة معالجة تقديم الصورة
  const handleSubmit = useCallback(() => {
    if (activeImage) {
      onSubmit(activeImage.id);
    }
  }, [activeImage, onSubmit]);

  // حساب عدد الصور في كل حالة
  const countByStatus = useMemo(() => ({
    all: images.length,
    pending: images.filter(img => img.status === "pending").length,
    completed: images.filter(img => img.status === "completed" && isImageComplete(img)).length,
    incomplete: images.filter(img => img.status === "completed" && !isImageComplete(img) && !hasPhoneError(img)).length,
    error: images.filter(img => img.status === "error" || hasPhoneError(img)).length,
    processing: images.filter(img => img.status === "processing").length
  }), [images, isImageComplete, hasPhoneError]);

  // إظهار رسالة إذا لم تكن هناك صور
  if (images.length === 0) {
    return (
      <div className="text-center p-10 border-2 border-dashed rounded-xl border-white/10 bg-[#0a0f1e]/50">
        <h3 className="text-lg font-semibold mb-2">لا توجد صور</h3>
        <p className="text-muted-foreground">قم بتحميل صور ليتم معالجتها واستخراج البيانات منها</p>
      </div>
    );
  }

  // عرض قائمة الصور المصغرة
  const renderImagesThumbnails = () => (
    <div className="grid grid-cols-5 gap-2">
      {paginatedImages.map(image => (
        <ImageThumbnail
          key={image.id}
          image={image}
          isActive={activeImage?.id === image.id}
          onClick={() => handleImageClick(image)}
          isImageComplete={isImageComplete}
          hasPhoneError={hasPhoneError}
        />
      ))}
    </div>
  );

  // عرض أزرار الإجراءات للصورة النشطة
  const renderImageActions = () => {
    if (!activeImage) return null;
    
    return (
      <div className="flex justify-end space-x-2 space-x-reverse mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDelete} 
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 ml-1" />
          حذف
        </Button>
        
        {activeImage.status === "completed" && isImageComplete(activeImage) && !activeImage.submitted && !hasPhoneError(activeImage) && (
          <Button 
            size="sm" 
            variant="default" 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-2 h-4 w-4" />}
            إرسال
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto">
      <StatusBadges
        counts={countByStatus}
        activeFilter={activeTab}
        onFilterChange={setActiveTab}
      />
      
      {/* عرض الصور المصغرة أعلى الصفحة */}
      <div className="mb-6">
        {renderImagesThumbnails()}
        <ImagePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      </div>
      
      {/* عرض الصورة النشطة والبيانات بجانبها */}
      {activeImage ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* عرض الصورة بحجم كبير */}
          <div className="lg:col-span-7 h-[600px]">
            <ImageViewer 
              selectedImage={activeImage}
              zoomLevel={zoomLevel}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetZoom={handleResetZoom}
              onZoomChange={handleZoomChange}
              formatDate={formatDate}
              isFullScreen={isFullScreen}
              onToggleFullScreen={toggleFullScreen}
            />
          </div>
          
          {/* عرض البيانات */}
          <div className="lg:col-span-5">
            <div className="dish-container bg-[#0a0f1e]/95 p-4 rounded-lg border border-white/5 h-full">
              <div className="dish-glow-top"></div>
              <div className="dish-glow-bottom"></div>
              <div className="dish-reflection"></div>
              <div className="dish-inner-shadow"></div>
              <div className="relative z-10">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">البيانات المستخرجــة</h2>
                  {renderImageActions()}
                </div>
                
                {/* محتوى البيانات */}
                <div className="space-y-4 h-[calc(600px-70px)] overflow-y-auto pr-2">
                  <ExtractedDataEditor image={activeImage} onTextChange={onTextChange} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-60 flex items-center justify-center border-2 border-dashed border-white/10 rounded-lg p-8 bg-[#0a0f1e]/50">
          <p className="text-muted-foreground">
            اختر صورة لعرض التفاصيل
          </p>
        </div>
      )}
    </div>
  );
};

export default OptimizedImagePreviewContainer;
