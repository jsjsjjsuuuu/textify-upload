
import React, { useState, useEffect, useCallback } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { ImageData } from '@/types/ImageData';
import ImageViewer from '@/components/ImageViewer';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadTab from '@/components/ImageTabs/UploadTab';
import ImagesTab from '@/components/ImageTabs/ImagesTab';

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    sessionImages,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    isSubmitting,
    isProcessing,
    processingProgress,
    clearSessionImages,
    loadUserImages,
    pauseProcessing,
    retryProcessing,
    clearQueue,
    useGemini,
    setUseGemini,
    reprocessImage
  } = useImageProcessing();
  
  // تحميل الصور عند تسجيل الدخول - استدعاء بدون معاملات
  useEffect(() => {
    if (user) {
      // إضافة تأخير قصير لتجنب تعارضات التحميل المتتالية
      const timeoutId = setTimeout(() => {
        // استدعاء بدون وسائط
        loadUserImages();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loadUserImages]);
  
  // تأكد من تفعيل Gemini
  useEffect(() => {
    // دائمًا تأكد من أن Gemini مفعل
    if (!useGemini) {
      setUseGemini(true);
    }
  }, [useGemini, setUseGemini]);

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
  const openImageViewer = useCallback((image: ImageData) => {
    setSelectedImage(image);
    setIsViewerOpen(true);
  }, []);

  // وظيفة إغلاق المعاينة
  const closeImageViewer = useCallback(() => {
    setIsViewerOpen(false);
    setSelectedImage(null);
  }, []);

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
      <Header title="معالجة الوصولات" />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto px-4">
        <TabsList className="mb-6">
          <TabsTrigger value="upload">رفع الصور</TabsTrigger>
          <TabsTrigger value="list">الصور المستخرجة 
            {sessionImages.length > 0 && <span className="ml-2 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
              {sessionImages.length}
            </span>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="focus-visible:outline-none">
          <UploadTab
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            pauseProcessing={pauseProcessing}
            retryProcessing={retryProcessing}
            clearQueue={clearQueue}
            sessionImagesLength={sessionImages.length}
            handleFileChange={handleFileChange}
          />
        </TabsContent>
        
        <TabsContent value="list" className="focus-visible:outline-none">
          <ImagesTab
            images={sortedImages}
            onImageClick={openImageViewer}
            onTextChange={handleTextChange}
            onDelete={handleDelete}
            onSubmit={handleSubmitToApi}
            isSubmitting={isSubmitting}
            onReprocess={handleReprocessImage}
            clearSessionImages={clearSessionImages}
          />
        </TabsContent>
      </Tabs>
      
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

export default Index;
