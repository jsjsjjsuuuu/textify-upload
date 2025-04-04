import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { ImageData } from '@/types/ImageData';
import FileUploader from '@/components/FileUploader';
import ImageViewer from '@/components/ImageViewer';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import { EmptyContent } from '@/components/EmptyContent';
import ImageList from '@/components/ImageList';
import ProcessingInfo from '@/components/ProcessingInfo';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  
  // تحميل الصور عند تسجيل الدخول - تم إصلاح الخطأ هنا
  useEffect(() => {
    if (user) {
      // استدعاء loadUserImages بدون معلمات
      loadUserImages();
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

  // تهيئة منطقة السحب والإفلات
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp', '.tiff']
    },
    onDrop: async (acceptedFiles: File[]) => {
      console.log(`تم استلام ${acceptedFiles.length} ملف`);
      await handleFileChange(acceptedFiles);
    }
  });

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
          {/* قسم رفع الملفات */}
          <div className="space-y-6">
            {/* الإعدادات العامة - Gemini مفعل دائمًا */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <span className="text-sm ml-2">استخدام Gemini AI:</span>
                  <input
                    type="checkbox"
                    checked={true} // دائمًا مفعل
                    disabled={true} // غير قابل للتعديل
                    className="ml-1 w-4 h-4"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {isProcessing ? (
                  <Button size="sm" variant="outline" onClick={pauseProcessing}>
                    إيقاف مؤقت
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={retryProcessing} disabled={!sessionImages.length}>
                    استئناف
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={clearQueue} disabled={!isProcessing}>
                  مسح القائمة
                  </Button>
              </div>
            </div>
            
            {/* معلومات المعالجة */}
            <ProcessingInfo 
              isProcessing={isProcessing} 
              progress={processingProgress} 
            />
            
            {/* منطقة السحب والإفلات */}
            <FileUploader
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="focus-visible:outline-none">
          {/* عرض الصور */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">الصور المستخرجة</h2>
              <div className="flex gap-2">
                {sortedImages.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => {
                    if (window.confirm('هل أنت متأكد من رغبتك في مسح جميع الصور؟')) {
                      clearSessionImages();
                    }
                  }}>
                    مسح الكل
                  </Button>
                )}
              </div>
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
                description="لم يتم رفع أي صور بعد. يرجى استخدام قسم الرفع أعلاه."
                icon="image"
              />
            )}
          </div>
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
