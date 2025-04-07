
import React, { useEffect } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { ImageData } from '@/types/ImageData';
import FileUploader from '@/components/FileUploader';
import ImagePreviewContainer from '@/components/ImageViewer/ImagePreviewContainer';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  } = useImageProcessing();

  const { user, isLoading: isAuthLoading } = useAuth();

  // إعادة تحميل صور المستخدم عند تغيير المستخدم
  useEffect(() => {
    if (user && !isAuthLoading) {
      // تم حذف loadUserImages() حيث أنه لم يعد مطلوباً بعد إزالة الأزرار المتعلقة بالسجلات
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

  return (
    <div className="container mx-auto py-6">
      {/* تم تعديل ترويسة لوحة التحكم لإزالة الأزرار غير المطلوبة */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">إدارة ومعالجة الصور والبيانات المستخرجة</p>
      </div>
      
      {/* تم إزالة قسم BookmarkletDashboard */}
      
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
