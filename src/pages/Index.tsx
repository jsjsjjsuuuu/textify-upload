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
import { ImageData } from '@/types/ImageData';
import { Progress } from '@/components/ui/progress';

// أضف هذا النوع هنا
interface UploadLimitInfo {
  subscription: string;
  dailyLimit: number;
  currentCount: number;
  remainingUploads: number;
}

const Index = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  // أضف حالة لمعلومات حدود التحميل
  const [uploadLimitInfo, setUploadLimitInfo] = useState<UploadLimitInfo>({
    subscription: 'standard',
    dailyLimit: 3,
    currentCount: 0,
    remainingUploads: 3
  });

  // استدعاء hook بشكل ثابت في كل مرة يتم فيها استدعاء الـ hook
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

  // إضافة وظيفة handleImageClick داخل المكون بدلاً من توقع وجودها في hook
  const handleImageClick = (image: ImageData) => {
    console.log("تم النقر على الصورة:", image.id);
    // يمكن إضافة أي منطق إضافي هنا للتعامل مع النقر على الصورة
  };

  // إضافة وظيفة handleCancelUpload داخل المكون
  const handleCancelUpload = () => {
    console.log("تم طلب إلغاء التحميل");
    // يمكن استدعاء وظيفة إلغاء التحميل أو إيقاف المعالجة هنا
    if (pauseProcessing) {
      pauseProcessing();
      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء عملية التحميل بنجاح"
      });
    }
  };

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
  
  // تعديل وظيفة handleFileChange لتتوافق مع نوع (files: File[])
  const handleImageUploadWrapped = (files: File[]) => {
    // تحويل مصفوفة الملفات إلى كائن FileList
    if (files && files.length > 0) {
      // إنشاء كائن شبيه بـ FileList
      const dataTransfer = new DataTransfer();
      files.forEach(file => {
        dataTransfer.items.add(file);
      });
      const fileList = dataTransfer.files;
      
      // استدعاء الدالة الأصلية مع كائن FileList
      handleFileChange(fileList);
    }
  };
  
  return <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="pt-10 pb-20">
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="text-center max-w-3xl mx-auto mb-12">
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
              
              {/* معلومات الباقة وحدود التحميل */}
              {user && uploadLimitInfo && <div className="mt-6 p-4 bg-muted/30 border border-muted/50 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-2">
                  <div className="text-sm text-muted-foreground mb-2 md:mb-0">
                    <span className="font-semibold">الباقة: </span> 
                    <Badge className={`mr-1 ${
                      uploadLimitInfo.subscription === 'pro' ? 'bg-blue-500' :
                      uploadLimitInfo.subscription === 'vip' ? 'bg-purple-500' : 
                      'bg-gray-500'
                    }`}>
                      {uploadLimitInfo.subscription === 'pro' ? 'PRO' :
                       uploadLimitInfo.subscription === 'vip' ? 'VIP' : 
                       'العادية'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold">المتبقي اليوم: </span>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300">
                      {uploadLimitInfo.remainingUploads} / {uploadLimitInfo.dailyLimit}
                    </Badge>
                  </div>
                </div>
                
                <div className="w-full mt-2">
                  <Progress 
                    value={(uploadLimitInfo.currentCount / uploadLimitInfo.dailyLimit) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    استهلاك {uploadLimitInfo.currentCount} من أصل {uploadLimitInfo.dailyLimit} صورة ({Math.round((uploadLimitInfo.currentCount / uploadLimitInfo.dailyLimit) * 100)}%)
                  </p>
                </div>
                
                {uploadLimitInfo.remainingUploads === 0 && <div className="mt-3">
                  <Alert className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
                    <AlertDescription className="text-yellow-800 dark:text-yellow-300 text-sm">
                      لقد وصلت إلى الحد اليومي للصور. سيتم تجديد الرصيد غداً، أو يمكنك ترقية باقتك للحصول على المزيد من الصور.
                    </AlertDescription>
                  </Alert>
                </div>}
                
                {uploadLimitInfo.subscription === 'standard' && <div className="mt-3 text-center">
                  <Link to="/profile" className="text-sm text-primary hover:underline">
                    ترقية الباقة للحصول على المزيد من المميزات
                  </Link>
                </div>}
              </div>}
              
              {/* معلومات حول حالة المعالجة */}
              {(isProcessing || queueLength > 0) && <Alert className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                  <AlertDescription className="text-sm text-blue-600 dark:text-blue-300 flex items-center justify-between">
                    <div>
                      جاري معالجة الصور... 
                      <div className="mt-1 space-x-2 rtl:space-x-reverse">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                          الصور النشطة: {activeUploads}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                          في قائمة الانتظار: {queueLength}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handlePauseProcessing} className="text-yellow-600 border-yellow-300 bg-yellow-50 hover:bg-yellow-100">
                        <Pause className="h-3 w-3 ml-1" />
                        إيقاف مؤقت
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleRetryProcessing} className="text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100">
                        <RefreshCw className="h-3 w-3 ml-1" />
                        إعادة تشغيل
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>}
              
              {/* معلومات عن ميزة تنظيف البيانات */}
              
            </motion.div>
          </div>
        </section>
        
        <section className="py-16 px-6 bg-transparent">
          <div className="container mx-auto bg-transparent">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-3xl shadow-sm overflow-hidden backdrop-blur-sm border border-muted">
                <div className="p-8">
                  <h2 className="text-2xl font-medium mb-2 text-center text-primary-foreground/90">تحميل الصور</h2>
                  <p className="text-muted-foreground text-center text-sm mb-6">ارفــع الصـــور هنــا </p>
                  
                  {user && uploadLimitInfo.remainingUploads === 0 ? (
                    <div className="p-8 text-center">
                      <Alert className="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
                        <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                          لقد وصلت إلى الحد اليومي للصور ({uploadLimitInfo.dailyLimit} صورة). سيتم تجديد الرصيد غداً، أو يمكنك
                          <Link to="/profile" className="mx-1 text-primary hover:underline font-semibold">
                            ترقية باقتك
                          </Link>
                          للحصول على المزيد من الصور.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <ImageUploader 
                      isProcessing={isProcessing} 
                      processingProgress={processingProgress} 
                      onFileChange={handleImageUploadWrapped} 
                      onCancelUpload={handleCancelUpload} 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {sessionImages.length > 0 && <section className="py-16 px-6">
            <div className="container mx-auto">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">الصور التي تم رفعها</h2>
                  
                  {(isProcessing || queueLength > 0) && <div className="flex gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        الصور النشطة: {activeUploads}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        في قائمة الانتظار: {queueLength}
                      </Badge>
                    </div>}
                </div>
                <p className="text-muted-foreground mb-8">
                  هذه الصور التي تم رفعها في الجلسة الحالية. ستتم معالجتها وحفظها في السجلات.
                </p>
                <ImagePreviewContainer images={sessionImages} isSubmitting={isSubmitting} onTextChange={handleTextChange} onDelete={handleDelete} onSubmit={id => handleSubmitToApi(id)} formatDate={formatImageDate} showOnlySession={true} onReprocess={handleReprocessImage} onImageClick={handleImageClick} />
              </div>
            </div>
          </section>}
          
        {/* عرض رابط للسجلات */}
        <section className="py-16 px-6 bg-transparent">
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
    </div>;
};
export default Index;
