import { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";
import { ApiResult } from "../apiService";
import { parseGeminiResponse } from "./parsers";
import { getEnhancedExtractionPrompt, getBasicExtractionPrompt, getTextOnlyExtractionPrompt } from "./prompts";
import { 
  createFetchOptions, 
  fetchWithRetry, 
  getConnectionTimeout 
} from "@/utils/automationServerUrl";

/**
 * استخراج البيانات من الصور باستخدام Gemini API
 */
export async function extractDataWithGemini({
  apiKey,
  imageBase64,
  extractionPrompt,
  temperature = 0.1,
  modelVersion = 'gemini-1.5-pro',
  enhancedExtraction = true,
  maxRetries = 3,
  retryDelayMs = 5000
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

  try {
    console.log("إرسال طلب إلى Gemini API...");
    console.log("طول مفتاح API:", apiKey.length);
    console.log("أول 5 أحرف من مفتاح API:", apiKey.substring(0, 5));
    console.log("طول صورة Base64:", imageBase64.length);
    console.log("استخدام إصدار النموذج:", modelVersion);
    console.log("استخدام درجة حرارة:", temperature);
    console.log("استخدام المطالبة:", prompt.substring(0, 100) + "...");
    console.log("الحد الأقصى للمحاولات:", maxRetries);
    
    // تنظيف معرف صورة Base64
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // محاولة استخراج النص فقط أولاً للتأكد من أن الصورة يمكن قراءتها
    console.log("محاولة استخراج النص الأولي فقط...");
    
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
      body: JSON.stringify(requestBody)
    };
    
    // تنفيذ الطلب مع محاولات إعادة المحاولة
    console.log("بدء طلب API...");
    const timeBeforeRequest = Date.now();
    
    // استخدام fetch مباشرة للتبسيط
    const response = await fetch(`${endpoint}?key=${apiKey}`, fetchOptions);
    
    const timeAfterRequest = Date.now();
    console.log(`استغرق طلب Gemini API ${timeAfterRequest - timeBeforeRequest}ms`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API رد بخطأ:", response.status, errorText);
      return {
        success: false,
        message: `خطأ من Gemini API: ${response.status} - ${errorText}`
      };
    }
    
    const data: GeminiResponse = await response.json();
    console.log("بيانات استجابة Gemini API:", JSON.stringify(data).substring(0, 200) + "...");
    
    if (data.promptFeedback?.blockReason) {
      console.error("Gemini حظر الطلب:", data.promptFeedback.blockReason);
      return {
        success: false,
        message: `تم حظر الاستعلام: ${data.promptFeedback.blockReason}`
      };
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error("لا توجد مرشحات في استجابة Gemini:", data);
      return {
        success: false,
        message: "لم يتم إنشاء أي استجابة من Gemini"
      };
    }

    if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      console.error("أجزاء المحتوى مفقودة في استجابة Gemini:", data);
      return {
        success: false,
        message: "استجابة Gemini غير مكتملة"
      };
    }

    const extractedText = data.candidates[0].content.parts[0].text || '';
    console.log("النص المستخرج من Gemini:", extractedText.substring(0, 200) + (extractedText.length > 200 ? "..." : ""));
    
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
        
        const textOnlyResponse = await fetch(`${endpoint}?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify(textOnlyRequestBody)
        });
        
        if (textOnlyResponse.ok) {
          const textOnlyData: GeminiResponse = await textOnlyResponse.json();
          
          if (textOnlyData.candidates?.[0]?.content?.parts?.[0]?.text) {
            const rawExtractedText = textOnlyData.candidates[0].content.parts[0].text;
            console.log("تم استخراج النص الخام بنجاح:", rawExtractedText.substring(0, 200));
            
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
      console.log("البيانات المحللة من Gemini:", parsedData);
      console.log("درجة الثقة:", confidenceScore);
      
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
    
    // تحسين رسائل الخطأ
    let userFriendlyMessage = `حدث خطأ أثناء معالجة الطلب: ${errorMessage}`;
    
    if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError') || errorMessage.includes('AbortError')) {
      userFriendlyMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى إعادة المحاولة مرة أخرى لاحقًا أو تحميل صورة بحجم أصغر.';
    } else if (errorMessage.includes('Failed to fetch')) {
      userFriendlyMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك أو حاول استخدام VPN إذا كنت تواجه قيود جغرافية.';
    } else if (errorMessage.includes('CORS')) {
      userFriendlyMessage = 'تم منع الطلب بسبب قيود CORS. حاول استخدام الموقع الرئيسي بدلاً من بيئة المعاينة.';
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
export async function testGeminiConnection(apiKey: string, model: string = "gemini-1.5-flash"): Promise<ApiResult> {
  if (!apiKey) {
    return {
      success: false,
      message: "يرجى توفير مفتاح API صالح"
    };
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
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
      })
    };
    
    console.log("إرسال طلب اختبار إلى Gemini API...");
    const response = await fetch(`${endpoint}?key=${apiKey}`, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("فشل اختبار Gemini API:", response.status, errorText);
      return {
        success: false,
        message: `خطأ من Gemini API: ${response.status} - ${errorText}`
      };
    }
    
    return {
      success: true,
      message: "تم الاتصال بـ Gemini API بنجاح"
    };
  } catch (error) {
    console.error("خطأ عند اختبار اتصال Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    
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
