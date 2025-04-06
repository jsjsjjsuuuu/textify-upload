
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { extractDataWithGemini, fileToBase64, formatPrice, blobToFile } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";

// ثوابت لإدارة الطلبات وتتبع القيود
const MAX_API_RETRIES = 3;        // عدد إعادة المحاولات
const API_RETRY_DELAY_MS = 3000;  // تأخير بين المحاولات (3 ثواني)
const API_RATE_LIMIT = 5;         // أقصى عدد طلبات في الفترة الزمنية
const API_RATE_PERIOD_MS = 60000; // فترة قياس معدل الطلبات (دقيقة واحدة)

export const useGeminiProcessing = () => {
  const [connectionTested, setConnectionTested] = useState(false);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [apiCallTimestamps, setApiCallTimestamps] = useState<number[]>([]);
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

  useEffect(() => {
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
  }, [connectionTested]);

  // اختبار اتصال Gemini API
  const testGeminiApiConnection = async (apiKey: string) => {
    try {
      console.log("اختبار اتصال Gemini API...");
      const result = await extractDataWithGemini({
        apiKey,
        imageBase64: "",
        testConnection: true
      });
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

  const processWithGemini = async (file: File | Blob, image: ImageData): Promise<ImageData> => {
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
          // تحويل الملف إلى File إذا كان Blob
          let processedFile: File;
          if (file instanceof File) {
            processedFile = file;
          } else {
            // التحويل من Blob إلى File باستخدام الوظيفة المساعدة
            processedFile = blobToFile(file, "image.jpg");
          }
          
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
              error: "فشل استخراج النص: " + extractionResult.message
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
        error: "فشل استخراج النص بعد استنفاد جميع المحاولات"
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
        error: "خطأ في المعالجة: " + errorMessage
      };
    }
  };

  // نقوم بإرجاع useGemini كقيمة ثابتة true لاستخدام Gemini دائمًا
  return { 
    useGemini: true, 
    processWithGemini,
    apiCallCount
  };
};
