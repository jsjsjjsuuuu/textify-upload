
import { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";
import { ApiResult } from "../apiService";
import { parseGeminiResponse } from "./parsers";
import { getEnhancedExtractionPrompt, getBasicExtractionPrompt, getTextOnlyExtractionPrompt } from "./prompts";
import { 
  createFetchOptions, 
  fetchWithRetry, 
  getConnectionTimeout 
} from "@/utils/automationServerUrl";
import { reportApiKeyError } from "./apiKeyManager";

// تتبع آخر استدعاء API لكل مفتاح
const lastApiCallTime = new Map<string, number>();

/**
 * استخراج البيانات من الصور باستخدام Gemini API
 */
export async function extractDataWithGemini({
  apiKey,
  imageBase64,
  extractionPrompt,
  temperature = 0.1,
  modelVersion = 'gemini-2.0-flash', // تحديث للنموذج الجديد
  enhancedExtraction = true,
  maxRetries = 2,
  retryDelayMs = 3000
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

  // إنشاء تأخير بين الطلبات لنفس المفتاح
  const lastCallTime = lastApiCallTime.get(apiKey) || 0;
  const currentTime = Date.now();
  const timeSinceLastCall = currentTime - lastCallTime;
  
  // التأكد من أن هناك على الأقل 2 ثوانٍ بين الطلبات لنفس المفتاح
  const minDelayBetweenCalls = 2000; // 2 ثانية
  
  if (timeSinceLastCall < minDelayBetweenCalls) {
    const delayNeeded = minDelayBetweenCalls - timeSinceLastCall;
    console.log(`تأخير ${delayNeeded}ms قبل استدعاء API للمفتاح: ${apiKey.substring(0, 5)}...`);
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  
  // تحديث وقت آخر استدعاء
  lastApiCallTime.set(apiKey, Date.now());

  try {
    console.log("إرسال طلب إلى Gemini API...");
    console.log("طول مفتاح API:", apiKey.length);
    console.log("أول 5 أحرف من مفتاح API:", apiKey.substring(0, 5));
    console.log("طول صورة Base64:", imageBase64.length);
    console.log("استخدام إصدار النموذج:", modelVersion);
    
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
        maxOutputTokens: 800,
        topK: 40,
        topP: 0.95
      }
    };
    
    // إنشاء عنوان URL للطلب
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;
    console.log("إرسال طلب إلى نقطة نهاية Gemini API:", endpoint);
    
    // إنشاء خيارات الطلب مع مهلة زمنية أقصر
    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(25000) // 25 ثانية
    };
    
    // تنفيذ الطلب مع قياس الوقت
    console.log("بدء طلب API...");
    const timeBeforeRequest = Date.now();
    
    // إضافة محاولة إعادة الطلب في حالة الفشل
    let response;
    let attemptCount = 0;
    const maxAttempts = 2;
    
    while (attemptCount < maxAttempts) {
      try {
        attemptCount++;
        response = await fetch(`${endpoint}?key=${apiKey}`, fetchOptions);
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
        message: `خطأ من Gemini API: ${response.status} - ${errorText}`,
        apiKeyError: true
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
    
    console.log("استلام بيانات استجابة Gemini API");
    
    if (data.promptFeedback?.blockReason) {
      console.error("Gemini حظر الطلب:", data.promptFeedback.blockReason);
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(apiKey, `حظر الاستعلام: ${data.promptFeedback.blockReason}`);
      
      return {
        success: false,
        message: `تم حظر الاستعلام: ${data.promptFeedback.blockReason}`,
        apiKeyError: true
      };
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error("لا توجد مرشحات في استجابة Gemini");
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(apiKey, "لم يتم إنشاء أي استجابة من Gemini");
      
      return {
        success: false,
        message: "لم يتم إنشاء أي استجابة من Gemini"
      };
    }

    if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      console.error("أجزاء المحتوى مفقودة في استجابة Gemini");
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(apiKey, "استجابة Gemini غير مكتملة");
      
      return {
        success: false,
        message: "استجابة Gemini غير مكتملة"
      };
    }

    const extractedText = data.candidates[0].content.parts[0].text || '';
    console.log("تم استلام النص المستخرج من Gemini بطول:", extractedText.length);
    
    // التحقق من وجود نص مستخرج
    if (!extractedText) {
      console.error("Gemini أرجع نصًا فارغًا");
      
      // محاولة استخدام مطالبة أبسط للنص فقط
      console.log("محاولة استخدام مطالبة نص فقط بسيطة...");
      
      try {
        const textOnlyRequestBody = {
          ...requestBody,
          contents: [
            {
              parts: [
                { text: getTextOnlyExtractionPrompt() },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: cleanBase64
                  }
                }
              ]
            }
          ]
        };
        
        // تأخير قبل طلب آخر
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // استخدام الطلب البسيط
        const textOnlyResponse = await fetch(`${endpoint}?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify(textOnlyRequestBody),
          signal: AbortSignal.timeout(15000)
        });
        
        if (textOnlyResponse.ok) {
          const textOnlyData: GeminiResponse = await textOnlyResponse.json();
          
          if (textOnlyData.candidates?.[0]?.content?.parts?.[0]?.text) {
            const rawExtractedText = textOnlyData.candidates[0].content.parts[0].text;
            console.log("تم استخراج النص الخام بنجاح، الطول:", rawExtractedText.length);
            
            return {
              success: true,
              message: "تم استخراج النص الخام فقط، لم يتم التعرف على البيانات المنظمة",
              data: {
                extractedText: rawExtractedText,
                rawText: rawExtractedText,
                parsedData: {}
              }
            };
          }
        } else {
          // الإبلاغ عن الخطأ لمدير المفاتيح
          reportApiKeyError(apiKey, "فشل طلب النص فقط");
        }
      } catch (textOnlyError) {
        console.error("فشلت محاولة النص فقط:", textOnlyError);
      }
      
      return {
        success: false,
        message: "لم يتم استخراج أي نص من الصورة"
      };
    }
    
    // تحليل الاستجابة واستخراج البيانات المنظمة
    try {
      const { parsedData, confidenceScore } = parseGeminiResponse(extractedText);
      console.log("تم تحليل البيانات من Gemini بنجاح");
      
      return {
        success: true,
        message: "تم استخراج البيانات بنجاح",
        data: {
          extractedText,
          parsedData,
          confidence: confidenceScore
        }
      };
    } catch (parseError) {
      console.error("خطأ في تحليل البيانات المستخرجة:", parseError);
      return {
        success: true,
        message: "تم استخراج النص ولكن فشل تحليل البيانات المنظمة",
        data: {
          extractedText,
          rawText: extractedText,
          parsedData: {}
        }
      };
    }
  } catch (error) {
    console.error("خطأ عند استخدام Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    
    // الإبلاغ عن الخطأ لمدير المفاتيح
    reportApiKeyError(apiKey, errorMessage);
    
    // تحسين رسائل الخطأ
    let userFriendlyMessage = `حدث خطأ أثناء معالجة الطلب: ${errorMessage}`;
    
    if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError') || errorMessage.includes('AbortError')) {
      userFriendlyMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى إعادة المحاولة مرة أخرى لاحقًا أو تحميل صورة بحجم أصغر.';
    } else if (errorMessage.includes('Failed to fetch')) {
      userFriendlyMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك أو حاول استخدام VPN إذا كنت تواجه قيود جغرافية.';
    } else if (errorMessage.includes('CORS')) {
      userFriendlyMessage = 'تم منع الطلب بسبب قيود CORS. حاول استخدام الموقع الرئيسي بدلاً من بيئة المعاينة.';
    } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      userFriendlyMessage = 'تم تجاوز حد الاستخدام. جاري تبديل المفتاح تلقائياً.';
      return {
        success: false,
        message: userFriendlyMessage,
        apiKeyError: true
      };
    }
    
    return {
      success: false,
      message: userFriendlyMessage
    };
  }
}

/**
 * إضافة دالة لاختبار الاتصال بـ Gemini API
 */
export async function testGeminiConnection(apiKey: string): Promise<ApiResult> {
  if (!apiKey) {
    return {
      success: false,
      message: "يرجى توفير مفتاح API صالح"
    };
  }

  try {
    // استخدام النموذج الجديد للاختبار
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "مرحبا" }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 128
        }
      }),
      signal: AbortSignal.timeout(15000) // 15 ثواني
    };
    
    console.log("إرسال طلب اختبار إلى Gemini API...");
    
    let response;
    try {
      response = await fetch(`${endpoint}?key=${apiKey}`, fetchOptions);
    } catch (fetchError) {
      console.error("خطأ في طلب اختبار Gemini:", fetchError);
      throw fetchError;
    }
    
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (err) {
        errorText = `لا يمكن قراءة نص الخطأ: ${err.message}`;
      }
      
      console.error("فشل اختبار Gemini API:", response.status, errorText);
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(apiKey, `فشل الاختبار: ${response.status} - ${errorText}`);
      
      return {
        success: false,
        message: `خطأ من Gemini API: ${response.status} - ${errorText}`
      };
    }
    
    // تحديث وقت آخر استدعاء
    lastApiCallTime.set(apiKey, Date.now());
    
    return {
      success: true,
      message: "تم الاتصال بـ Gemini API بنجاح"
    };
  } catch (error) {
    console.error("خطأ عند اختبار اتصال Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    
    // الإبلاغ عن الخطأ لمدير المفاتيح
    reportApiKeyError(apiKey, `خطأ الاختبار: ${errorMessage}`);
    
    let userFriendlyMessage = `حدث خطأ أثناء اختبار اتصال Gemini API: ${errorMessage}`;
    
    if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError')) {
      userFriendlyMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى المحاولة مرة أخرى لاحقًا.';
    } else if (errorMessage.includes('Failed to fetch')) {
      userFriendlyMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك أو حاول استخدام VPN.';
    }
    
    return {
      success: false,
      message: userFriendlyMessage
    };
  }
}
