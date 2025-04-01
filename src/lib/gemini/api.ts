
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
    
    console.log("استلام بيانات استجابة Gemini API");
    
    if (data.promptFeedback?.blockReason) {
      console.error("Gemini حظر الطلب:", data.promptFeedback.blockReason);
      
      // الإبلاغ عن الخطأ لمدير المفاتيح
      reportApiKeyError(apiKey, `حظر الاستعلام: ${data.promptFeedback.blockReason}`);
      
      return {
        success: false,
        message: `تم حظر الاستعلام: ${data.promptFeedback.blockReason}`
      };
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error("لا توجد مرشحات في استجابة Gemini");
      
      // محاولة استخدام مطالبة أبسط
      try {
        console.log("محاولة استخدام مطالبة أبسط...");
        
        const simpleRequestBody = {
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
        
        const simpleResponse = await fetch(`${endpoint}?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify(simpleRequestBody),
          signal: AbortSignal.timeout(30000) // 30 ثانية
        });
        
        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json();
          
          if (simpleData.candidates?.[0]?.content?.parts?.[0]?.text) {
            return {
              success: true,
              message: "تم استخراج النص باستخدام مطالبة أبسط",
              data: {
                extractedText: simpleData.candidates[0].content.parts[0].text,
                parsedData: {},
                confidence: 50
              }
            };
          }
        }
      } catch (alternativeError) {
        console.error("فشلت المحاولة البديلة:", alternativeError);
      }
      
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
      
      // محاولة استخدام مطالبة حول النص المكتوب بخط اليد
      console.log("محاولة استخدام مطالبة للنصوص المكتوبة بخط اليد...");
      
      try {
        // استخدام prompt للتعرف على النصوص المكتوبة بخط اليد
        const handwritingRequestBody = {
          ...requestBody,
          contents: [
            {
              parts: [
                { text: getHandwritingExtractionPrompt() },
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
        
        // استخدام مطالبة خط اليد
        const handwritingResponse = await fetch(`${endpoint}?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify(handwritingRequestBody),
          signal: AbortSignal.timeout(20000) // 20 ثواني
        });
        
        if (handwritingResponse.ok) {
          const handwritingData: GeminiResponse = await handwritingResponse.json();
          
          if (handwritingData.candidates?.[0]?.content?.parts?.[0]?.text) {
            const rawHandwritingText = handwritingData.candidates[0].content.parts[0].text;
            console.log("تم استخراج النص من خط اليد بنجاح، الطول:", rawHandwritingText.length);
            
            // محاولة استخراج البيانات من النص المستخرج
            try {
              const { parsedData, confidenceScore } = parseGeminiResponse(rawHandwritingText);
              
              // إذا تم استخراج بعض البيانات على الأقل
              if (Object.keys(parsedData).length > 0) {
                return {
                  success: true,
                  message: "تم استخراج البيانات من النص المكتوب بخط اليد",
                  data: {
                    extractedText: rawHandwritingText,
                    parsedData,
                    confidence: confidenceScore
                  }
                };
              } else {
                return {
                  success: true,
                  message: "تم استخراج النص المكتوب بخط اليد لكن فشل استخراج البيانات المنظمة",
                  data: {
                    extractedText: rawHandwritingText,
                    rawText: rawHandwritingText,
                    parsedData: {}
                  }
                };
              }
            } catch (parseError) {
              // حتى إذا فشل التحليل، نعيد النص المستخرج على الأقل
              return {
                success: true,
                message: "تم استخراج النص المكتوب بخط اليد لكن فشل تحليله",
                data: {
                  extractedText: rawHandwritingText,
                  rawText: rawHandwritingText,
                  parsedData: {}
                }
              };
            }
          }
        }
      } catch (alternativeError) {
        console.error("فشلت جميع المحاولات البديلة:", alternativeError);
      }
      
      return {
        success: false,
        message: "لم يتم استخراج أي نص من الصورة"
      };
    }
    
    // تحليل الاستجابة واستخراج البيانات المنظمة
    try {
      console.log("تحليل النص المستخرج:", extractedText.substring(0, 100) + "...");
      const { parsedData, confidenceScore } = parseGeminiResponse(extractedText);
      console.log("تم تحليل البيانات من Gemini بنجاح:", parsedData);
      
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
      userFriendlyMessage = 'تم تجاوز حد الاستخدام. جاري استخدام مفتاح API بديل.';
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
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
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
