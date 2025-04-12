
import React, { useEffect, Suspense } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import DashboardHeader from '@/components/DashboardHeader';
import AuthLoading from '@/components/Dashboard/AuthLoading';
import AuthRequired from '@/components/Dashboard/AuthRequired';
import UploaderCard from '@/components/Dashboard/UploaderCard';
import { motion } from 'framer-motion';
import { lazy } from 'react';

// استخدام التحميل الكسول للمكونات الثقيلة
const OptimizedImagePreviewContainer = lazy(() => import('@/components/OptimizedImagePreviewContainer'));

// عناصر الخلفية للتصميم
const GlassmorphismBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    {/* تم تعديل الشفافية لتكون أقل ظهورًا ومتناسقة مع الخلفية */}
    <div className="glass-bg-element from-indigo-600/10 to-purple-600/5 w-96 h-96 top-12 -left-24"></div>
    <div className="glass-bg-element from-blue-600/10 to-indigo-600/5 w-96 h-96 bottom-24 -right-12"></div>
    <div className="glass-bg-element from-violet-600/5 to-purple-600/5 w-80 h-80 bottom-12 left-1/3"></div>
  </div>
);

// الحاوية للمحتوى المحمل بشكل كسول
const SuspenseFallback = () => (
  <div className="flex items-center justify-center h-64 w-full">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-200">جاري تحميل العارض...</p>
    </div>
  </div>
);

const Upload = () => {
  const {
    images,
    isProcessing,
    processingProgress,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    formatDate,
    activeUploads,
    queueLength,
    clearSessionImages,
    retryProcessing,
    clearQueue,
    runCleanup,
    hideImage,
    hiddenImageIds
  } = useImageProcessing();

  const {
    user,
    isLoading: isAuthLoading
  } = useAuth();

  // تسجيل معلومات التشخيص
  useEffect(() => {
    console.log("قائمة معرّفات الصور المخفية:", hiddenImageIds);
    
    if (typeof hideImage === 'function') {
      console.log("تم تحميل وظيفة hideImage بنجاح");
    } else {
      console.error("خطأ: وظيفة hideImage غير معرّفة أو ليست دالة", typeof hideImage);
    }
  }, [hideImage, hiddenImageIds]);

  // عرض رسالة التحميل أثناء التحقق من المستخدم
  if (isAuthLoading) {
    return <AuthLoading />;
  }

  // عرض رسالة تسجيل الدخول إذا كان المستخدم غير مسجل
  if (!user) {
    return <AuthRequired />;
  }
  
  // تأثيرات الحركة للواجهة
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };
  
  return (
    <div className="min-h-screen app-background relative" dir="rtl">
      <GlassmorphismBackground />
      <AppHeader />
      
      <motion.div 
        className="container mx-auto py-6 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <DashboardHeader 
            isProcessing={isProcessing}
            onClearSessionImages={clearSessionImages}
            onRetryProcessing={retryProcessing}
            onClearQueue={clearQueue}
            onRunCleanup={user ? () => runCleanup(user.id) : undefined}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <ProcessingIndicator 
            isProcessing={isProcessing} 
            processingProgress={processingProgress} 
            activeUploads={activeUploads} 
            queueLength={queueLength} 
          />
        </motion.div>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          <motion.div variants={itemVariants}>
            {/* تطبيق تأثير الطبق على بطاقة التحميل */}
            <div className="dish-container">
              <div className="dish-glow-top"></div>
              <div className="dish-glow-bottom"></div>
              <div className="dish-reflection"></div>
              <div className="dish-inner-shadow"></div>
              <div className="relative z-10 p-6">
                <UploaderCard 
                  isProcessing={isProcessing}
                  onFilesSelected={handleFileChange}
                />
              </div>
            </div>
          </motion.div>
            
          <motion.div variants={itemVariants} className="mt-6">
            <div className="dish-container">
              <div className="dish-glow-top"></div>
              <div className="dish-glow-bottom"></div>
              <div className="dish-reflection"></div>
              <div className="dish-inner-shadow"></div>
              <div className="relative z-10 p-6">
                <Suspense fallback={<SuspenseFallback />}>
                  <OptimizedImagePreviewContainer
                    images={images}
                    isSubmitting={false}
                    onTextChange={handleTextChange}
                    onDelete={handleDelete}
                    onSubmit={handleSubmitToApi}
                    formatDate={formatDate}
                  />
                </Suspense>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Upload;
