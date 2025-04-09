
import React, { useEffect } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { ImageData } from '@/types/ImageData';
import FileUploader from '@/components/FileUploader';
import ImagePreviewContainer from '@/components/ImageViewer/ImagePreviewContainer';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader, AlertCircle, Upload, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';
import RecentRecords from '@/components/RecentRecords';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// دالة للتحقق من اكتمال الصورة
const isImageComplete = (image: ImageData): boolean => {
  return !!(
    image.code && 
    image.senderName && 
    image.province && 
    image.price
  );
};

// دالة للتحقق من وجود خطأ في رقم الهاتف
const hasPhoneError = (image: ImageData): boolean => {
  return !!image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, "").length !== 11;
};

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
  
  // حساب عدد الصور لكل حالة
  const imageStats = {
    all: images.length,
    pending: images.filter(img => img.status === "pending").length,
    processing: images.filter(img => img.status === "processing").length,
    completed: images.filter(img => img.status === "completed").length,
    incomplete: images.filter(img => img.status === "completed" && !isImageComplete(img) && !hasPhoneError(img)).length,
    error: images.filter(img => img.status === "error" || hasPhoneError(img)).length
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto py-6 px-4">
        <DashboardHeader 
          isProcessing={isProcessing}
          onClearSessionImages={clearSessionImages}
          onRetryProcessing={retryProcessing}
          onPauseProcessing={pauseProcessing}
          onClearQueue={clearQueue}
          onRunCleanup={user ? () => runCleanup(user.id) : undefined}
        />
        
        <ProcessingIndicator 
          isProcessing={isProcessing} 
          processingProgress={processingProgress} 
          activeUploads={activeUploads} 
          queueLength={queueLength} 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-3">
            <Card className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-0">
                <CardTitle>تحميل الصور</CardTitle>
              </CardHeader>
              <CardContent>
                {!isProcessing && (
                  <div className="mt-4">
                    <FileUploader onFilesSelected={handleFileChange} isProcessing={isProcessing} />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle>الصور المعالجة</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-slate-100">الكل {imageStats.all}</Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">قيد الانتظار {imageStats.pending}</Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">مكتملة {imageStats.completed}</Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">أخطاء {imageStats.error}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-4 w-full justify-start">
                      <TabsTrigger value="all">الكل</TabsTrigger>
                      <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
                      <TabsTrigger value="completed">مكتملة</TabsTrigger>
                      <TabsTrigger value="incomplete">غير مكتملة</TabsTrigger>
                      <TabsTrigger value="error">أخطاء</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-0">
                      <ImagePreviewContainer 
                        images={images} 
                        isSubmitting={Object.values(isSubmitting).some(Boolean)} 
                        onTextChange={handleTextChange} 
                        onDelete={handleDelete} 
                        onSubmit={(id) => handleSubmitToApi(id)} 
                        formatDate={formatDate} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="pending" className="mt-0">
                      <ImagePreviewContainer 
                        images={images.filter(img => img.status === "pending")}
                        isSubmitting={Object.values(isSubmitting).some(Boolean)} 
                        onTextChange={handleTextChange} 
                        onDelete={handleDelete} 
                        onSubmit={(id) => handleSubmitToApi(id)} 
                        formatDate={formatDate} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="completed" className="mt-0">
                      <ImagePreviewContainer 
                        images={images.filter(img => img.status === "completed" && isImageComplete(img))}
                        isSubmitting={Object.values(isSubmitting).some(Boolean)} 
                        onTextChange={handleTextChange} 
                        onDelete={handleDelete} 
                        onSubmit={(id) => handleSubmitToApi(id)} 
                        formatDate={formatDate} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="incomplete" className="mt-0">
                      <ImagePreviewContainer 
                        images={images.filter(img => img.status === "completed" && !isImageComplete(img) && !hasPhoneError(img))}
                        isSubmitting={Object.values(isSubmitting).some(Boolean)} 
                        onTextChange={handleTextChange} 
                        onDelete={handleDelete} 
                        onSubmit={(id) => handleSubmitToApi(id)} 
                        formatDate={formatDate} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="error" className="mt-0">
                      <ImagePreviewContainer 
                        images={images.filter(img => img.status === "error" || hasPhoneError(img))}
                        isSubmitting={Object.values(isSubmitting).some(Boolean)} 
                        onTextChange={handleTextChange} 
                        onDelete={handleDelete} 
                        onSubmit={(id) => handleSubmitToApi(id)} 
                        formatDate={formatDate} 
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* إضافة آخر السجلات في أسفل الصفحة */}
        <div className="container mx-auto px-4 mt-8">
          <RecentRecords />
        </div>
      </div>
    </div>
  );
};

export default Index;
