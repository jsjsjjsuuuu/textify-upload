import { ApiResult, ApiOptions, GeminiApiResponse, ExtractedTextResult } from './types';

async function safeJsonParse<T>(str: string): Promise<T | null> {
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    console.error("Failed to parse JSON", str, e);
    return null;
  }
}

function isApiKeyError(error: any): boolean {
  const errorMessage = error?.message || '';
  
  return (
    errorMessage.includes('API key') ||
    errorMessage.includes('apiKey') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('auth') ||
    errorMessage.includes('credentials') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('rate limit') ||
    error?.code === 401 ||
    error?.code === 403
  );
}

export const processGeminiResponse = async (response: Response, apiKey: string): Promise<ApiResult> => {
  try {
    if (!response.ok) {
      const statusCode = response.status;
      const errorText = await response.text();
      
      const isKeyError = 
        statusCode === 401 || 
        statusCode === 403 || 
        errorText.includes('API key') || 
        errorText.includes('authentication');
      
      return {
        success: false,
        message: `فشل طلب Gemini API: ${statusCode} - ${errorText}`,
        apiKeyError: isKeyError
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data,
      apiKeyError: false
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في معالجة استجابة Gemini: ${error.message}`,
      apiKeyError: isApiKeyError(error)
    };
  }
};

export const callGeminiApi = async (options: ApiOptions): Promise<ApiResult> => {
  const { apiKey, prompt, modelVersion = 'gemini-pro', temperature = 0.1 } = options;

  if (!apiKey) {
    return { success: false, message: "مفتاح API مفقود", apiKeyError: true };
  }

  if (!prompt) {
    return { success: false, message: "النص غير موجود" };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: temperature,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
          }
        ]
      }),
    });

    return processGeminiResponse(response, apiKey);
  } catch (error) {
    console.error("خطأ أثناء استدعاء Gemini API:", error);
    return { success: false, message: `فشل استدعاء Gemini API: ${error.message}`, apiKeyError: isApiKeyError(error) };
  }
};

export const extractTextFromImage = async (options: ApiOptions): Promise<ApiResult> => {
  const { apiKey, imageBase64, modelVersion = 'gemini-pro-vision', temperature = 0.4 } = options;

  if (!apiKey) {
    return { success: false, message: "مفتاح API مفقود", apiKeyError: true };
  }

  if (!imageBase64) {
    return { success: false, message: "لم يتم توفير صورة" };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "What is in this image? Describe it in detail." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(',')[1]
              }
            }
          ],
        }],
        generationConfig: {
          temperature: temperature,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
          }
        ]
      }),
    });

    return processGeminiResponse(response, apiKey);
  } catch (error) {
    console.error("خطأ أثناء استدعاء Gemini API:", error);
    return { success: false, message: `فشل استدعاء Gemini API: ${error.message}`, apiKeyError: isApiKeyError(error) };
  }
};

export const enhancedDataExtraction = async (options: ApiOptions): Promise<ApiResult> => {
  const { apiKey, imageBase64, modelVersion = 'gemini-pro-vision', temperature = 0.1, enhancedExtraction = true } = options;

  if (!apiKey) {
    return { success: false, message: "مفتاح API مفقود", apiKeyError: true };
  }

  if (!imageBase64) {
    return { success: false, message: "لم يتم توفير صورة" };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;

  const extractionPrompt = `استخرج البيانات التالية من الصورة:
  - اسم الشركة
  - كود
  - اسم المرسل
  - رقم الهاتف
  - المحافظة
  - السعر
  
  يجب أن تكون الإجابة بتنسيق JSON فقط.`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: extractionPrompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(',')[1]
              }
            }
          ],
        }],
        generationConfig: {
          temperature: temperature,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE"
          },
          {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
          }
        ]
      }),
    });

    return processGeminiResponse(response, apiKey);
  } catch (error) {
    console.error("خطأ أثناء استدعاء Gemini API:", error);
    return { success: false, message: `فشل استدعاء Gemini API: ${error.message}`, apiKeyError: isApiKeyError(error) };
  }
};

export const testConnection = async (apiKey: string): Promise<ApiResult> => {
    if (!apiKey) {
        return { success: false, message: "API key is missing", apiKeyError: true };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Test" }],
                }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 2048,
                },
                safetySettings: [
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_NONE"
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_NONE"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_NONE"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_NONE"
                    }
                ]
            }),
        });

        return processGeminiResponse(response, apiKey);
    } catch (error) {
        console.error("Error while calling Gemini API:", error);
        return { success: false, message: `Failed to call Gemini API: ${error.message}`, apiKeyError: isApiKeyError(error) };
    }
};
