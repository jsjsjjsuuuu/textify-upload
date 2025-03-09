
import { useEffect } from "react";
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import AppHeader from "@/components/AppHeader";
import ImagePreviewContainer from "@/components/ImageViewer/ImagePreviewContainer";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { formatDate } from "@/utils/dateFormatter";

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

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 py-8 mx-auto max-w-6xl">
        <AppHeader />

        <div className="grid grid-cols-1 gap-8">
          <ImageUploader 
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            useGemini={useGemini}
            onFileChange={handleFileChange}
          />

          <ImagePreviewContainer 
            images={images}
            isSubmitting={isSubmitting}
            onTextChange={handleTextChange}
            onDelete={handleDelete}
            onSubmit={handleSubmitToApi}
            formatDate={formatDate}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
