
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

  // عرض رسالة التحميل أثناء التحقق من المستخدم
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل المعلومات...</p>
      </div>
    );
  }

  // عرض رسالة تسجيل الدخول إذا كان المستخدم غير مسجل
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">لوحة التحكم</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">إدارة ومعالجة الصور والبيانات المستخرجة</p>
        </div>
        
        <ProcessingIndicator 
          isProcessing={isProcessing}
          processingProgress={processingProgress}
          activeUploads={activeUploads}
          queueLength={queueLength}
        />
        
        {!isProcessing && (
          <div className="mb-10 max-w-2xl mx-auto">
            <div className="bg-card border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="mr-2 h-5 w-5 text-primary" />
                تحميل الصور
              </h2>
              <FileUploader 
                onFilesSelected={handleFileChange}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}
        
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-center">الصور المعالجة</h2>
          
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
    </div>
  );
};

export default Index;
