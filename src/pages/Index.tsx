
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import AppHeader from "@/components/AppHeader";
import ImagePreviewContainer from "@/components/ImageViewer/ImagePreviewContainer";
import LearningStats from "@/components/LearningStats";
import DataEntrySimulator from "@/components/DataSimulator/DataEntrySimulator";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink } from "lucide-react";

const Index = () => {
  const {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi
  } = useImageProcessing();
  
  const simulatorRef = useRef<HTMLDivElement>(null);

  // التنقل إلى قسم محاكاة الإدخال
  const scrollToSimulator = () => {
    if (simulatorRef.current) {
      simulatorRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // تأخير قصير ثم تفعيل علامة التبويب "نموذج المحاكاة"
      setTimeout(() => {
        const simTab = document.querySelector('[data-simulator-tab="simulation"]');
        if (simTab) {
          simTab.dispatchEvent(new Event('click'));
          
          // محاولة تشغيل المحاكاة المباشرة
          setTimeout(() => {
            const liveSimBtn = document.querySelector('[data-simulator-tab="simulation"] button:has(.lucide-play)');
            if (liveSimBtn) {
              liveSimBtn.dispatchEvent(new Event('click'));
            }
          }, 500);
        }
      }, 500);
    }
  };

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

            {/* قسم للإعلان عن محاكاة الإدخال المباشر */}
            {images.length > 0 && (
              <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-brand-green/10 to-brand-brown/10 border border-brand-green/20">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-brand-brown dark:text-brand-beige mb-1">
                      جرب نظام محاكاة الإدخال المباشر
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      شاهد كيف يتم إدخال البيانات في النماذج بشكل تلقائي كما لو كان يكتبها شخص حقيقي
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={scrollToSimulator}
                      className="bg-brand-green hover:bg-brand-green/90"
                    >
                      <Play className="h-4 w-4 ml-2" />
                      بدء المحاكاة المباشرة
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const url = "https://aramex.com/new-shipment";
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4 ml-2" />
                      تجربة موقع خارجي
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* نظام محاكاة إدخال البيانات فقط */}
            <div className="mb-8">
              <div ref={simulatorRef} id="simulator-section">
                <DataEntrySimulator storedCount={bookmarkletStats.total} />
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
