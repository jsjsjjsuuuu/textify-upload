
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { extractDataWithGemini, fileToBase64, testGeminiConnection } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";

// ثوابت لإدارة الطلبات وتتبع القيود
const MAX_API_RETRIES = 3;        // عدد إعادة المحاولات
const API_RETRY_DELAY_MS = 3000;  // تأخير بين المحاولات (3 ثواني)
const API_RATE_LIMIT = 5;         // أقصى عدد طلبات في الفترة الزمنية
const API_RATE_PERIOD_MS = 60000; // فترة قياس معدل الطلبات (دقيقة واحدة)

// واجهة معلومات مفتاح API
interface ApiKeyInfo {
  keyId: number;
  keyPreview: string;
  isValid: boolean;
  callCount: number;
  recentCalls: number;
  model: string;
  failCount: number;
}

export const useGeminiProcessing = () => {
  const [connectionTested, setConnectionTested] = useState(false);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [apiCallTimestamps, setApiCallTimestamps] = useState<number[]>([]);
  // تخزين مفاتيح Gemini API المتعددة
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  // إحصائيات استخدام المفاتيح
  const [keyUsageCounts, setKeyUsageCounts] = useState<Record<number, number>>({});
  const [keyRecentUsage, setKeyRecentUsage] = useState<Record<number, number>>({});
  const [keyFailCounts, setKeyFailCounts] = useState<Record<number, number>>({});
  const [keyModels, setKeyModels] = useState<Record<number, string>>({});
  
  const { toast } = useToast();

  // إعادة تعيين عداد الطلبات بشكل دوري
  useEffect(() => {
    const now = Date.now();
    
    // إزالة الطوابع الزمنية القديمة
    const cleanupTimestamps = () => {
      const currentTime = Date.now();
      setApiCallTimestamps(prevTimestamps => 
        prevTimestamps.filter(timestamp => 
          currentTime - timestamp < API_RATE_PERIOD_MS
        )
      );
    };
    
    // تنظيف الطوابع الزمنية كل 10 ثوانٍ
    const intervalId = setInterval(cleanupTimestamps, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  // تحميل مفاتيح API عند بدء التشغيل
  useEffect(() => {
    // تحميل المفاتيح المخزنة
    const loadSavedKeys = () => {
      try {
        const storedKeys = localStorage.getItem('geminiApiKeys');
        if (storedKeys) {
          const parsedKeys = JSON.parse(storedKeys);
          if (Array.isArray(parsedKeys)) {
            setApiKeys(parsedKeys);
            
            // تحميل إحصائيات المفاتيح إذا كانت موجودة
            try {
              const storedStats = localStorage.getItem('geminiApiKeyStats');
              if (storedStats) {
                const stats = JSON.parse(storedStats);
                setKeyUsageCounts(stats.usage || {});
                setKeyRecentUsage(stats.recent || {});
                setKeyFailCounts(stats.fails || {});
                setKeyModels(stats.models || {});
              }
            } catch (e) {
              console.warn('فشل في تحميل إحصائيات المفاتيح:', e);
            }
          }
        } else {
          // الرجوع للمفتاح الفردي إذا لم توجد مفاتيح متعددة
          const singleKey = localStorage.getItem('geminiApiKey');
          if (singleKey) {
            setApiKeys([singleKey]);
          }
        }
      } catch (error) {
        console.error('خطأ في تحميل مفاتيح API:', error);
      }
    };
    
    loadSavedKeys();
    
    const geminiApiKey = localStorage.getItem("geminiApiKey");
    
    // إعداد مفتاح API افتراضي إذا لم يكن موجودًا
    if (!geminiApiKey) {
      const defaultApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
      localStorage.setItem("geminiApiKey", defaultApiKey);
      console.log("تم تعيين مفتاح Gemini API افتراضي:", defaultApiKey.substring(0, 5) + "...");
      // اختبار الاتصال بالمفتاح الافتراضي
      testGeminiApiConnection(defaultApiKey);
    } else {
      console.log("استخدام مفتاح Gemini API موجود بطول:", geminiApiKey.length);
      // اختبار الاتصال بالمفتاح الموجود
      if (!connectionTested) {
        testGeminiApiConnection(geminiApiKey);
      }
    }
    
    // إعادة ضبط عدادات الاستخدام الحديث كل دقيقة
    const resetRecentUsageInterval = setInterval(() => {
      setKeyRecentUsage({});
    }, 60000);
    
    return () => {
      clearInterval(resetRecentUsageInterval);
    };
  }, [connectionTested]);

  // حفظ الإحصائيات عند تغييرها
  useEffect(() => {
    if (Object.keys(keyUsageCounts).length > 0 || Object.keys(keyModels).length > 0) {
      try {
        const stats = {
          usage: keyUsageCounts,
          recent: keyRecentUsage,
          fails: keyFailCounts,
          models: keyModels
        };
        localStorage.setItem('geminiApiKeyStats', JSON.stringify(stats));
      } catch (e) {
        console.warn('فشل في حفظ إحصائيات المفاتيح:', e);
      }
    }
  }, [keyUsageCounts, keyRecentUsage, keyFailCounts, keyModels]);

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

  // التحقق من وضع معدل الاستخدام
  const checkRateLimit = (): { allowed: boolean, waitTimeMs: number } => {
    const now = Date.now();
    const recentCalls = apiCallTimestamps.filter(timestamp => now - timestamp < API_RATE_PERIOD_MS);
    
    if (recentCalls.length >= API_RATE_LIMIT) {
      // حساب وقت الانتظار المطلوب
      const oldestCall = Math.min(...recentCalls);
      const waitTimeMs = API_RATE_PERIOD_MS - (now - oldestCall) + 100; // 100ms إضافية للأمان
      
      return { allowed: false, waitTimeMs };
    }
    
    return { allowed: true, waitTimeMs: 0 };
  };
  
  // تسجيل استدعاء API جديد
  const trackApiCall = () => {
    const now = Date.now();
    setApiCallTimestamps(prev => [...prev, now]);
    setApiCallCount(count => count + 1);
  };

  // وظيفة مساعدة للتأخير
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // تعيين مفاتيح Gemini API
  const setGeminiApiKeys = (keys: string[]) => {
    // تنقية المفاتيح من القيم الفارغة
    const cleanKeys = keys.filter(key => key.trim() !== '');
    if (cleanKeys.length === 0) {
      console.warn('لا يمكن تعيين قائمة مفاتيح فارغة!');
      return;
    }
    
    setApiKeys(cleanKeys);
    localStorage.setItem('geminiApiKeys', JSON.stringify(cleanKeys));
    
    // تهيئة إحصائيات للمفاتيح الجديدة
    const newUsage: Record<number, number> = {};
    const newRecent: Record<number, number> = {};
    const newFails: Record<number, number> = {};
    const newModels: Record<number, string> = {};
    
    cleanKeys.forEach((_, index) => {
      newUsage[index] = keyUsageCounts[index] || 0;
      newRecent[index] = keyRecentUsage[index] || 0;
      newFails[index] = keyFailCounts[index] || 0;
      newModels[index] = keyModels[index] || "gemini-1.5-pro";
    });
    
    setKeyUsageCounts(newUsage);
    setKeyRecentUsage(newRecent);
    setKeyFailCounts(newFails);
    setKeyModels(newModels);
  };
  
  // تعيين نموذج لمفتاح API محدد
  const setApiKeyModel = (keyIndex: number, model: string) => {
    setKeyModels(prev => ({
      ...prev,
      [keyIndex]: model
    }));
  };
  
  // الحصول على معلومات المفاتيح للعرض
  const getApiKeysInfo = (): ApiKeyInfo[] => {
    return apiKeys.map((key, index) => {
      const isValid = (keyFailCounts[index] || 0) < 3;
      
      return {
        keyId: index,
        keyPreview: key.substring(0, 5) + '...' + key.substring(key.length - 3),
        isValid,
        callCount: keyUsageCounts[index] || 0,
        recentCalls: keyRecentUsage[index] || 0,
        model: keyModels[index] || "gemini-1.5-pro",
        failCount: keyFailCounts[index] || 0
      };
    });
  };
  
  // إعادة تعيين إحصائيات المفاتيح
  const resetKeyStats = () => {
    setKeyUsageCounts({});
    setKeyRecentUsage({});
    setKeyFailCounts({});
    
    // حذف الإحصائيات المخزنة
    try {
      localStorage.removeItem('geminiApiKeyStats');
    } catch (e) {
      console.warn('فشل في حذف إحصائيات المفاتيح المخزنة:', e);
    }
  };

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    console.log("استخدام مفتاح Gemini API بطول:", geminiApiKey.length);

    // في بيئة المعاينة، نحاول استخدام Gemini مع تحذير المستخدم
    if (isPreviewEnvironment()) {
      console.log("تشغيل في بيئة معاينة (Lovable). محاولة استخدام Gemini قد تواجه قيود CORS.");
    }

    try {
      // الكشف عن حجم الملف وتقديم تحذير إذا كان كبيرًا جدًا
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) {
        console.warn(`حجم الصورة كبير: ${fileSizeMB.toFixed(1)}MB، قد تستغرق المعالجة وقتًا أطول`);
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
      
      // التحقق من معدل استخدام API
      for (let attempt = 0; attempt < MAX_API_RETRIES; attempt++) {
        const { allowed, waitTimeMs } = checkRateLimit();
        
        if (!allowed) {
          console.warn(`تجاوز معدل الاستخدام لـ Gemini API. الانتظار ${waitTimeMs}ms قبل المحاولة التالية`);
          
          // تحديث حالة الصورة للإشارة إلى الانتظار
          if (attempt === 0) {
            // نحدث النص فقط في المحاولة الأولى لتجنب التحديثات المتكررة
            const waitTimeSeconds = Math.ceil(waitTimeMs / 1000);
            const updatedImageWithWait: ImageData = {
              ...updatedImage,
              extractedText: `الانتظار ${waitTimeSeconds} ثوانٍ بسبب تجاوز معدل الاستخدام...`
            };
            return updatedImageWithWait;
          }
          
          // الانتظار قبل المحاولة التالية
          await delay(waitTimeMs);
          continue;
        }
        
        // إضافة معلومات تشخيصية أكثر
        console.log("بدء استدعاء extractDataWithGemini");
        console.log("إعدادات الاستخراج:", {
          apiKeyLength: geminiApiKey.length,
          imageBase64Length: imageBase64.length,
          enhancedExtraction: true,
          maxRetries: 2,
          retryDelayMs: 3000,
          attempt: attempt + 1
        });
        
        // تسجيل استدعاء API
        trackApiCall();
        
        try {
          const extractionResult = await extractDataWithGemini({
            apiKey: geminiApiKey,
            imageBase64,
            enhancedExtraction: true,
            maxRetries: 2,  // تقليل عدد المحاولات لتسريع الاستجابة
            retryDelayMs: 3000,  // زيادة مدة الانتظار بين المحاولات
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
              
              // تحديث الصورة بالبيانات المستخرجة
              const processedImage = updateImageWithExtractedData(
                image,
                extractedText || "",
                parsedData || {},
                parsedData.confidence ? parseInt(String(parsedData.confidence)) : 95,
                "gemini"
              );
              
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
                return {
                  ...image,
                  status: "pending" as const,
                  extractedText: extractedText
                };
              } else {
                return {
                  ...image,
                  status: "pending" as const,
                  extractedText: "لم يتم استخراج نص. حاول مرة أخرى بصورة أوضح."
                };
              }
            }
          } else {
            console.log("فشل استخراج Gemini:", extractionResult.message);
            
            if (attempt < MAX_API_RETRIES - 1) {
              console.log(`إعادة المحاولة ${attempt + 2}/${MAX_API_RETRIES} بعد ${API_RETRY_DELAY_MS}ms`);
              await delay(API_RETRY_DELAY_MS);
              continue;
            }
            
            // إعادة الصورة مع حالة خطأ
            return {
              ...image,
              status: "error" as const,
              extractedText: "فشل استخراج النص: " + extractionResult.message
            };
          }
        } catch (apiError: any) {
          console.error(`خطأ في استدعاء Gemini API (المحاولة ${attempt + 1}/${MAX_API_RETRIES}):`, apiError);
          
          // التحقق من نوع الخطأ
          const isRateLimitError = apiError.message?.includes('quota') || 
                                  apiError.message?.includes('rate limit') || 
                                  apiError.message?.includes('too many requests');
          
          if (isRateLimitError) {
            // زيادة فترة الانتظار لأخطاء معدل الاستخدام
            await delay(API_RETRY_DELAY_MS * 2);
          } else {
            await delay(API_RETRY_DELAY_MS);
          }
          
          // استمرار في الحلقة للمحاولة التالية إذا لم نصل إلى الحد الأقصى
          if (attempt < MAX_API_RETRIES - 1) {
            continue;
          }
          
          // أقصى عدد من المحاولات، إرجاع خطأ
          throw apiError;
        }
      }
      
      // إذا وصلنا إلى هنا، فقد استنفدنا جميع المحاولات
      return {
        ...image,
        status: "error" as const,
        extractedText: "فشل استخراج النص بعد استنفاد جميع المحاولات"
      };
    } catch (geminiError: any) {
      console.error("خطأ في معالجة Gemini:", geminiError);
      
      // تحسين رسالة الخطأ
      let errorMessage = geminiError.message || 'خطأ غير معروف';
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك والمحاولة مرة أخرى.';
      } else if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError')) {
        errorMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى تحميل صورة أصغر حجمًا أو المحاولة مرة أخرى لاحقًا.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        errorMessage = 'تم تجاوز حصة API. يرجى الانتظار بضع دقائق والمحاولة مرة أخرى.';
      }
      
      // إعادة الصورة مع حالة خطأ
      return {
        ...image,
        status: "error" as const,
        extractedText: "خطأ في المعالجة: " + errorMessage
      };
    }
  };

  // نقوم بإرجاع useGemini كقيمة ثابتة true لاستخدام Gemini دائمًا
  return { 
    useGemini: true, 
    processWithGemini,
    apiCallCount,
    setGeminiApiKeys,
    getApiKeysInfo,
    setApiKeyModel,
    resetKeyStats,
    testGeminiConnection
  };
};
