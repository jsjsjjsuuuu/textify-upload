
import { extractTextFromImage } from "@/lib/ocrService";
import { parseDataFromOCRText, updateImageWithExtractedData } from "@/utils/imageDataParser";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useOcrProcessing = () => {
  const { toast } = useToast();

  const processWithOcr = async (file: File, image: ImageData): Promise<ImageData> => {
    try {
      console.log("بدء معالجة الصورة باستخدام OCR التقليدي:", file.name);
      
      // استخراج النص من الصورة
      const result = await extractTextFromImage(file, { 
        language: 'ara+eng', 
        quality: 'balanced' 
      });
      
      console.log("نتيجة OCR:", { 
        text: result.text.substring(0, 100) + "...", 
        confidence: result.confidence 
      });
      
      // تحليل البيانات من النص المستخرج
      const extractedData = parseDataFromOCRText(result.text);
      console.log("البيانات المستخرجة من OCR:", extractedData);
      
      // تحديث بيانات الصورة بالبيانات المستخرجة
      const updatedImage = updateImageWithExtractedData(
        image, 
        result.text, 
        extractedData,
        result.confidence,
        "ocr"
      );
      
      return updatedImage;
    } catch (ocrError) {
      console.error("خطأ في معالجة OCR:", ocrError);
      
      toast({
        title: "فشل في استخراج النص",
        description: "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive"
      });
      
      return {
        ...image,
        status: "error" as const,
        extractedText: "حدث خطأ أثناء استخراج النص من الصورة."
      };
    }
  };

  return { processWithOcr };
};
