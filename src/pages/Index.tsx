
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import AppHeader from "@/components/AppHeader";
import ImagePreviewContainer from "@/components/ImageViewer/ImagePreviewContainer";
import LearningStats from "@/components/LearningStats";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import CompanySelector from "@/components/CompanySelector";

const Index = () => {
  const {
    images,
    isLoading,
    isProcessing,
    processingProgress,
    isSubmitting,
    retryCount,
    useGemini,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    handleRetrySubmitToApi
  } = useImageProcessing();
  
  const { activeCompany } = useAuth();

  // إضافة مستمع للرسائل من النوافذ الأخرى
  useEffect(() => {
    const handleMessages = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        console.log("تم استلام رسالة من نافذة أخرى:", event.data);
      }
    };
    
    window.addEventListener("message", handleMessages);
    
    return () => {
      window.removeEventListener("message", handleMessages);
    };
  }, []);

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />
        
        {activeCompany && (
          <div className="flex items-center justify-between mb-6 mt-2">
            <div className="flex items-center gap-2">
              {activeCompany.logoUrl && (
                <img 
                  src={activeCompany.logoUrl} 
                  alt={activeCompany.name} 
                  className="h-10 w-10 object-contain bg-white p-1 rounded-md shadow-sm" 
                />
              )}
              <h2 className="text-xl font-semibold">{activeCompany.name}</h2>
            </div>
            <CompanySelector />
          </div>
        )}

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

            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Spinner className="h-8 w-8 text-brand-green mb-4" />
                <p className="text-lg text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
              </div>
            ) : (
              <ImagePreviewContainer 
                images={images}
                isSubmitting={isSubmitting}
                onTextChange={handleTextChange}
                onDelete={handleDelete}
                onSubmit={handleSubmitToApi}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
