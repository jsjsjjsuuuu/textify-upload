
import { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";
import { ApiResult } from "../apiService";
import { parseGeminiResponse } from "./parsers";
import { getEnhancedExtractionPrompt, getBasicExtractionPrompt } from "./prompts";
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
  temperature = 0.2,
  modelVersion = 'gemini-1.5-flash',  // تحديث إلى الإصدار الأحدث
  enhancedExtraction = true,
  maxRetries = 12,
  retryDelayMs = 3000
}: GeminiExtractParams): Promise<ApiResult> {
  if (!apiKey) {
    console.error("Gemini API Key is missing");
    return {
      success: false,
      message: "يرجى توفير مفتاح API صالح"
    };
  }

  // إذا تم تفعيل الاستخراج المحسن، استخدم مطالبة أكثر دقة وتوجيهًا
  let prompt = extractionPrompt;
  
  if (!prompt) {
    if (enhancedExtraction) {
      prompt = getEnhancedExtractionPrompt();
    } else {
      prompt = getBasicExtractionPrompt();
    }
  }

  try {
    console.log("جاري إرسال الطلب إلى Gemini API...");
    console.log("API Key length:", apiKey.length);
    console.log("First 5 characters of API Key:", apiKey.substring(0, 5));
    console.log("Image Base64 length:", imageBase64.length);
    console.log("Using model version:", modelVersion);
    console.log("Using temperature:", temperature);
    console.log("Using prompt:", prompt.substring(0, 100) + "...");
    console.log("Max retries:", maxRetries);
    
    // استخدام إصدار النموذج المحدد
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;
    
    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
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
    
    console.log("Sending request to Gemini API endpoint:", endpoint);
    
    // إنشاء خيارات الطلب مع رؤوس مخصصة ومهلة زمنية أطول
    const fetchOptions = createFetchOptions(
      "POST", 
      requestBody, 
      {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey
      }
    );
    
    // استخدام fetchWithRetry مع محاولات أكثر ومهلة زمنية أطول لكل محاولة
    const response = await fetchWithRetry(
      `${endpoint}?key=${apiKey}`, 
      fetchOptions, 
      maxRetries, 
      retryDelayMs
    );
    
    console.log("Gemini API Response status:", response.status);
    
    const data: GeminiResponse = await response.json();
    console.log("Gemini API Response data:", JSON.stringify(data).substring(0, 200) + "...");
    
    if (data.promptFeedback?.blockReason) {
      console.error("Gemini blocked the request:", data.promptFeedback.blockReason);
      return {
        success: false,
        message: `تم حظر الاستعلام: ${data.promptFeedback.blockReason}`
      };
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error("No candidates in Gemini response:", JSON.stringify(data));
      return {
        success: false,
        message: "لم يتم إنشاء أي استجابة من Gemini"
      };
    }

    if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      console.error("Missing content parts in Gemini response:", JSON.stringify(data));
      return {
        success: false,
        message: "استجابة Gemini غير مكتملة"
      };
    }

    const extractedText = data.candidates[0].content.parts[0].text || '';
    console.log("Extracted text from Gemini:", extractedText);
    
    // التحقق من وجود نص مستخرج
    if (!extractedText) {
      console.error("Gemini returned empty text");
      return {
        success: false,
        message: "لم يتم استخراج أي نص من الصورة"
      };
    }
    
    // تحليل الاستجابة واستخراج البيانات المنظمة
    try {
      const { parsedData, confidenceScore } = parseGeminiResponse(extractedText);
      console.log("Parsed data from Gemini:", parsedData);
      console.log("Confidence score:", confidenceScore);
      
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
          parsedData: {} // إضافة كائن فارغ على الأقل
        }
      };
    }
  } catch (error) {
    console.error("خطأ عند استخدام Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    
    // تحسين رسائل الخطأ وتوفير رسائل أكثر تفصيلاً
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
export async function testGeminiConnection(apiKey: string): Promise<ApiResult> {
  if (!apiKey) {
    return {
      success: false,
      message: "يرجى توفير مفتاح API صالح"
    };
  }

  try {
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
    // إنشاء خيارات الطلب مع رؤوس مخصصة ومهلة زمنية أطول
    const fetchOptions = createFetchOptions(
      "POST", 
      {
        contents: [
          {
            parts: [
              { text: "مرحبا" }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 128
        }
      }, 
      {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey
      }
    );
    
    // استخدام fetchWithRetry بدلاً من fetch العادي مع محاولات أكثر
    const response = await fetchWithRetry(`${endpoint}?key=${apiKey}`, fetchOptions, 5, 2000);

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
