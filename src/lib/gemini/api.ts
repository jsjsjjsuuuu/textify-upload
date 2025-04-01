
import { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";
import { ApiResult } from "../apiService";
import { parseGeminiResponse } from "./parsers";
import { getEnhancedExtractionPrompt, getBasicExtractionPrompt, getTextOnlyExtractionPrompt, getHandwritingExtractionPrompt } from "./prompts";
import { createFetchOptions, fetchWithRetry, getConnectionTimeout } from "@/utils/automationServerUrl";
import { reportApiKeyError } from "./apiKeyManager";

// تتبع آخر استدعاء API
const lastApiCallTime = new Map<string, number>();

/**
 * استخراج البيانات من الصور باستخدام Gemini API
 */
export async function extractDataWithGemini({
  apiKey,
  imageBase64,
  extractionPrompt,
  temperature = 0.1,
  modelVersion = 'gemini-1.5-flash',
  enhancedExtraction = true,
  maxRetries = 2,
  retryDelayMs = 2000
}: GeminiExtractParams): Promise<ApiResult> {
  if (!apiKey) {
    console.error("Gemini API Key مفقود");
    return {
      success: false,
      message: "يرجى توفير مفتاح API صالح"
    };
  }

  // تحديد المطالبة المناسبة بناءً على الإعدادات
  let prompt = extractionPrompt;
  
  if (!prompt) {
    if (enhancedExtraction) {
      prompt = getEnhancedExtractionPrompt();
    } else {
      prompt = getBasicExtractionPrompt();
    }
  }

  // إنشاء تأخير بين الطلبات 
  const lastCallTime = lastApiCallTime.get(apiKey) || 0;
  const currentTime = Date.now();
  const timeSinceLastCall = currentTime - lastCallTime;
  
  // التأكد من أن هناك على الأقل ثانية واحدة بين الطلبات
  const minDelayBetweenCalls = 1000; // ثانية واحدة
  
  if (timeSinceLastCall < minDelayBetweenCalls) {
    const delayNeeded = minDelayBetweenCalls - timeSinceLastCall;
    console.log(`تأخير ${delayNeeded}ms قبل استدعاء API...`);
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  
  // تحديث وقت آخر استدعاء
  lastApiCallTime.set(apiKey, Date.now());

  try {
    console.log("إرسال طلب إلى Gemini API...");
    console.log("أول 5 أحرف من مفتاح API:", apiKey.substring(0, 5));
    console.log("طول صورة Base64:", imageBase64.length);
    console.log("استخدام إصدار النموذج:", modelVersion);
    
    // التحقق من حجم صورة Base64
    if (imageBase64.length > 1000000) {
      console.log("حجم الصورة كبير جدًا، لكن سنستمر في المحاولة");
    }
    
    // تنظيف معرف صورة Base64
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // إنشاء محتوى الطلب
    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: cleanBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 1024,
        topK: 40,
        topP: 0.95
      }
    };
    
    // إنشاء عنوان URL للطلب
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;
    console.log("إرسال طلب إلى نقطة نهاية Gemini API:", endpoint);
    
    // إنشاء خيارات الطلب
    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000) // 60 ثانية
    };
    
    // تنفيذ الطلب مع قياس الوقت
    console.log("بدء طلب API...");
    const timeBeforeRequest = Date.now();
    
    // محاولة طلب API مع إعادة المحاولة
    let response;
    let attemptCount = 0;
    const maxAttempts = 3;
    
    while (attemptCount < maxAttempts) {
      try {
        attemptCount++;
        console.log(`محاولة طلب API رقم ${attemptCount}...`);
        response = await fetch(`${endpoint}?key=${apiKey}`, fetchOptions);
        console.log(`استجابة محاولة ${attemptCount}:`, response.status);
        break; // الخروج من الحلقة إذا نجح الطلب
      } catch (fetchError) {
        console.error(`محاولة الطلب ${attemptCount} فشلت:`, fetchError);
        
        if (attemptCount >= maxAttempts) {
          throw fetchError; // إعادة رمي الخطأ إذا استنفدت جميع المحاولات
        }
        
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (!response) {
      throw new Error("فشلت جميع محاولات الطلب");
    }
    
    const timeAfterRequest = Date.now();
    console.log(`استغرق طلب Gemini API ${timeAfterRequest - timeBeforeRequest}ms`);
    
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (err) {
        errorText = `لا يمكن قراءة نص الخطأ: ${err.message}`;
      }
      
      console.error("Gemini API رد بخطأ:", response.status, errorText);
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(apiKey, `${response.status}: ${errorText}`);
      
      return {
        success: false,
        message: `خطأ من Gemini API: ${response.status} - ${errorText}`
      };
    }
    
    let data: GeminiResponse;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("خطأ في تحليل استجابة JSON:", jsonError);
      reportApiKeyError(apiKey, `خطأ في تحليل JSON: ${jsonError.message}`);
      
      return {
        success: false,
        message: `خطأ في تحليل استجابة JSON: ${jsonError.message}`
      };
    }
    
    // تحليل استجابة Gemini لاستخراج البيانات المنظمة
    const parsedResult = parseGeminiResponse(data);
    
    if (parsedResult.success && parsedResult.data) {
      console.log("تم استخراج البيانات بنجاح من استجابة Gemini:", parsedResult.data);
      return {
        success: true,
        data: parsedResult.data,
        message: "تم استخراج البيانات بنجاح"
      };
    } else {
      console.warn("فشل استخراج البيانات المنظمة من استجابة Gemini:", parsedResult.message);
      
      // محاولة إعادة المحاولة مع مطالبة مختلفة
      if (enhancedExtraction && !extractionPrompt) {
        console.log("محاولة استخدام مطالبة استخراج النص فقط...");
        
        return await extractDataWithGemini({
          apiKey,
          imageBase64,
          extractionPrompt: getTextOnlyExtractionPrompt(),
          temperature,
          modelVersion,
          enhancedExtraction: false,
          maxRetries,
          retryDelayMs
        });
      }
      
      return {
        success: parsedResult.success,
        message: parsedResult.message,
        data: parsedResult.data
      };
    }
    
  } catch (error) {
    console.error("خطأ أثناء استدعاء Gemini API:", error);
    
    // الإبلاغ عن الخطأ لمدير المفاتيح
    reportApiKeyError(apiKey, error instanceof Error ? error.message : String(error));
    
    return {
      success: false,
      message: `خطأ أثناء استدعاء Gemini API: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * اختبار اتصال Gemini API
 */
export async function testGeminiConnection(apiKey: string): Promise<ApiResult> {
  try {
    console.log("اختبار اتصال Gemini API...");
    
    // استخدام طلب بسيط جدًا للاختبار
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(10000) // 10 ثواني
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("فشل اختبار اتصال Gemini API:", response.status, errorText);
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(apiKey, `${response.status}: ${errorText}`);
      
      return {
        success: false,
        message: `فشل الاتصال باختبار Gemini API: ${response.status} - ${errorText}`
      };
    }
    
    const data = await response.json();
    
    if (data && Array.isArray(data.models)) {
      console.log("نجح اختبار اتصال Gemini API:", data.models.length, "نماذج متاحة");
      
      return {
        success: true,
        message: `نجح الاتصال: ${data.models.length} نماذج متاحة`
      };
    } else {
      console.warn("استجابة اختبار Gemini API غير متوقعة:", data);
      
      return {
        success: false,
        message: "استجابة اختبار غير متوقعة من Gemini API"
      };
    }
  } catch (error) {
    console.error("خطأ أثناء اختبار اتصال Gemini API:", error);
    
    // الإبلاغ عن الخطأ لمدير المفاتيح
    reportApiKeyError(apiKey, error instanceof Error ? error.message : String(error));
    
    return {
      success: false,
      message: `خطأ أثناء اختبار اتصال Gemini API: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// وظيفة تحويل ملف إلى Base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
