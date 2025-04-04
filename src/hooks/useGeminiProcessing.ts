
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
import { toast as sonnerToast } from "sonner";

export const useGeminiProcessing = () => {
  const [useGemini, setUseGemini] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // فحص الاتصال مع مجموعة المفاتيح
    const testConnection = async () => {
      if (!connectionTested) {
        const apiKey = getNextApiKey();
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
      } else {
        console.warn("فشل اختبار اتصال Gemini API:", result.message);
        // محاولة مفتاح آخر
        const newKey = getNextApiKey();
        if (newKey !== apiKey) {
          await testGeminiApiConnection(newKey);
        } else {
          toast({
            title: "تحذير",
            description: `فشل اختبار اتصال Gemini API: ${result.message}`,
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error("خطأ في اختبار اتصال Gemini API:", error);
      // إظهار رسالة خطأ مفصلة للمساعدة في تشخيص المشكلة
      sonnerToast.error(
        "خطأ في اتصال Gemini API",
        {
          description: `نوع الخطأ: ${error instanceof Error ? error.name : "غير معروف"}\nرسالة الخطأ: ${error instanceof Error ? error.message : String(error)}`
        }
      );
    }
  };

  // وظيفة للتأخير المضمون بين طلبات API
  const sleepBetweenRequests = async (milliseconds: number) => {
    console.log(`تأخير ${milliseconds}ms بين طلبات API...`);
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
  };

  // زيادة التأخير بين الطلبات
  const getApiDelayTime = (apiStats: { active: number, rateLimited: number }) => {
    // زيادة التأخير كلما قل عدد المفاتيح النشطة
    if (apiStats.active <= 1) {
      return 5000; // 5 ثوانٍ عندما يكون هناك مفتاح واحد فقط
    } else if (apiStats.active <= 2) {
      return 3000; // 3 ثوانٍ عندما يكون هناك مفتاحان
    } else {
      return 1500; // 1.5 ثانية للمفاتيح الثلاثة أو أكثر
    }
  };

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    // الحصول على المفتاح التالي من نظام الدوران
    const geminiApiKey = getNextApiKey();
    console.log("استخدام مفتاح Gemini API بطول:", geminiApiKey.length);

    // في بيئة المعاينة، نحاول استخدام Gemini مع تحذير المستخدم
    if (isPreviewEnvironment()) {
      console.log("تشغيل في بيئة معاينة (Lovable). محاولة استخدام Gemini قد تواجه قيود CORS.");
      sonnerToast.warning(
        "تنبيه",
        {
          description: "استخدام Gemini في بيئة المعاينة قد يواجه قيود CORS، يرجى التحلي بالصبر في حالة بطء المعالجة"
        }
      );
    }

    try {
      // الكشف عن حجم الملف وتقديم تحذير إذا كان كبيرًا جدًا
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) {
        sonnerToast.warning(
          "تنبيه",
          {
            description: `حجم الصورة كبير (${fileSizeMB.toFixed(1)}MB)، قد تستغرق المعالجة وقتًا أطول`
          }
        );
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
      
      // الحصول على إحصائيات المفاتيح لتحديد وقت التأخير
      const apiStats = getApiKeyStats();
      // تأخير قبل الاستخراج لمنع تجاوز حد الاستخدام
      await sleepBetweenRequests(getApiDelayTime(apiStats));
      
      // إضافة معلومات تشخيصية أكثر
      console.log("بدء استدعاء extractDataWithGemini");
      console.log("إعدادات الاستخراج:", {
        apiKeyLength: geminiApiKey.length,
        imageBase64Length: imageBase64.length,
        enhancedExtraction: true,
        maxRetries: 2, // تقليل عدد المحاولات
        retryDelayMs: 3000 // تقليل وقت الانتظار بين المحاولات
      });
      
      const extractionResult = await extractDataWithGemini({
        apiKey: geminiApiKey,
        imageBase64,
        enhancedExtraction: true,
        maxRetries: 2,
        retryDelayMs: 3000,
        modelVersion: 'gemini-1.5-flash'  // استخدام نموذج أسرع
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
          
          sonnerToast.success(
            "تم الاستخراج بنجاح",
            {
              description: "تم استخراج البيانات باستخدام Gemini AI"
            }
          );

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
            sonnerToast.warning(
              "تم استخراج النص",
              {
                description: "تم استخراج النص ولكن لم يتم التعرف على البيانات المنظمة"
              }
            );
            
            return {
              ...image,
              status: "pending" as const,
              extractedText: extractedText
            };
          } else {
            sonnerToast.warning(
              "تنبيه",
              {
                description: "لم يتمكن Gemini من استخراج بيانات من الصورة، يرجى محاولة تحميل صورة أوضح"
              }
            );
            
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
        
        sonnerToast.error(
          "فشل الاستخراج",
          {
            description: "فشل استخراج البيانات: " + extractionResult.message
          }
        );
        
        // إعادة الصورة مع حالة خطأ
        return {
          ...image,
          status: "error" as const,
          extractedText: "فشل استخراج النص: " + extractionResult.message,
          apiKeyError: true // إضافة علامة لتحديد أن الخطأ متعلق بمفتاح API
        };
      }
    } catch (geminiError: any) {
      console.error("خطأ في معالجة Gemini:", geminiError);
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(geminiApiKey, geminiError.message || "خطأ غير معروف");
      
      // تحسين رسالة الخطأ
      let errorMessage = geminiError.message || 'خطأ غير معروف';
      let isApiKeyError = false;
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك والمحاولة مرة أخرى.';
      } else if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError')) {
        errorMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى تحميل صورة أصغر حجمًا أو المحاولة مرة أخرى لاحقًا.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded') || 
                 errorMessage.includes('API key') || errorMessage.includes('invalid')) {
        errorMessage = 'تم تجاوز حصة API أو المفتاح غير صالح. جاري تحويلك تلقائيًا إلى مفتاح آخر للمحاولة مرة أخرى.';
        isApiKeyError = true;
      }
      
      sonnerToast.error(
        "خطأ",
        {
          description: `فشل في استخراج البيانات: ${errorMessage}`
        }
      );
      
      // إعادة الصورة مع حالة خطأ
      return {
        ...image,
        status: "error" as const,
        extractedText: "خطأ في المعالجة: " + errorMessage,
        apiKeyError: isApiKeyError // إضافة علامة لتحديد أن الخطأ متعلق بمفتاح API
      };
    }
  };

  // وظيفة إعادة تعيين جميع مفاتيح API
  const resetApiKeys = useCallback(() => {
    resetAllApiKeys();
    sonnerToast.success(
      "تم إعادة تعيين المفاتيح",
      {
        description: "تم إعادة تعيين جميع مفاتيح API"
      }
    );
  }, []);

  return { 
    useGemini, 
    processWithGemini,
    resetApiKeys,
    getApiStats: getApiKeyStats
  };
};
