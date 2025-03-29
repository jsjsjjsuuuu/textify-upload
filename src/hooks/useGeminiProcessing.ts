
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { extractDataWithGemini, fileToBase64, testGeminiConnection } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";

export const useGeminiProcessing = () => {
  const [useGemini, setUseGemini] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const geminiApiKey = localStorage.getItem("geminiApiKey");
    
    // إعداد مفتاح API افتراضي إذا لم يكن موجودًا
    if (!geminiApiKey) {
      const defaultApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
      localStorage.setItem("geminiApiKey", defaultApiKey);
      console.log("تم تعيين مفتاح Gemini API افتراضي:", defaultApiKey);
      setUseGemini(true);
      // اختبار الاتصال بالمفتاح الافتراضي
      testGeminiApiConnection(defaultApiKey);
    } else {
      console.log("استخدام مفتاح Gemini API موجود بطول:", geminiApiKey.length);
      setUseGemini(true);
      // اختبار الاتصال بالمفتاح الموجود
      if (!connectionTested) {
        testGeminiApiConnection(geminiApiKey);
      }
    }
  }, [connectionTested]);

  // اختبار اتصال Gemini API
  const testGeminiApiConnection = async (apiKey: string) => {
    try {
      console.log("اختبار اتصال Gemini API...");
      const result = await testGeminiConnection(apiKey);
      if (result.success) {
        console.log("اتصال Gemini API ناجح");
        setConnectionTested(true);
      } else {
        console.warn("فشل اختبار اتصال Gemini API:", result.message);
        toast({
          title: "تحذير",
          description: `فشل اختبار اتصال Gemini API: ${result.message}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("خطأ في اختبار اتصال Gemini API:", error);
    }
  };

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    console.log("استخدام مفتاح Gemini API بطول:", geminiApiKey.length);

    // في بيئة المعاينة، نحاول استخدام Gemini مع تحذير المستخدم
    if (isPreviewEnvironment()) {
      console.log("تشغيل في بيئة معاينة (Lovable). محاولة استخدام Gemini قد تواجه قيود CORS.");
      toast({
        title: "تنبيه",
        description: "استخدام Gemini في بيئة المعاينة قد يواجه قيود CORS، يرجى التحلي بالصبر في حالة بطء المعالجة",
        variant: "default"
      });
    }

    try {
      // الكشف عن حجم الملف وتقديم تحذير إذا كان كبيرًا جدًا
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) {
        toast({
          title: "تنبيه",
          description: `حجم الصورة كبير (${fileSizeMB.toFixed(1)}MB)، قد تستغرق المعالجة وقتًا أطول`,
          variant: "default"
        });
      }
      
      console.log("تحويل الملف إلى base64");
      const imageBase64 = await fileToBase64(file);
      console.log("تم تحويل الملف إلى base64، بطول:", imageBase64.length);
      
      // تحديث الصورة لتظهر أنها قيد المعالجة
      const updatedImage: ImageData = { 
        ...image, 
        status: "processing" as const,
        extractedText: "جاري معالجة الصورة واستخراج البيانات..."
      };
      
      // إضافة معلومات تشخيصية أكثر
      console.log("بدء استدعاء extractDataWithGemini");
      console.log("إعدادات الاستخراج:", {
        apiKeyLength: geminiApiKey.length,
        imageBase64Length: imageBase64.length,
        enhancedExtraction: true,
        maxRetries: 3,
        retryDelayMs: 5000
      });
      
      const extractionResult = await extractDataWithGemini({
        apiKey: geminiApiKey,
        imageBase64,
        enhancedExtraction: true,
        maxRetries: 3,  // تقليل عدد المحاولات لتسريع الاستجابة
        retryDelayMs: 5000,  // زيادة مدة الانتظار بين المحاولات
        modelVersion: 'gemini-1.5-pro'  // استخدام النموذج الأكثر دقة
      });
      
      console.log("نتيجة استخراج Gemini:", extractionResult);
      
      if (extractionResult.success && extractionResult.data) {
        const { parsedData, extractedText } = extractionResult.data;
        
        // تحقق من وجود بيانات تم استخراجها
        if (parsedData && Object.keys(parsedData).length > 0) {
          console.log("Gemini نجح في استخراج البيانات:", parsedData);
          
          // التحقق من البيانات المستخرجة
          console.log("البيانات المستخرجة المفصلة:", {
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

          // تحديث الصورة بالبيانات المستخرجة
          const processedImage = updateImageWithExtractedData(
            image,
            extractedText || "",
            parsedData || {},
            parsedData.confidence ? parseInt(String(parsedData.confidence)) : 95,
            "gemini"
          );
          
          // تحقق من تحديث الصورة بشكل صحيح
          console.log("الصورة المحدثة بعد الاستخراج:", {
            code: processedImage.code,
            senderName: processedImage.senderName,
            phoneNumber: processedImage.phoneNumber,
            province: processedImage.province,
            price: processedImage.price,
            companyName: processedImage.companyName
          });
          
          // تعيين الحالة استنادًا إلى وجود البيانات الرئيسية
          let finalImage: ImageData = processedImage;
          
          if (finalImage.code || finalImage.senderName || finalImage.phoneNumber) {
            finalImage = {
              ...finalImage,
              status: "completed" as const
            };
          } else {
            finalImage = {
              ...finalImage,
              status: "pending" as const
            };
          }
          
          return finalImage;
        } else {
          console.log("Gemini أرجع بيانات فارغة");
          
          // إذا كان هناك نص مستخرج ولكن لا يوجد بيانات منظمة
          if (extractedText && extractedText.length > 10) {
            toast({
              title: "تم استخراج النص",
              description: "تم استخراج النص ولكن لم يتم التعرف على البيانات المنظمة",
              variant: "default"
            });
            
            return {
              ...image,
              status: "pending" as const,
              extractedText: extractedText
            };
          } else {
            toast({
              title: "تنبيه",
              description: "لم يتمكن Gemini من استخراج بيانات من الصورة، يرجى محاولة تحميل صورة أوضح",
              variant: "default"
            });
            
            return {
              ...image,
              status: "pending" as const,
              extractedText: "لم يتم استخراج نص. حاول مرة أخرى بصورة أوضح."
            };
          }
        }
      } else {
        console.log("فشل استخراج Gemini:", extractionResult.message);
        
        toast({
          title: "فشل الاستخراج",
          description: "فشل استخراج البيانات: " + extractionResult.message,
          variant: "destructive"
        });
        
        // إعادة الصورة مع حالة خطأ
        return {
          ...image,
          status: "error" as const,
          extractedText: "فشل استخراج النص: " + extractionResult.message
        };
      }
    } catch (geminiError: any) {
      console.error("خطأ في معالجة Gemini:", geminiError);
      
      // تحسين رسالة الخطأ
      let errorMessage = geminiError.message || 'خطأ غير معروف';
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك والمحاولة مرة أخرى.';
      } else if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError')) {
        errorMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى تحميل صورة أصغر حجمًا أو المحاولة مرة أخرى لاحقًا.';
      }
      
      toast({
        title: "خطأ",
        description: `فشل في استخراج البيانات: ${errorMessage}`,
        variant: "destructive"
      });
      
      // إعادة الصورة مع حالة خطأ
      return {
        ...image,
        status: "error" as const,
        extractedText: "خطأ في المعالجة: " + errorMessage
      };
    }
  };

  return { useGemini, processWithGemini };
};
