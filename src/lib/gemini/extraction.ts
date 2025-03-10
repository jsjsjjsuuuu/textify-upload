
import { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";
import { ApiResult } from "../apiService";
import { parseGeminiResponse } from "./parsers";
import { getBasicExtractionPrompt, getEnhancedExtractionPrompt } from "./prompts";
import { makeGeminiRequest, validateGeminiResponse } from "./apiClient";
import { handleRateLimiting } from "./networkUtils";
import { MAX_RETRIES, DEFAULT_TEMPERATURE, DEFAULT_MODEL_VERSION } from "./config";

/**
 * Core function to extract data from images using Gemini API
 * with retry mechanisms and rate limit handling
 */
export async function extractDataWithGemini({
  apiKey,
  imageBase64,
  extractionPrompt,
  temperature = DEFAULT_TEMPERATURE,
  modelVersion = DEFAULT_MODEL_VERSION,
  enhancedExtraction = true
}: GeminiExtractParams): Promise<ApiResult> {
  if (!apiKey) {
    console.error("Gemini API Key is missing");
    return {
      success: false,
      message: "يرجى توفير مفتاح API صالح"
    };
  }

  // Select appropriate prompt based on extraction mode
  let prompt = extractionPrompt;
  if (!prompt) {
    prompt = enhancedExtraction ? getEnhancedExtractionPrompt() : getBasicExtractionPrompt();
  }

  // Create request body once outside the retry loop
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
      
      const { response, data } = await makeGeminiRequest(apiKey, requestBody, modelVersion);
      
      // Handle rate limiting
      if (response.status === 429) {
        console.log("Rate limit exceeded, retrying after delay");
        retryCount = await handleRateLimiting(retryCount);
        if (retryCount === -1) {
          return {
            success: false,
            message: "تم تجاوز حد معدل الطلبات، يرجى المحاولة مرة أخرى لاحقًا"
          };
        }
        continue;
      }
      
      // Handle server errors
      if (!response.ok) {
        const errorData = await response.json();
        console.error("خطأ في استجابة Gemini API:", errorData);
        lastError = errorData;
        
        // Retry for temporary errors
        if ((response.status >= 500 || response.status === 400) && retryCount < MAX_RETRIES) {
          retryCount = await handleRateLimiting(retryCount);
          if (retryCount === -1) break;
          continue;
        }
        
        return {
          success: false,
          message: `فشل في الاتصال بـ Gemini API: ${errorData.error?.message || response.statusText}`
        };
      }

      if (!data) {
        throw new Error("No data returned from API");
      }
      
      // Check for blocked content
      if (data.promptFeedback?.blockReason) {
        return {
          success: false,
          message: `تم حظر الاستعلام: ${data.promptFeedback.blockReason}`
        };
      }

      // Validate response content
      if (!validateGeminiResponse(data)) {
        // Retry if no valid results and under retry limit
        if (retryCount < MAX_RETRIES) {
          console.log("Empty or invalid response received, retrying...");
          retryCount += 1;
          // Gradually increase temperature with each retry
          requestBody.generationConfig.temperature = Math.min(0.9, temperature + (retryCount * 0.15));
          await handleRateLimiting(retryCount - 1);
          continue;
        }
        
        return {
          success: false,
          message: "لم يتم إنشاء أي استجابة صالحة من Gemini"
        };
      }

      // Extract and process the response text
      const extractedText = data.candidates[0].content.parts[0].text;
      console.log("Extracted text from Gemini:", extractedText);
      
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
        
        // Retry if parsing failed and under retry limit
        if (retryCount < MAX_RETRIES) {
          retryCount = await handleRateLimiting(retryCount);
          if (retryCount === -1) break;
          continue;
        }
        
        // Return raw text if parsing fails after all retries
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
      
      // Retry for unexpected errors
      if (retryCount < MAX_RETRIES) {
        retryCount = await handleRateLimiting(retryCount);
        if (retryCount === -1) break;
        continue;
      }
      
      break;
    }
  }
  
  // If we reach here, all attempts failed
  return {
    success: false,
    message: `فشلت جميع المحاولات (${MAX_RETRIES + 1}): ${lastError?.message || 'خطأ غير معروف'}`
  };
}

