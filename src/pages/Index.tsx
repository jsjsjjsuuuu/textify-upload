
import React, { useEffect } from 'react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import RecentRecords from '@/components/RecentRecords';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import DashboardHeader from '@/components/DashboardHeader';
import useImageStatsCalculator from '@/hooks/useImageStatsCalculator';
import AuthLoading from '@/components/Dashboard/AuthLoading';
import AuthRequired from '@/components/Dashboard/AuthRequired';
import UploaderCard from '@/components/Dashboard/UploaderCard';
import ImagesCard from '@/components/Dashboard/ImagesCard';

const Index = () => {
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
    hiddenImageIds,
    loadUserImages  // إضافة استدعاء مباشر لـ loadUserImages
  } = useImageProcessing();

  const {
    user,
    isLoading: isAuthLoading
  } = useAuth();

  const { imageStats } = useImageStatsCalculator(images);

  // إضافة استدعاء لإعادة تحميل الصور عند فتح الصفحة وتأكد من تصفيتها
  useEffect(() => {
    console.log("تحميل الصور في صفحة Index مع تصفية الصور المخفية");
    if (user && typeof loadUserImages === 'function') {
      loadUserImages();
    }
  }, [user, loadUserImages, hiddenImageIds]);

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
  
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader />
      
      <div className="container mx-auto py-6 px-4">
        <DashboardHeader 
          isProcessing={isProcessing}
          onClearSessionImages={clearSessionImages}
          onRetryProcessing={retryProcessing}
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
            <UploaderCard 
              isProcessing={isProcessing}
              onFilesSelected={handleFileChange}
            />
            
            <div className="mt-6">
              <ImagesCard
                images={images}
                isSubmitting={{}}  // تصحيح: تغيير من boolean إلى Record<string, boolean>
                onTextChange={handleTextChange}
                onDelete={handleDelete}
                onSubmit={handleSubmitToApi}
                formatDate={formatDate}
                imageStats={imageStats}
              />
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
