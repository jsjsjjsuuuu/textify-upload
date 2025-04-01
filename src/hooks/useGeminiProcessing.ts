
import { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { 
  extractDataWithGemini, 
  fileToBase64, 
  testGeminiConnection,
  getNextApiKey,
  reportApiKeyError,
  getApiKeyStats,
  resetAllApiKeys
} from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";

export const useGeminiProcessing = () => {
  const [useGemini, setUseGemini] = useState(true); // تعيين القيمة الافتراضية إلى true
  const [connectionTested, setConnectionTested] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // فحص الاتصال مع مجموعة المفاتيح
    const testConnection = async () => {
      if (!connectionTested) {
        const apiKey = getNextApiKey();
        console.log("اختبار اتصال Gemini API عند بدء التشغيل...");
        await testGeminiApiConnection(apiKey);
      }
    };
    
    testConnection();
  }, [connectionTested]);

  // اختبار اتصال Gemini API
  const testGeminiApiConnection = async (apiKey: string) => {
    try {
      console.log("اختبار اتصال Gemini API...");
      const result = await testGeminiConnection(apiKey);
      if (result.success) {
        console.log("اتصال Gemini API ناجح");
        setConnectionTested(true);
        setUseGemini(true);
        toast({
          title: "اتصال ناجح",
          description: "تم الاتصال بـ Gemini AI بنجاح",
        });
      } else {
        console.warn("فشل اختبار اتصال Gemini API:", result.message);
        
        // محاولة مرة أخرى
        console.log("محاولة إعادة اتصال...");
        setTimeout(async () => {
          const newResult = await testGeminiConnection(apiKey);
          if (newResult.success) {
            console.log("نجح الاتصال في المحاولة الثانية!");
            setConnectionTested(true);
            setUseGemini(true);
          } else {
            toast({
              title: "تحذير",
              description: `فشل الاتصال بـ Gemini AI: ${result.message}`,
              variant: "destructive"
            });
            setUseGemini(false);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("خطأ في اختبار اتصال Gemini API:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الاتصال بخدمة Gemini AI، جاري استخدام المعالجة الداخلية",
        variant: "destructive"
      });
      setUseGemini(false);
    }
  };

  // وظيفة للتأخير المضمون بين طلبات API
  const sleepBetweenRequests = async (milliseconds: number) => {
    console.log(`تأخير ${milliseconds}ms بين طلبات API...`);
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
  };

  // زيادة التأخير بين الطلبات
  const getApiDelayTime = (apiStats: { active: number, rateLimited: number }) => {
    // ثابت 2 ثواني للتأخير
    return 2000;
  };

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    // الحصول على المفتاح التالي
    const geminiApiKey = getNextApiKey();
    console.log("استخدام مفتاح Gemini API:", geminiApiKey.substring(0, 5) + "...");

    // تحديث الصورة لتظهر أنها قيد المعالجة
    const processingImage: ImageData = { 
      ...image, 
      status: "processing" as const,
      extractedText: "جاري معالجة الصورة واستخراج البيانات..."
    };

    try {
      // الكشف عن حجم الملف وتقديم تحذير إذا كان كبيرًا جدًا
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) {
        console.log(`حجم الصورة كبير (${fileSizeMB.toFixed(1)}MB)، قد تستغرق المعالجة وقتًا أطول`);
      }
      
      console.log("تحويل الملف إلى base64");
      const imageBase64 = await fileToBase64(file);
      console.log("تم تحويل الملف إلى base64، بطول:", imageBase64.length);
      
      // الحصول على إحصائيات المفاتيح لتحديد وقت التأخير
      const apiStats = getApiKeyStats();
      // تأخير قبل الاستخراج
      await sleepBetweenRequests(getApiDelayTime(apiStats));
      
      // إضافة معلومات تشخيصية
      console.log("بدء استدعاء extractDataWithGemini");
      console.log("إعدادات الاستخراج:", {
        apiKeyLength: geminiApiKey.length,
        imageBase64Length: imageBase64.length,
        enhancedExtraction: true,
        maxRetries: 2,
        retryDelayMs: 2000
      });
      
      const extractionResult = await extractDataWithGemini({
        apiKey: geminiApiKey,
        imageBase64,
        enhancedExtraction: true,
        maxRetries: 2,
        retryDelayMs: 2000,
        modelVersion: 'gemini-1.5-flash'
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
        
        // الإبلاغ عن الخطأ لمدير المفاتيح
        reportApiKeyError(geminiApiKey, extractionResult.message || "خطأ غير معروف");
        
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
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(geminiApiKey, geminiError.message || "خطأ غير معروف");
      
      // تحسين رسالة الخطأ
      let errorMessage = geminiError.message || 'خطأ غير معروف';
      
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

  // وظيفة إعادة تعيين جميع مفاتيح API
  const resetApiKeys = useCallback(() => {
    resetAllApiKeys();
    toast({
      title: "تم إعادة تعيين المفاتيح",
      description: "تم إعادة تعيين جميع مفاتيح API",
    });
  }, [toast]);

  return { 
    useGemini, 
    processWithGemini,
    resetApiKeys,
    getApiStats: getApiKeyStats
  };
};
