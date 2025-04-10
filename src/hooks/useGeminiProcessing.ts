
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { extractDataWithGemini, fileToBase64 } from "@/lib/gemini";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";
import { useToast } from "@/hooks/use-toast";

// إضافة وظيفة تحويل Blob إلى File
const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type });
};

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
    // مسح المفتاح القديم إذا كان موجودًا
    const oldApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8"; // المفتاح القديم
    const storedApiKey = localStorage.getItem("geminiApiKey");
    
    // إذا كان المفتاح المخزن هو المفتاح القديم، قم بإزالته
    if (storedApiKey === oldApiKey) {
      console.log("تم اكتشاف مفتاح API قديم. جاري المسح...");
      localStorage.removeItem("geminiApiKey");
    }
    
    const geminiApiKey = localStorage.getItem("geminiApiKey");
    
    // إعداد مفتاح API افتراضي إذا لم يكن موجودًا
    if (!geminiApiKey) {
      // استخدام المفتاح الجديد كمفتاح افتراضي
      const defaultApiKey = "AIzaSyC4d53RxIXV4WIXWcNAN1X-9WPZbS4z7Q0";
      localStorage.setItem("geminiApiKey", defaultApiKey);
      console.log("تم تعيين مفتاح Gemini API الجديد:", defaultApiKey.substring(0, 5) + "...");
      // اختبار الاتصال بالمفتاح الجديد
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
    // استخدام المفتاح الجديد كافتراضي
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyC4d53RxIXV4WIXWcNAN1X-9WPZbS4z7Q0";
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
            // التحويل من Blob إلى File باستخدام الوظيفة المساعدة المحلية
            processedFile = blobToFile(file, "image.jpg");
          }
          
          // استدعاء وظيفة استخراج البيانات باستخدام Gemini
          const result = await extractDataWithGemini({
            apiKey: geminiApiKey,
            imageBase64: imageBase64,
            enhancedExtraction: true,
            maxRetries: 2,
            retryDelayMs: 3000
          });
          
          console.log("نتيجة استخراج Gemini:", { 
            success: result.success, 
            dataDetails: result.data ? 'توجد بيانات' : 'لا توجد بيانات',
            message: result.message
          });
          
          if (result.success && result.data) {
            // تصحيح: استخدام الحقول الصحيحة من result.data
            const extractedText = result.data.extractedText || "";
            const parsedData = result.data.parsedData || {};
            const confidence = parsedData.confidence || 0;
            
            // استخراج البيانات مع مستوى ثقة وطريقة المعالجة
            const resultWithData = updateImageWithExtractedData(
              image,
              extractedText,
              parsedData,
              confidence,
              "gemini"
            );
            
            console.log("تم تحديث بيانات الصورة:", {
              hasCode: !!resultWithData.code,
              hasSenderName: !!resultWithData.senderName,
              hasPhoneNumber: !!resultWithData.phoneNumber,
              hasProvince: !!resultWithData.province,
              hasPrice: !!resultWithData.price
            });
            
            return resultWithData;
          } else {
            throw new Error(result.message || "فشل في استخراج البيانات");
          }
        } catch (attemptError) {
          console.error(`خطأ في محاولة Gemini رقم ${attempt + 1}:`, attemptError);
          
          // إذا كانت هذه المحاولة الأخيرة، إعادة رمي الخطأ
          if (attempt === MAX_API_RETRIES - 1) {
            throw attemptError;
          }
          
          // الانتظار قبل المحاولة التالية
          await delay(API_RETRY_DELAY_MS);
        }
      }
      
      // لن يتم الوصول إلى هنا عادة لأن الحلقة إما ستنجح وتعيد النتيجة أو ترمي خطأ في المحاولة الأخيرة
      throw new Error("فشلت جميع محاولات استخراج البيانات");
    } catch (error) {
      console.error("خطأ في معالجة Gemini:", error);
      
      return {
        ...image,
        status: "error" as const,
        extractedText: "حدث خطأ أثناء محاولة استخراج البيانات: " + (error instanceof Error ? error.message : String(error))
      };
    }
  };

  return { processWithGemini };
};
