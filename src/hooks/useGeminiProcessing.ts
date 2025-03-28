
import { geminiExtractData } from "@/lib/gemini/service";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useGeminiProcessing = () => {
  const { toast } = useToast();

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    try {
      console.log("بدء معالجة الصورة باستخدام Gemini AI:", file.name);
      
      // تحويل الصورة إلى قاعدة64 لإرسالها إلى Gemini
      const fileArrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(fileArrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      
      // استخراج البيانات باستخدام Gemini
      const result = await geminiExtractData(
        base64Data, 
        file.type
      );
      
      if (!result || !result.data) {
        console.error("فشل Gemini في استخراج البيانات", result);
        throw new Error("فشل في استخراج البيانات باستخدام Gemini");
      }
      
      // نستخرج النص والبيانات من النتيجة
      const extractedText = result.data.extractedText || "";
      const parsedData = result.data;
      
      console.log("نتيجة Gemini:", { 
        text: extractedText.substring(0, 100) + "...",
        data: parsedData
      });
      
      // تحديث بيانات الصورة بالبيانات المستخرجة من Gemini
      const updatedImage: ImageData = {
        ...image,
        extractedText: extractedText,
        code: parsedData.code || "",
        senderName: parsedData.senderName || "",
        phoneNumber: parsedData.phoneNumber || "",
        province: parsedData.province || "",
        price: parsedData.price || "",
        companyName: parsedData.companyName || "",
        confidence: result.data.confidence || 85,
        status: "completed" as const,
        extractionMethod: "gemini" as const
      };
      
      return updatedImage;
    } catch (error) {
      console.error("خطأ في معالجة الصورة باستخدام Gemini:", error);
      
      toast({
        title: "فشل في معالجة الصورة",
        description: "حدث خطأ أثناء معالجة الصورة باستخدام Gemini",
        variant: "destructive"
      });
      
      // في حالة حدوث خطأ مع Gemini، نقوم بتحديث حالة الصورة إلى خطأ
      return {
        ...image,
        status: "error" as const,
        extractedText: "حدث خطأ أثناء معالجة الصورة باستخدام Gemini."
      };
    }
  };

  return { processWithGemini };
};
