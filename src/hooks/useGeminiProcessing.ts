
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

  const processWithGemini = async (file: File, image: ImageData, fallbackProcessor: (file: File, image: ImageData) => Promise<ImageData>): Promise<ImageData> => {
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    console.log("Using Gemini API key of length:", geminiApiKey.length);

    // في بيئة المعاينة، استخدم المعالج الاحتياطي مباشرة بسبب قيود CORS
    if (isPreviewEnvironment()) {
      console.log("Running in preview environment (Lovable). Using fallback processor instead of Gemini due to CORS restrictions.");
      toast({
        title: "تنبيه",
        description: "استخدام OCR التقليدي في بيئة المعاينة بسبب قيود CORS",
        variant: "default"
      });
      
      try {
        // استخدام المعالج الاحتياطي ومعالجة البيانات الناتجة
        const processedImage = await fallbackProcessor(file, image);
        
        // تأكد من أن البيانات المستخرجة موجودة ومرئية
        console.log("تم استخراج البيانات بنجاح:", {
          code: processedImage.code,
          senderName: processedImage.senderName,
          phoneNumber: processedImage.phoneNumber,
          province: processedImage.province,
          price: processedImage.price,
          companyName: processedImage.companyName
        });
        
        // تعيين الحالة استنادًا إلى وجود البيانات الرئيسية
        if (processedImage.code || processedImage.senderName || processedImage.phoneNumber) {
          processedImage.status = "completed";
        }
        
        return processedImage;
      } catch (error) {
        console.error("خطأ في المعالج الاحتياطي:", error);
        toast({
          title: "خطأ في المعالجة",
          description: "فشل في استخراج البيانات باستخدام OCR التقليدي",
          variant: "destructive"
        });
        
        // إرجاع الصورة مع حالة خطأ
        return {
          ...image,
          status: "error"
        };
      }
    }

    try {
      console.log("Converting file to base64");
      const imageBase64 = await fileToBase64(file);
      console.log("File converted to base64, length:", imageBase64.length);
      
      console.log("Calling extractDataWithGemini");
      const extractionResult = await extractDataWithGemini({
        apiKey: geminiApiKey,
        imageBase64,
        enhancedExtraction: true
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
          
          return updatedImage;
        } else {
          console.log("Gemini returned empty data, falling back to OCR");
          
          toast({
            title: "تنبيه",
            description: "لم يتم استخراج بيانات من Gemini، جاري استخدام OCR التقليدي",
            variant: "default"
          });
          
          // استخدام المعالج الاحتياطي مع تسجيل البيانات المستخرجة
          const processedImage = await fallbackProcessor(file, image);
          console.log("بيانات المعالج الاحتياطي:", {
            code: processedImage.code,
            senderName: processedImage.senderName,
            phoneNumber: processedImage.phoneNumber,
            province: processedImage.province,
            price: processedImage.price,
            companyName: processedImage.companyName
          });
          
          return processedImage;
        }
      } else {
        console.log("Gemini extraction failed, falling back to OCR:", extractionResult.message);
        
        toast({
          title: "تنبيه",
          description: "تم استخدام OCR التقليدي بسبب: " + extractionResult.message,
          variant: "default"
        });
        
        // استخدام المعالج الاحتياطي مع تسجيل البيانات المستخرجة
        const processedImage = await fallbackProcessor(file, image);
        console.log("بيانات المعالج الاحتياطي بعد فشل Gemini:", {
          code: processedImage.code,
          senderName: processedImage.senderName,
          phoneNumber: processedImage.phoneNumber,
          province: processedImage.province,
          price: processedImage.price,
          companyName: processedImage.companyName
        });
        
        return processedImage;
      }
    } catch (geminiError) {
      console.error("Error in Gemini processing:", geminiError);
      
      toast({
        title: "تنبيه",
        description: "تم استخدام OCR التقليدي بسبب خطأ في Gemini",
        variant: "default"
      });
      
      // استخدام المعالج الاحتياطي مع تسجيل البيانات المستخرجة
      const processedImage = await fallbackProcessor(file, image);
      console.log("بيانات المعالج الاحتياطي بعد خطأ Gemini:", {
        code: processedImage.code,
        senderName: processedImage.senderName,
        phoneNumber: processedImage.phoneNumber,
        province: processedImage.province,
        price: processedImage.price,
        companyName: processedImage.companyName
      });
      
      return processedImage;
    }
  };

  return { useGemini, processWithGemini };
};
