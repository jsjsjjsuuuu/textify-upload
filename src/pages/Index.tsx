
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import AppHeader from "@/components/AppHeader";
import ImagePreviewContainer from "@/components/ImageViewer/ImagePreviewContainer";
import LearningStats from "@/components/LearningStats";
import DataEntrySimulator from "@/components/DataSimulator/DataEntrySimulator";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [showDemo, setShowDemo] = useState(false);
  const [simulationUrl, setSimulationUrl] = useState("");
  
  // استرجاع عنوان URL الخارجي عند التحميل
  useEffect(() => {
    const externalUrl = localStorage.getItem('external_form_url');
    if (externalUrl) {
      setSimulationUrl(externalUrl);
    }
  }, []);

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
            <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-brand-green/10 to-brand-brown/10 border border-brand-green/20">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="text-lg font-medium text-brand-brown dark:text-brand-beige mb-1">
                    جرب نظام محاكاة الإدخال المباشر
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    شاهد كيف يتم إدخال البيانات في نموذج مال الشلال للشحن بشكل تلقائي
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
                </div>
              </div>
            </div>

            {/* عرض فيديو شرح أو صورة متحركة توضيحية */}
            {showDemo && (
              <div className="mb-8 p-4 rounded-lg border bg-card">
                <div className="flex items-center mb-3">
                  <Video className="h-5 w-5 ml-2 text-brand-green" />
                  <h3 className="text-lg font-medium">طريقة الاستخدام في موقع مال الشلال</h3>
                </div>
                <div className="relative pt-[56.25%] bg-muted rounded-md overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <p className="text-lg font-medium mb-2">عرض توضيحي لاستخدام النظام في موقع مال الشلال:</p>
                      <ol className="text-right list-decimal list-inside space-y-2 mb-4">
                        <li>انتقل إلى نموذج المحاكاة أدناه</li>
                        <li>اضغط على زر "بدء المحاكاة المباشرة"</li>
                        <li>شاهد كيف يتم إدخال البيانات تلقائياً في النموذج</li>
                        <li>يمكنك التحكم في سرعة الإدخال من خلال الخيارات المتاحة</li>
                        <li>بعد اكتمال العملية، سيتم حفظ البيانات تلقائياً</li>
                      </ol>
                      <img 
                        src="/lovable-uploads/e3521185-21aa-443a-ae91-7a1b8f5c5400.png" 
                        alt="صورة توضيحية للمحاكاة"
                        className="max-w-full h-auto rounded-lg shadow-md mx-auto" 
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDemo(false)}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            )}

            {/* نظام محاكاة إدخال البيانات فقط */}
            <div className="mb-8">
              <div ref={simulatorRef} id="simulator-section">
                <DataEntrySimulator 
                  storedCount={bookmarkletStats.total} 
                  externalUrl={simulationUrl}
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
