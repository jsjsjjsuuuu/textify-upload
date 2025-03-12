
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import AppHeader from "@/components/AppHeader";
import ImagePreviewContainer from "@/components/ImageViewer/ImagePreviewContainer";
import LearningStats from "@/components/LearningStats";
import WebsiteCrawlForm from "@/components/WebsiteCrawlForm";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const [activeTab, setActiveTab] = useState<string>("images");

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />

        <div className="flex flex-col items-center justify-center pt-4">
          <Tabs 
            defaultValue="images" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-[400px] mx-auto mb-6">
              <TabsTrigger value="images">استخراج من الصور</TabsTrigger>
              <TabsTrigger value="website">استخراج من المواقع</TabsTrigger>
            </TabsList>
            
            <TabsContent value="images" className="w-full">
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

                <ImagePreviewContainer 
                  images={images}
                  isSubmitting={isSubmitting}
                  onTextChange={handleTextChange}
                  onDelete={handleDelete}
                  onSubmit={handleSubmitToApi}
                  formatDate={formatDate}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="website" className="w-full">
              <div className="w-full flex justify-center mx-auto">
                <WebsiteCrawlForm />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
