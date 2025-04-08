
import React, { useEffect } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { ImageData } from '@/types/ImageData';
import FileUploader from '@/components/FileUploader';
import ImagePreviewContainer from '@/components/ImageViewer/ImagePreviewContainer';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader, AlertCircle, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';
import RecentRecords from '@/components/RecentRecords';
import DashboardHeader from '@/components/DashboardHeader';

const Index = () => {
  const {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate,
    activeUploads,
    queueLength,
    clearSessionImages,
    retryProcessing,
    pauseProcessing,
    clearQueue,
    runCleanup
  } = useImageProcessing();
  const {
    user,
    isLoading: isAuthLoading
  } = useAuth();

  // عرض رسالة التحميل أثناء التحقق من المستخدم
  if (isAuthLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل المعلومات...</p>
      </div>;
  }

  // عرض رسالة تسجيل الدخول إذا كان المستخدم غير مسجل
  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto max-w-md p-8 border rounded-2xl bg-card shadow-lg">
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <AlertCircle className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold mb-2">تنبيه</AlertTitle>
            <AlertDescription>
              يجب عليك تسجيل الدخول لاستخدام هذه الصفحة
            </AlertDescription>
          </Alert>

          <Button className="w-full rounded-xl" asChild>
            <a href="/login">تسجيل الدخول</a>
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto py-8 px-4">
        <DashboardHeader 
          isProcessing={isProcessing}
          onClearSessionImages={clearSessionImages}
          onRetryProcessing={retryProcessing}
          onPauseProcessing={pauseProcessing}
          onClearQueue={clearQueue}
          onRunCleanup={user ? () => runCleanup(user.id) : undefined}
        />
        
        <ProcessingIndicator isProcessing={isProcessing} processingProgress={processingProgress} activeUploads={activeUploads} queueLength={queueLength} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2">
            {!isProcessing && (
              <div className="mb-6">
                <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <FileUploader onFilesSelected={handleFileChange} isProcessing={isProcessing} />
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <RecentRecords />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <h2 className="text-xl font-semibold mb-4">الصور المعالجة</h2>
              <ImagePreviewContainer 
                images={images} 
                isSubmitting={false} 
                onTextChange={handleTextChange} 
                onDelete={handleDelete} 
                onSubmit={(id) => {
                  const image = images.find(img => img.id === id);
                  if (image && user) {
                    handleSubmitToApi(id, image, user.id);
                  }
                }} 
                formatDate={formatDate} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;
