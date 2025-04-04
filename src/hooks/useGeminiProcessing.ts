
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
    // التحقق من وجود الملف قبل المعالجة
    if (!file || !(file instanceof File)) {
      console.error("خطأ: ملف الصورة غير موجود أو غير صالح", file);
      toast({
        title: "خطأ في معالجة الصورة",
        description: "ملف الصورة غير موجود أو غير صالح. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      
      return {
        ...image,
        status: "error" as const,
        extractedText: "خطأ: ملف الصورة غير موجود أو غير صالح"
      };
    }
    
    // الحصول على المفتاح التالي من نظام الدوران
    const geminiApiKey = getNextApiKey();
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
      
      try {
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
              code: parsedData.code || "",
              senderName: parsedData.senderName || "",
              phoneNumber: parsedData.phoneNumber || "",
              province: parsedData.province || "",
              price: parsedData.price || "",
              companyName: parsedData.companyName || ""
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
              id: processedImage.id,
              code: processedImage.code || "",
              senderName: processedImage.senderName || "",
              phoneNumber: processedImage.phoneNumber || "",
              province: processedImage.province || "",
              price: processedImage.price || "",
              companyName: processedImage.companyName || ""
            });
            
            // تعيين الحالة استنادًا إلى وجود البيانات الرئيسية
            let finalImage: ImageData = {
              ...processedImage,
              status: "completed" as const
            };
            
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
              
              // إنشاء بيانات افتراضية للصورة لتسهيل الملء اليدوي
              const defaultData = {
                code: "",
                senderName: "",
                phoneNumber: "",
                province: "",
                price: "",
                companyName: ""
              };
              
              const processedImageWithText = updateImageWithExtractedData(
                image,
                extractedText,
                defaultData,
                50, // ثقة منخفضة لعدم وجود بيانات هيكلية
                "gemini"
              );
              
              return {
                ...processedImageWithText,
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
          
          // محاولة استخدام معالجة OCR كبديل
          return {
            ...image,
            status: "pending" as const, // استخدام "pending" بدلاً من "error" للسماح بمعالجة يدوية
            extractedText: "فشل استخراج النص باستخدام Gemini. يمكنك إدخال البيانات يدويًا."
          };
        }
      } catch (innerError: any) {
        console.error("خطأ أثناء استدعاء extractDataWithGemini:", innerError);
        throw innerError; // إعادة رمي الخطأ للتعامل معه في الكتلة الخارجية
      }
    } catch (geminiError: any) {
      console.error("خطأ في معالجة Gemini:", geminiError);
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(geminiApiKey, geminiError.message || "خطأ غير معروف");
      
      // تحسين رسالة الخطأ
      let errorMessage = geminiError.message || 'خطأ غير معروف';
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك والمحاولة مرة أخرى.';
      } else if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError')) {
        errorMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى تحميل صورة أصغر حجمًا أو المحاولة مرة أخرى لاحقًا.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
        errorMessage = 'تم تجاوز حصة API. جاري تحويلك تلقائيًا إلى مفتاح آخر للمحاولة مرة أخرى.';
        // محاولة مفتاح آخر تلقائيًا في الاستدعاء التالي
      }
      
      toast({
        title: "خطأ",
        description: `فشل في استخراج البيانات: ${errorMessage}`,
        variant: "destructive"
      });
      
      // العودة بحالة "pending" بدلاً من "error" للسماح بالمعالجة اليدوية
      return {
        ...image,
        status: "pending" as const,
        extractedText: "خطأ في المعالجة: " + errorMessage + ". يمكنك إدخال البيانات يدويًا."
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
