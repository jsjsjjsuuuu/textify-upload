
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import AppHeader from "@/components/AppHeader";
import ImagePreviewContainer from "@/components/ImageViewer/ImagePreviewContainer";
import LearningStats from "@/components/LearningStats";
import BookmarkletGenerator from "@/components/BookmarkletGenerator";
import DataEntrySimulator from "@/components/DataSimulator/DataEntrySimulator";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { getStorageStats } from "@/utils/bookmarkletService";
import { useEffect, useState, useRef } from "react";
import { ImageData } from "@/types/ImageData";

const Index = () => {
  const {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi
  } = useImageProcessing();

  const [bookmarkletStats, setBookmarkletStats] = useState({
    total: 0,
    ready: 0
  });
  
  const simulatorRef = useRef<HTMLDivElement>(null);

  // تحديث إحصائيات البوكماركلت عند تحميل الصفحة وكل دقيقة
  useEffect(() => {
    // الدالة التي تقوم بتحديث الإحصائيات
    const updateStats = () => {
      console.log("تحديث إحصائيات البوكماركلت");
      const stats = getStorageStats();
      setBookmarkletStats({
        total: stats.total,
        ready: stats.ready
      });
    };

    // تحديث الإحصائيات عند التحميل الأولي
    updateStats();

    // إعداد مؤقت لتحديث الإحصائيات كل دقيقة
    const intervalId = setInterval(updateStats, 60000);

    // تنظيف المؤقت عند إزالة المكون
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // تحديث إحصائيات البوكماركلت عند تغيير الصور (بتأخير لتجنب التحديثات المتكررة)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("تحديث إحصائيات البوكماركلت بعد تغيير الصور");
      const stats = getStorageStats();
      setBookmarkletStats({
        total: stats.total,
        ready: stats.ready
      });
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [images]);

  // وظيفة wrapper لمعالجة توقيع الدالة للحفاظ على التوافق مع واجهة ImagePreviewContainer
  const handleDeleteImage = (id: string) => {
    handleDelete(id);
  };

  // تعديل وظيفة wrapper للإرسال لتتوافق مع واجهة ImagePreviewContainer
  const handleSubmit = (id: string) => {
    // البحث عن الصورة المطلوبة باستخدام المعرف
    const image = images.find(img => img.id === id);
    if (image) {
      handleSubmitToApi(id, image);
    }
  };
  
  // التنقل إلى قسم محاكاة الإدخال
  const scrollToSimulator = () => {
    if (simulatorRef.current) {
      simulatorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />

        <div className="flex flex-col items-center justify-center pt-4">
          <div className="w-full flex justify-center mx-auto">
            <ImageUploader 
              isProcessing={isProcessing}
              processingProgress={processingProgress}
              useGemini={useGemini}
              onFileChange={handleFileChange}
            />
          </div>

          <div className="w-full mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-3">
                <LearningStats />
              </div>
            </div>

            {/* مكوّنات الأدوات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* محاكي إدخال البيانات */}
              <div ref={simulatorRef} id="simulator-section">
                <DataEntrySimulator storedCount={bookmarkletStats.total} />
              </div>
              
              {/* أداة البوكماركلت */}
              <div>
                <BookmarkletGenerator 
                  images={images} 
                  storedCount={bookmarkletStats.total}
                  readyCount={bookmarkletStats.ready}
                />
              </div>
            </div>

            <ImagePreviewContainer 
              images={images}
              isSubmitting={isSubmitting}
              onTextChange={handleTextChange}
              onDelete={handleDeleteImage}
              onSubmit={handleSubmit}
              formatDate={formatDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
