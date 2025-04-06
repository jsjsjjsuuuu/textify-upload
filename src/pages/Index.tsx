
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploader from '@/components/FileUploader';
import ImagePreviewContainer from '@/components/ImageViewer/ImagePreviewContainer';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import DashboardHeader from '@/components/DashboardHeader';
import BookmarkletDashboard from '@/components/BookmarkletDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useImageProcessing } from '@/hooks/useImageProcessing';

const Page = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upload");

  // استخدام معالجة الصور
  const {
    images,
    isLoadingUserImages,
    isProcessing,
    processingProgress,
    currentlyProcessingId,
    isSubmitting,
    // أزلنا bookmarkletStats لأنه غير موجود
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate,
    clearSessionImages,
    loadUserImages,
    runCleanupNow,
    saveProcessedImage,
    activeUploads,
    queueLength,
    retryProcessing,
    pauseProcessing,
    clearQueue,
    getProcessingState
  } = useImageProcessing();

  // تحميل صور المستخدم عند تغيير المستخدم
  useEffect(() => {
    if (user) {
      loadUserImages(user.id);
    } else {
      clearSessionImages();
    }
  }, [user, loadUserImages, clearSessionImages]);

  // تأكيد مغادرة الصفحة إذا كان هناك صور قيد المعالجة
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing || activeUploads > 0) {
        e.preventDefault();
        e.returnValue = ""; // الرسالة لن تظهر في معظم المتصفحات الحديثة، ولكن البرمجة تطلب ذلك
        return "";
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProcessing, activeUploads]);

  // فلترة الصور لعرض فقط تلك التي لم يتم إرسالها
  const pendingImages = images.filter(img => !img.submitted);

  // فلترة الصور لعرض فقط الصور المؤقتة (جلسة)
  const sessionImages = images.filter(img => img.sessionImage === true);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col min-h-screen">
      <DashboardHeader 
        onCleanupClick={runCleanupNow}
        processingState={getProcessingState()} 
        user={user}
        pendingCount={pendingImages.length} 
        queueLength={queueLength}
        isProcessing={isProcessing}
        onRetryClick={retryProcessing}
        onPauseClick={pauseProcessing}
        onClearQueueClick={clearQueue}
      />

      <Tabs 
        defaultValue="upload" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-2 w-full md:w-1/2">
            <TabsTrigger value="upload">تحميل الصور</TabsTrigger>
            <TabsTrigger value="bookmarklet">إضافة للنظام</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1">
          <TabsContent value="upload" className="flex-1 flex flex-col">
            <FileUploader onFilesSelected={handleFileChange} isProcessing={isProcessing} />
            
            {isProcessing && (
              <ProcessingIndicator 
                progress={processingProgress} 
                currentId={currentlyProcessingId || ''} 
                queueLength={queueLength}
                activeUploads={activeUploads}
              />
            )}
            
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 text-center">الصور المستخرجة</h2>
              <ImagePreviewContainer 
                images={pendingImages} 
                isSubmitting={isSubmitting}
                onTextChange={handleTextChange}
                onDelete={handleDelete}
                onSubmit={handleSubmitToApi}
                formatDate={formatDate}
              />
            </div>
          </TabsContent>

          <TabsContent value="bookmarklet" className="flex-1">
            {/* استخدم BookmarkletDashboard مع المتغيرات المتاحة فقط */}
            <BookmarkletDashboard
              user={user}
              saveImage={saveProcessedImage}
              isProcessing={isProcessing}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Page;
