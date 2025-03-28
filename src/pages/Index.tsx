
import React, { useEffect, useState } from 'react';
import { ArrowRight, Info, Trash2, RefreshCw } from 'lucide-react';
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

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // استدعاء hook بشكل ثابت في كل تحميل للمكون
  const {
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
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
    saveProcessedImage
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
        description: "تم تنظيف السجلات القديمة بنجاح",
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
        description: "تمت إعادة معالجة الصورة بنجاح",
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
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="pt-10 pb-20">
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }} 
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <h1 className="apple-header mb-4">معالج الصور والبيانات</h1>
              <p className="text-xl text-muted-foreground mb-8">
                استخرج البيانات من الصور بسهولة وفعالية باستخدام تقنية الذكاء الاصطناعي المتطورة
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="apple-button bg-primary text-primary-foreground" size="lg">
                  ابدأ الآن
                </Button>
                <Button variant="outline" className="apple-button" size="lg" asChild>
                  <Link to="/records">
                    استعراض السجلات
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              {/* معلومات عن ميزة تنظيف البيانات */}
              <Alert className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm text-blue-600 dark:text-blue-300">
                  لتحسين أداء النظام، يتم الاحتفاظ فقط بأحدث 100 سجل. السجلات القديمة يتم حذفها تلقائياً.
                  <div className="mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleManualCleanup} 
                      className="text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      تنفيذ التنظيف الآن
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          </div>
        </section>
        
        <section className="py-16 px-6 bg-transparent">
          <div className="container mx-auto bg-transparent">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
                <div className="p-8">
                  <h2 className="apple-subheader mb-4 text-center">تحميل الصور</h2>
                  <p className="text-muted-foreground text-center mb-6">قم بتحميل صور الإيصالات أو الفواتير وسنقوم باستخراج البيانات منها تلقائياً</p>
                  <ImageUploader 
                    isProcessing={isProcessing} 
                    processingProgress={processingProgress} 
                    useGemini={useGemini} 
                    onFileChange={handleFileChange} 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {sessionImages.length > 0 && (
          <section className="py-16 px-6">
            <div className="container mx-auto">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">الصور التي تم رفعها</h2>
                <p className="text-muted-foreground mb-8">
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
        <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800/20">
          <div className="container mx-auto">
            <div className="max-w-7xl mx-auto text-center">
              <h2 className="text-3xl font-medium tracking-tight mb-6">سجلات الوصولات</h2>
              <p className="text-muted-foreground mb-8">
                يمكنك الاطلاع على جميع سجلات الوصولات والبيانات المستخرجة في صفحة السجلات
              </p>
              <Button size="lg" className="apple-button" asChild>
                <Link to="/records">
                  عرض جميع السجلات
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8 bg-transparent">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              نظام استخراج البيانات - &copy; {new Date().getFullYear()}
            </p>
            <div className="flex gap-4">
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
