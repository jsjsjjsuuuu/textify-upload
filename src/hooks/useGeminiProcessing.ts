
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { extractDataWithGemini, fileToBase64 } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";

export const useGeminiProcessing = () => {
  const [useGemini, setUseGemini] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const geminiApiKey = localStorage.getItem("geminiApiKey");
    
    // Always set a default API key if none exists
    if (!geminiApiKey) {
      const defaultApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
      localStorage.setItem("geminiApiKey", defaultApiKey);
      console.log("Set default Gemini API key:", defaultApiKey);
      setUseGemini(true);
    } else {
      console.log("Using existing Gemini API key of length:", geminiApiKey.length);
      setUseGemini(true);
    }
  }, []);

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    console.log("Using Gemini API key of length:", geminiApiKey.length);

    // في بيئة المعاينة، نحاول استخدام Gemini مع تحذير المستخدم
    if (isPreviewEnvironment()) {
      console.log("Running in preview environment (Lovable). Attempting to use Gemini but may face CORS restrictions.");
      toast({
        title: "تنبيه",
        description: "استخدام Gemini في بيئة المعاينة قد يواجه قيود CORS",
        variant: "default"
      });
    }

    try {
      console.log("Converting file to base64");
      const imageBase64 = await fileToBase64(file);
      console.log("File converted to base64, length:", imageBase64.length);
      
      console.log("Calling extractDataWithGemini");
      const extractionResult = await extractDataWithGemini({
        apiKey: geminiApiKey,
        imageBase64,
        enhancedExtraction: true,
        maxRetries: 5,  // زيادة عدد المحاولات للتغلب على أخطاء الشبكة
        retryDelayMs: 1000  // انتظار ثانية واحدة بين المحاولات
      });
      console.log("Gemini extraction result:", extractionResult);
      
      if (extractionResult.success && extractionResult.data) {
        const { parsedData, extractedText } = extractionResult.data;
        
        // تحقق من وجود بيانات تم استخراجها
        if (parsedData && Object.keys(parsedData).length > 0) {
          console.log("Gemini successfully extracted data:", parsedData);
          
          // التحقق من البيانات المستخرجة وعرضها في السجل
          console.log("استخراج البيانات المفصلة:", {
            code: parsedData.code,
            senderName: parsedData.senderName,
            phoneNumber: parsedData.phoneNumber,
            province: parsedData.province,
            price: parsedData.price,
            companyName: parsedData.companyName
          });
          
          toast({
            title: "تم الاستخراج بنجاح",
            description: "تم استخراج البيانات باستخدام Gemini AI",
          });

          // تحسين: التأكد من تحديث جميع الحقول في الصورة
          const updatedImage = updateImageWithExtractedData(
            image,
            extractedText || "",
            parsedData || {},
            parsedData.confidence ? parseInt(String(parsedData.confidence)) : 95,
            "gemini"
          );
          
          // تحقق من تحديث الصورة بشكل صحيح
          console.log("الصورة المحدثة بعد الاستخراج:", {
            code: updatedImage.code,
            senderName: updatedImage.senderName,
            phoneNumber: updatedImage.phoneNumber,
            province: updatedImage.province,
            price: updatedImage.price,
            companyName: updatedImage.companyName
          });
          
          // تعيين الحالة استنادًا إلى وجود البيانات الرئيسية
          if (updatedImage.code || updatedImage.senderName || updatedImage.phoneNumber) {
            updatedImage.status = "completed";
          } else {
            updatedImage.status = "pending";
          }
          
          return updatedImage;
        } else {
          console.log("Gemini returned empty data");
          toast({
            title: "تنبيه",
            description: "لم يتمكن Gemini من استخراج بيانات من الصورة",
            variant: "default"  // تم تغيير "warning" إلى "default" لتصحيح الخطأ
          });
          
          // إعادة الصورة مع حالة انتظار
          return {
            ...image,
            status: "pending",
            extractedText: extractedText || "لم يتم استخراج نص"
          };
        }
      } else {
        console.log("Gemini extraction failed:", extractionResult.message);
        
        toast({
          title: "فشل الاستخراج",
          description: "فشل استخراج البيانات: " + extractionResult.message,
          variant: "destructive"
        });
        
        // إعادة الصورة مع حالة خطأ
        return {
          ...image,
          status: "error",
          extractedText: "فشل استخراج النص: " + extractionResult.message
        };
      }
    } catch (geminiError: any) {
      console.error("Error in Gemini processing:", geminiError);
      
      // تحسين رسالة الخطأ لتكون أكثر تفصيلاً وفائدة
      let errorMessage = geminiError.message || 'خطأ غير معروف';
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك والمحاولة مرة أخرى.';
      }
      
      toast({
        title: "خطأ",
        description: `فشل في استخراج البيانات: ${errorMessage}`,
        variant: "destructive"
      });
      
      // إعادة الصورة مع حالة خطأ
      return {
        ...image,
        status: "error",
        extractedText: "خطأ في المعالجة: " + errorMessage
      };
    }
  };

  return { useGemini, processWithGemini };
};
