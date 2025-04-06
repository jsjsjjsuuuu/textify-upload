
import React, { useEffect } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { ImageData } from '@/types/ImageData';
import FileUploader from '@/components/FileUploader';
import ImagePreviewContainer from '@/components/ImageViewer/ImagePreviewContainer';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import DashboardHeader from '@/components/DashboardHeader';
import BookmarkletDashboard from '@/components/BookmarkletDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader, AlertCircle, Upload } from 'lucide-react';

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
    clearSessionImages,
    loadUserImages,
    runCleanupNow,
    activeUploads,
    queueLength,
    retryProcessing,
    bookmarkletStats = { total: 0, ready: 0, success: 0, error: 0 } // قيمة افتراضية
  } = useImageProcessing();

  const { user, isLoading: isAuthLoading } = useAuth();

  // إعادة تحميل صور المستخدم عند تغيير المستخدم
  useEffect(() => {
    if (user && !isAuthLoading) {
      loadUserImages();
    }
  }, [user, isAuthLoading]);

  // عرض رسالة التحميل أثناء التحقق من المستخدم
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل المعلومات...</p>
      </div>
    );
  }

  // عرض رسالة تسجيل الدخول إذا كان المستخدم غير مسجل
  if (!user) {
    return (
      <div className="container mx-auto mt-10 p-6 max-w-md border rounded-lg bg-background">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>تنبيه</AlertTitle>
          <AlertDescription>
            يجب عليك تسجيل الدخول لاستخدام هذه الصفحة
          </AlertDescription>
        </Alert>

        <Button className="w-full" asChild>
          <a href="/login">تسجيل الدخول</a>
        </Button>
      </div>
    );
  }

  // تنفيذ وظيفة تنظيف السجلات القديمة
  const handleRunCleanup = () => {
    if (user) {
      runCleanupNow(user.id);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <DashboardHeader 
        isProcessing={isProcessing}
        onClearSessionImages={clearSessionImages}
        onRetryProcessing={retryProcessing}
        onRunCleanup={handleRunCleanup}
      />
      
      <BookmarkletDashboard bookmarkletStats={bookmarkletStats} />
      
      <ProcessingIndicator 
        isProcessing={isProcessing}
        processingProgress={processingProgress}
        activeUploads={activeUploads}
        queueLength={queueLength}
      />
      
      {!isProcessing && (
        <div className="mb-6">
          <FileUploader 
            onFilesSelected={handleFileChange}
            isProcessing={isProcessing}
          />
        </div>
      )}
      
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">الصور المعالجة</h2>
        
        <ImagePreviewContainer
          images={images}
          isSubmitting={isSubmitting}
          onTextChange={handleTextChange}
          onDelete={handleDelete}
          onSubmit={handleSubmitToApi}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default Index;
