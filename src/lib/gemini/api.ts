
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

  try {
    console.log("جاري إرسال الطلب إلى Gemini API...");
    console.log("API Key length:", apiKey.length);
    console.log("First 5 characters of API Key:", apiKey.substring(0, 5));
    console.log("Image Base64 length:", imageBase64.length);
    console.log("Using model version:", modelVersion);
    console.log("Using temperature:", temperature);
    console.log("Using prompt:", prompt.substring(0, 100) + "...");
    
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
    
    // إنشاء خيارات الطلب مع رؤوس مخصصة
    const fetchOptions = createFetchOptions(
      "POST", 
      requestBody, 
      {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey
      }
    );
    
    // استخدام fetchWithRetry بدلاً من fetch العادي
    const response = await fetchWithRetry(`${endpoint}?key=${apiKey}`, fetchOptions, 3);
    
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

    const extractedText = data.candidates[0].content.parts[0].text;
    console.log("Extracted text from Gemini:", extractedText);
    
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
          rawText: extractedText
        }
      };
    }
  } catch (error) {
    console.error("خطأ عند استخدام Gemini API:", error);
    return {
      success: false,
      message: `حدث خطأ أثناء معالجة الطلب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
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
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    // إنشاء خيارات الطلب مع رؤوس مخصصة
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
    
    // استخدام fetchWithRetry بدلاً من fetch العادي
    const response = await fetchWithRetry(`${endpoint}?key=${apiKey}`, fetchOptions, 3);

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
