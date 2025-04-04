import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { EmptyContent } from '@/components/EmptyContent';
import ImageList from '@/components/ImageList';
import { ImageData } from '@/types/ImageData';
import { Button } from '@/components/ui/button';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import ImageViewer from '@/components/ImageViewer';
import { useToast } from "@/hooks/use-toast";

const Records = () => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    images: sessionImages,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    isSubmitting,
    loadUserImages,
    reprocessImage
  } = useImageProcessing();

  // تحميل الصور عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      loadUserImages();
    }
  }, [user, loadUserImages]);

  // وظيفة إعادة المعالجة
  const handleReprocessImage = async (imageId: string) => {
    try {
      await reprocessImage(imageId);
      toast({
        title: "إعادة المعالجة",
        description: "تم جدولة الصورة لإعادة المعالجة",
      });
    } catch (error) {
      console.error("خطأ في إعادة معالجة الصورة:", error);
      toast({
        title: "خطأ",
        description: "فشل في إعادة معالجة الصورة",
        variant: "destructive"
      });
    }
  };

  // وظيفة فتح المعاينة
  const openImageViewer = (image: ImageData) => {
    setSelectedImage(image);
    setIsViewerOpen(true);
  };

  // وظيفة إغلاق المعاينة
  const closeImageViewer = () => {
    setIsViewerOpen(false);
    setSelectedImage(null);
  };

  // فرز الصور تنازليًا حسب وقت الإنشاء
  const sortedImages = [...sessionImages].sort((a, b) => {
    // استخدام created_at إذا كان متاحًا
    if (a.created_at && b.created_at) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // الرجوع إلى تاريخ الإنشاء الافتراضي
    return b.date.getTime() - a.date.getTime();
  });

  return (
    <Layout>
      <Header title="سجل الوصولات" />
      
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">الصور المستخرجة</h2>
        </div>
        
        {sortedImages.length > 0 ? (
          <ImageList
            images={sortedImages}
            onImageClick={openImageViewer}
            onTextChange={handleTextChange}
            onDelete={handleDelete}
            onSubmit={handleSubmitToApi}
            isSubmitting={isSubmitting}
            formatDate={(date: Date) => date.toLocaleDateString('ar-AE')}
            onReprocess={handleReprocessImage}
          />
        ) : (
          <EmptyContent
            title="لا توجد صور"
            description="لم يتم رفع أي صور بعد."
            icon="image"
          />
        )}
      </div>
      
      {/* عارض الصور */}
      {isViewerOpen && selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={closeImageViewer}
        />
      )}
    </Layout>
  );
};

export default Records;
