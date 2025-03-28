
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { extractTextFromImage } from "@/lib/ocrService";
import { parseDataFromOCRText, updateImageWithExtractedData } from "@/utils/imageDataParser";
import { useToast } from "@/hooks/use-toast";

export const useOcrProcessing = () => {
  const { toast } = useToast();
  const [ocrProgress, setOcrProgress] = useState(0);

  const processWithOcr = async (file: File, image: ImageData): Promise<ImageData> => {
    try {
      console.log("Calling extractTextFromImage for OCR");
      
      // إظهار تنبيه بالتحول إلى OCR للمستخدم
      toast({
        title: "استخدام OCR البسيط",
        description: "جاري استخراج النص باستخدام OCR البديل",
        variant: "default"
      });
      
      // تحديث حالة الصورة إلى معالجة
      const updatedImage: ImageData = {
        ...image,
        status: "processing" as const,
        extractedText: "جاري معالجة الصورة باستخدام OCR البسيط..."
      };
      
      // تنفيذ OCR مع تقدم
      const result = await extractTextFromImage(file, (progress) => {
        setOcrProgress(progress);
      });
      
      console.log("OCR result:", result);
      
      // تحديث وإظهار رسالة للمستخدم بعد إتمام OCR
      if (result.success) {
        toast({
          title: "تم استخراج النص",
          description: "تم معالجة الصورة باستخدام OCR البسيط",
        });
      }
      
      // محاولة تحليل البيانات من نص OCR
      const extractedData = parseDataFromOCRText(result.text);
      console.log("Parsed data from OCR text:", extractedData);
      
      // تحقق من وجود بيانات مستخرجة
      const hasExtractedData = extractedData && 
        Object.keys(extractedData).some(key => 
          extractedData[key] && extractedData[key].trim() !== ''
        );
      
      // إذا تم استخراج بيانات، أظهر رسالة نجاح
      if (hasExtractedData) {
        toast({
          title: "تم استخراج البيانات",
          description: "تم التعرف على بعض البيانات من OCR",
        });
      } else {
        toast({
          title: "استخراج محدود",
          description: "تم استخراج النص ولكن لم يتم التعرف على بيانات منظمة",
          variant: "default"
        });
      }
      
      return updateImageWithExtractedData(
        image, 
        result.text, 
        extractedData, 
        result.confidence, 
        "ocr"
      );
    } catch (ocrError) {
      console.error("OCR processing error:", ocrError);
      
      toast({
        title: "فشل في استخراج النص",
        description: "حدث خطأ أثناء معالجة الصورة باستخدام OCR",
        variant: "destructive"
      });
      
      return {
        ...image,
        status: "error"
      };
    } finally {
      // إعادة تعيين تقدم OCR
      setOcrProgress(0);
    }
  };

  return { processWithOcr, ocrProgress };
};
