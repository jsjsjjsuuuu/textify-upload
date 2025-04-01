
import React, { useEffect, useState } from 'react';
import { ArrowRight, Info, Trash2, RefreshCw, Clock, Pause } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import ImageUploader from '@/components/ImageUploader';
import { useDataFormatting } from '@/hooks/useDataFormatting';
import { motion } from 'framer-motion';
import DirectExportTools from '@/components/DataExport/DirectExportTools';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import ImagePreviewContainer from '@/components/ImageViewer/ImagePreviewContainer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  // استدعاء hook بشكل ثابت في كل تحميل للمكون
  const {
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate: formatImageDate,
    clearSessionImages,
    loadUserImages,
    runCleanupNow,
    saveProcessedImage,
    activeUploads,
    queueLength,
    retryProcessing,
    pauseProcessing,
    clearQueue
  } = useImageProcessing();
  
  const {
    formatPhoneNumber,
    formatPrice,
    formatProvinceName
  } = useDataFormatting();

  // وظيفة تنفيذ التنظيف يدوياً
  const handleManualCleanup = async () => {
    if (user) {
      await runCleanupNow(user.id);
      // إعادة تحميل الصور بعد التنظيف
      loadUserImages();
      toast({
        title: "تم التنظيف",
        description: "تم تنظيف السجلات القديمة بنجاح"
      });
    }
  };

  // وظيفة إعادة المعالجة للصورة
  const handleReprocessImage = async (imageId: string) => {
    const imageToReprocess = sessionImages.find(img => img.id === imageId);
    if (!imageToReprocess) {
      console.error("الصورة غير موجودة:", imageId);
      return;
    }
    try {
      // تحديث حالة الصورة إلى "جاري المعالجة"
      handleTextChange(imageId, "status", "processing");

      // إعادة معالجة الصورة
      await saveProcessedImage(imageToReprocess);
      toast({
        title: "تمت إعادة المعالجة",
        description: "تمت إعادة معالجة الصورة بنجاح"
      });
    } catch (error) {
      console.error("خطأ في إعادة معالجة الصورة:", error);
      handleTextChange(imageId, "status", "error");
      handleTextChange(imageId, "extractedText", `فشل في إعادة المعالجة: ${error.message || "خطأ غير معروف"}`);
      toast({
        title: "خطأ في إعادة المعالجة",
        description: "حدث خطأ أثناء إعادة معالجة الصورة",
        variant: "destructive"
      });
      throw error; // إعادة رمي الخطأ للتعامل معه في المكون الأصلي
    }
  };

  // إعادة تشغيل المعالجة إذا توقفت عن العمل
  const handleRetryProcessing = () => {
    if (retryProcessing()) {
      toast({
        title: "إعادة تشغيل",
        description: "تم إعادة تشغيل قائمة المعالجة بنجاح"
      });
    } else {
      toast({
        title: "تنبيه",
        description: "لا توجد صور في قائمة الانتظار حالياً",
        variant: "default"
      });
    }
  };

  // إيقاف المعالجة مؤقتًا
  const handlePauseProcessing = () => {
    if (pauseProcessing()) {
      toast({
        title: "إيقاف مؤقت",
        description: "تم إيقاف قائمة المعالجة مؤقتًا"
      });
    } else {
      toast({
        title: "تنبيه",
        description: "لا توجد عمليات معالجة نشطة حاليًا",
        variant: "default"
      });
    }
  };

  // وظيفة مسح القائمة
  const handleClearQueue = () => {
    clearQueue();
    toast({
      title: "تم المسح",
      description: "تم مسح قائمة انتظار المعالجة"
    });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="pt-8 pb-16">
        <section className="py-10 px-6">
          <div className="container max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h1 className="text-4xl font-medium text-center mb-3">معالج الصور والبيانات</h1>
              <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-8">
                استخرج البيانات من الصور بسهولة باستخدام تقنية الذكاء الاصطناعي المتطورة
              </p>

              <Card className="max-w-3xl mx-auto bg-white/50 dark:bg-black/5 backdrop-blur border-muted/30 shadow-sm">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-medium text-center mb-4">تحميل الصور</h2>
                  <p className="text-muted-foreground text-center mb-6">
                    قم بتحميل صور الإيصالات أو الفواتير وسنقوم باستخراج البيانات منها تلقائياً
                  </p>
                  <ImageUploader 
                    isProcessing={isProcessing} 
                    processingProgress={processingProgress} 
                    onFileChange={handleFileChange}
                  />
                </CardContent>
              </Card>
              
              {/* معلومات حول حالة المعالجة */}
              {(isProcessing || queueLength > 0) && (
                <div className="max-w-3xl mx-auto mt-6">
                  <Alert className="bg-blue-50/70 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                    <AlertDescription className="text-sm text-blue-600 dark:text-blue-300 flex items-center justify-between">
                      <div>
                        جاري معالجة الصور... 
                        <div className="mt-1 space-x-2 rtl:space-x-reverse">
                          <Badge variant="outline" className="bg-blue-100/70 text-blue-700 border-blue-300">
                            الصور النشطة: {activeUploads}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-100/70 text-blue-700 border-blue-300">
                            في قائمة الانتظار: {queueLength}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handlePauseProcessing} className="text-yellow-600 border-yellow-300 bg-yellow-50/70 hover:bg-yellow-100">
                          <Pause className="h-3 w-3 ml-1" />
                          إيقاف مؤقت
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleRetryProcessing} className="text-blue-600 border-blue-300 bg-blue-50/70 hover:bg-blue-100">
                          <RefreshCw className="h-3 w-3 ml-1" />
                          إعادة تشغيل
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </motion.div>
          </div>
        </section>
        
        {sessionImages.length > 0 && (
          <section className="py-10 px-6">
            <div className="container max-w-6xl mx-auto">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-medium">الصور التي تم رفعها</h2>
                  
                  {(isProcessing || queueLength > 0) && (
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-blue-100/70 text-blue-700 border-blue-300">
                        الصور النشطة: {activeUploads}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100/70 text-blue-700 border-blue-300">
                        في قائمة الانتظار: {queueLength}
                      </Badge>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground mb-6">
                  هذه الصور التي تم رفعها في الجلسة الحالية. ستتم معالجتها وحفظها في السجلات.
                </p>
                <ImagePreviewContainer 
                  images={sessionImages} 
                  isSubmitting={isSubmitting} 
                  onTextChange={handleTextChange} 
                  onDelete={handleDelete} 
                  onSubmit={id => handleSubmitToApi(id)} 
                  formatDate={formatImageDate} 
                  showOnlySession={true} 
                  onReprocess={handleReprocessImage} 
                />
              </div>
            </div>
          </section>
        )}
          
        {/* عرض رابط للسجلات */}
        <section className="py-12 px-6 bg-muted/20">
          <div className="container max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-medium mb-4">سجلات الوصولات</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              يمكنك الاطلاع على جميع سجلات الوصولات والبيانات المستخرجة في صفحة السجلات
            </p>
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link to="/records">
                عرض جميع السجلات
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8 bg-transparent">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              نظام استخراج البيانات - &copy; {new Date().getFullYear()}
            </p>
            <div className="flex gap-6">
              <Link to="/records" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                السجلات
              </Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                الملف الشخصي
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
