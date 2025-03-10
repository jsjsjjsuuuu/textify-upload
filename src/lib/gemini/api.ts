
import { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";
import { ApiResult } from "../apiService";
import { parseGeminiResponse } from "./parsers";
import { getEnhancedExtractionPrompt, getBasicExtractionPrompt } from "./prompts";

// Rate limiting constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * استخراج البيانات من الصور باستخدام Gemini API
 * مع إضافة آليات المحاولة المتكررة والتعامل مع حدود معدل الطلبات
 */
export async function extractDataWithGemini({
  apiKey,
  imageBase64,
  extractionPrompt,
  temperature = 0.2,
  modelVersion = 'gemini-2.0-flash',
  enhancedExtraction = true
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

  // إنشاء كائن الطلب مرة واحدة خارج حلقة المحاولات المتكررة
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

  let retryCount = 0;
  let lastError: any = null;

  while (retryCount <= MAX_RETRIES) {
    try {
      console.log(`محاولة استدعاء Gemini API (${retryCount + 1}/${MAX_RETRIES + 1})...`);
      console.log("API Key length:", apiKey.length);
      console.log("First 5 characters of API Key:", apiKey.substring(0, 5));
      console.log("Image Base64 length:", imageBase64.length);
      console.log("Using model version:", modelVersion);
      console.log("Using temperature:", temperature);
      
      // استخدام إصدار النموذج المحدد
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;
      
      console.log("Sending request to Gemini API endpoint:", endpoint);
      
      // إضافة timeout للطلب لتجنب التعليق
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log("Gemini API Response status:", response.status);
      
      // معالجة أخطاء حدود معدل الطلبات
      if (response.status === 429) {
        console.log("Rate limit exceeded, retrying after delay");
        retryCount++;
        if (retryCount <= MAX_RETRIES) {
          // انتظار مع زيادة فترة التأخير تدريجيًا
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
          continue;
        } else {
          return {
            success: false,
            message: "تم تجاوز حد معدل الطلبات، يرجى المحاولة مرة أخرى لاحقًا"
          };
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("خطأ في استجابة Gemini API:", errorData);
        lastError = errorData;
        
        // إعادة المحاولة للأخطاء المؤقتة
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
          continue;
        }
        
        return {
          success: false,
          message: `فشل في الاتصال بـ Gemini API: ${errorData.error?.message || response.statusText}`
        };
      }

      const data: GeminiResponse = await response.json();
      console.log("Gemini API Response data:", JSON.stringify(data).substring(0, 200) + "...");
      
      if (data.promptFeedback?.blockReason) {
        return {
          success: false,
          message: `تم حظر الاستعلام: ${data.promptFeedback.blockReason}`
        };
      }

      if (!data.candidates || data.candidates.length === 0) {
        // إعادة المحاولة إذا لم تكن هناك نتائج
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
          continue;
        }
        
        return {
          success: false,
          message: "لم يتم إنشاء أي استجابة من Gemini"
        };
      }

      // تأكد من وجود نص في الاستجابة
      const extractedText = data.candidates[0].content.parts[0].text;
      if (!extractedText || extractedText.trim() === "") {
        if (retryCount < MAX_RETRIES) {
          console.log("Empty response received, retrying...");
          retryCount++;
          // زيادة درجة الحرارة قليلاً مع كل محاولة للحصول على نتائج مختلفة
          requestBody.generationConfig.temperature = Math.min(0.9, temperature + (retryCount * 0.1));
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
          continue;
        }
        
        return {
          success: false,
          message: "استجابة Gemini فارغة بعد عدة محاولات"
        };
      }
      
      console.log("Extracted text from Gemini:", extractedText);
      
      // تحليل الاستجابة واستخراج البيانات المنظمة
      try {
        const { parsedData, confidenceScore } = parseGeminiResponse(extractedText);
        
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
        
        // محاولة أخرى إذا فشل التحليل والعودة إلى النص الخام
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
          continue;
        }
        
        return {
          success: true,
          message: "تم استخراج النص ولكن فشل تحليل البيانات المنظمة",
          data: {
            extractedText,
            rawText: extractedText
          }
        };
      }
    } catch (error) {
      console.error("خطأ عند استخدام Gemini API:", error);
      lastError = error;
      
      // إعادة المحاولة للأخطاء غير المتوقعة
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
        continue;
      }
      
      return {
        success: false,
        message: `حدث خطأ أثناء معالجة الطلب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  }
  
  // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
  return {
    success: false,
    message: `فشلت جميع المحاولات (${MAX_RETRIES + 1}): ${lastError?.message || 'خطأ غير معروف'}`
  };
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
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
          temperature: 0.2,
          maxOutputTokens: 128
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("خطأ في اختبار اتصال Gemini API:", errorData);
      return {
        success: false,
        message: `فشل في الاتصال بـ Gemini API: ${errorData.error?.message || response.statusText}`
      };
    }

    return {
      success: true,
      message: "تم الاتصال بـ Gemini API بنجاح"
    };
  } catch (error) {
    console.error("خطأ عند اختبار اتصال Gemini API:", error);
    return {
      success: false,
      message: `حدث خطأ أثناء اختبار اتصال Gemini API: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
    };
  }
}
