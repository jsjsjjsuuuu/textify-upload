
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

// المفتاح الجديد الذي تم توفيره من المستخدم
const CUSTOM_API_KEY = "AIzaSyBKczW8k6fNBXnjD5y7P2vLC5nYgJM7I4o";

export const useGeminiProcessing = () => {
  const [useGemini, setUseGemini] = useState(true);
  const [connectionTested, setConnectionTested] = useState(false);
  const { toast } = useToast();
  
  // الحفاظ على سجل محاولات المعالجة لتجنب التكرار
  const [processingAttempts, setProcessingAttempts] = useState<Record<string, number>>({});

  useEffect(() => {
    // فحص الاتصال باستخدام المفتاح المخصص
    const testConnection = async () => {
      if (!connectionTested) {
        console.log("اختبار اتصال Gemini API باستخدام المفتاح المخصص...");
        await testGeminiApiConnection(CUSTOM_API_KEY);
      }
    };
    
    testConnection();
  }, [connectionTested]);

  // اختبار اتصال Gemini API باستخدام المفتاح المخصص
  const testGeminiApiConnection = async (apiKey: string): Promise<boolean> => {
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
        return true;
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
            return true;
          } else {
            toast({
              title: "تحذير",
              description: `فشل الاتصال بـ Gemini AI: ${result.message}`,
              variant: "destructive"
            });
            setUseGemini(false);
            return false;
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
      return false;
    }
    return false;
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
    // التحقق من عدد المحاولات
    const attemptKey = image.id;
    const attempts = processingAttempts[attemptKey] || 0;
    
    // إذا كان هناك أكثر من 3 محاولات للمعالجة، نصل بها إلى حالة خطأ ونعرض رسالة للمستخدم
    if (attempts >= 3) {
      console.log(`وصلت صورة ${image.id} إلى الحد الأقصى من المحاولات (${attempts})`);
      toast({
        title: "فشل في المعالجة",
        description: "وصلت الصورة إلى الحد الأقصى من محاولات المعالجة، يرجى تحميل صورة أخرى",
        variant: "destructive"
      });
      
      return {
        ...image,
        status: "error" as const,
        extractedText: "فشل في معالجة الصورة بعد عدة محاولات. يرجى تحميل صورة أوضح."
      };
    }
    
    // زيادة عدد المحاولات
    setProcessingAttempts(prev => ({
      ...prev,
      [attemptKey]: attempts + 1
    }));
    
    // استخدام المفتاح المخصص
    const geminiApiKey = CUSTOM_API_KEY;
    console.log("استخدام مفتاح Gemini API:", geminiApiKey.substring(0, 8) + "...");

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
      
      // محاولة استخراج البيانات باستخدام المطالبة المحسنة أولاً
      let extractionResult = await extractDataWithGemini({
        apiKey: geminiApiKey,
        imageBase64,
        enhancedExtraction: true,
        maxRetries: 2,
        retryDelayMs: 2000,
        modelVersion: 'gemini-1.5-flash',
        temperature: 0.2
      });
      
      console.log("نتيجة استخراج Gemini الأولية:", extractionResult);
      
      // التحقق من نجاح الاستخراج وجودة البيانات
      let dataQuality = 0;
      if (extractionResult.success && extractionResult.data?.parsedData) {
        const { parsedData } = extractionResult.data;
        
        // حساب جودة البيانات بناءً على وجود الحقول الرئيسية
        const requiredFields = ['code', 'senderName', 'phoneNumber', 'province'];
        const filledFields = requiredFields.filter(field => parsedData[field] && parsedData[field].length > 0);
        dataQuality = (filledFields.length / requiredFields.length) * 100;
        
        console.log("جودة البيانات المستخرجة:", dataQuality);
      }
      
      // إذا كانت جودة البيانات منخفضة، جرب نموذج آخر
      if (dataQuality < 50 && attempts < 2) {
        console.log("جودة البيانات منخفضة، محاولة استخدام نموذج أفضل...");
        
        // تأخير قبل المحاولة الثانية
        await sleepBetweenRequests(1500);
        
        // استخدام نموذج أفضل في المحاولة الثانية
        extractionResult = await extractDataWithGemini({
          apiKey: geminiApiKey,
          imageBase64,
          enhancedExtraction: true,
          maxRetries: 1,
          retryDelayMs: 1000,
          modelVersion: 'gemini-1.5-pro', // استخدام نموذج أكثر قوة
          temperature: 0.1 // درجة حرارة أقل للحصول على نتائج أكثر دقة
        });
        
        console.log("نتيجة استخراج Gemini مع النموذج الأفضل:", extractionResult);
      }
      
      if (extractionResult.success && extractionResult.data) {
        const { parsedData, extractedText, confidence } = extractionResult.data;
        
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
            parsedData.confidence ? parseInt(String(parsedData.confidence)) : confidence || 85,
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
          
          // إعادة تعيين عدد المحاولات لهذه الصورة عند النجاح
          setProcessingAttempts(prev => {
            const newAttempts = { ...prev };
            delete newAttempts[attemptKey];
            return newAttempts;
          });
          
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
        
        // محاولة استخدام مطالبة أبسط إذا فشلت المطالبة المحسنة
        if (attempts < 2) {
          console.log("محاولة استخدام مطالبة أخرى للاستخراج...");
          await sleepBetweenRequests(1500);
          
          return processWithGemini(file, image);
        }
        
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
      
      // إذا فشلت بعدد محاولات قليل، حاول مرة أخرى
      if (attempts < 2) {
        console.log("محاولة أخرى بعد فشل المعالجة...");
        await sleepBetweenRequests(2000);
        
        return processWithGemini(file, image);
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

  // وظيفة إعادة تعيين جميع مفاتيح API
  const resetApiKeys = useCallback(() => {
    resetAllApiKeys();
    setProcessingAttempts({}); // إعادة تعيين سجل المحاولات أيضًا
    toast({
      title: "تم إعادة تعيين المفاتيح",
      description: "تم إعادة تعيين جميع مفاتيح API",
    });
  }, [toast]);

  // وظيفة إعادة محاولة معالجة صورة معينة
  const retryProcessing = useCallback(async (file: File, image: ImageData): Promise<ImageData> => {
    // إعادة تعيين عدد المحاولات لهذه الصورة
    const attemptKey = image.id;
    setProcessingAttempts(prev => ({
      ...prev,
      [attemptKey]: 0
    }));
    
    // إعادة محاولة المعالجة
    console.log("إعادة محاولة معالجة الصورة:", image.id);
    
    toast({
      title: "جاري إعادة المعالجة",
      description: "تم بدء إعادة معالجة الصورة"
    });
    
    return processWithGemini(file, image);
  }, [toast]);

  return { 
    useGemini, 
    processWithGemini,
    resetApiKeys,
    getApiStats: getApiKeyStats,
    retryProcessing,
    connectionTested,
    testGeminiApiConnection
  };
};
