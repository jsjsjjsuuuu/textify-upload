
import { ApiResult } from "../apiService";
import { makeGeminiRequest } from "./apiClient";
import { DEFAULT_MODEL_VERSION } from "./config";

/**
 * Simple function to test Gemini API connection
 */
export async function testGeminiConnection(apiKey: string): Promise<ApiResult> {
  if (!apiKey) {
    return {
      success: false,
      message: "يرجى توفير مفتاح API صالح"
    };
  }

  try {
    const requestBody = {
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
    };

    const { response } = await makeGeminiRequest(apiKey, requestBody, DEFAULT_MODEL_VERSION);

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

