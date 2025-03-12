
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useOcrProcessing } from "@/hooks/useOcrProcessing";
import { useGeminiProcessing } from "@/hooks/useGeminiProcessing";
import { useSubmitToApi } from "@/hooks/useSubmitToApi";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useDataValidation } from "@/hooks/useDataValidation";
import { useTextHandler } from "@/hooks/useTextHandler";
import { useToast } from "@/hooks/use-toast";

export const useImageProcessing = () => {
  const { images, addImage, updateImage, deleteImage, handleTextChange } = useImageState();
  const { processWithOcr } = useOcrProcessing();
  const { useGemini, processWithGemini } = useGeminiProcessing();
  const { isSubmitting, handleSubmitToApi: submitToApi } = useSubmitToApi(updateImage);
  const { toast } = useToast();
  
  const {
    isProcessing,
    processingProgress,
    setIsProcessing,
    setProcessingProgress,
    calculateStartingNumber,
    createNewImage,
    validateFile,
    validatePreviewUrl,
    updateProgress
  } = useFileUpload(images, addImage);

  const { validateSubmitData } = useDataValidation();
  const { handleCustomTextChange } = useTextHandler(handleTextChange);

  const handleFileChange = async (files: FileList | null) => {
    console.log("handleFileChange called with files:", files);
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const fileArray = Array.from(files);
    console.log("Processing", fileArray.length, "files");
    
    const startingNumber = calculateStartingNumber();
    let processedFiles = 0;
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      console.log("Processing file:", file.name, "type:", file.type);
      
      if (!validateFile(file)) continue;
      
      const previewUrl = createNewImage(file, "", startingNumber, i).previewUrl;
      console.log("Created preview URL:", previewUrl);
      
      if (!validatePreviewUrl(previewUrl)) continue;
      
      const newImage = createNewImage(file, previewUrl, startingNumber, i);
      addImage(newImage);
      
      try {
        let processedImage: ImageData;
        
        if (useGemini) {
          processedImage = await processWithGemini(file, newImage, processWithOcr);
        } else {
          processedImage = await processWithOcr(file, newImage);
        }
        
        updateImage(newImage.id, processedImage);
      } catch (error) {
        console.error("General error in image processing:", error);
        updateImage(newImage.id, { status: "error" });
        
        toast({
          title: "فشل في استخراج النص",
          description: "حدث خطأ أثناء معالجة الصورة",
          variant: "destructive"
        });
      }
      
      processedFiles++;
      updateProgress(processedFiles, fileArray.length);
    }
    
    setIsProcessing(false);
    
    if (processedFiles > 0) {
      toast({
        title: "تم معالجة الصور بنجاح",
        description: `تم معالجة ${processedFiles} صورة${useGemini ? " باستخدام Gemini AI" : ""}`,
        variant: "default"
      });
    }
  };

  const handleSubmitToApi = (id: string) => {
    const image = images.find(img => img.id === id);
    if (image && validateSubmitData(image)) {
      submitToApi(id, image);
    }
  };

  return {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    handleFileChange,
    handleTextChange: handleCustomTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi
  };
};
