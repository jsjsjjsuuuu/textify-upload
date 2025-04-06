
import { ApiOptions, ApiResult, ExtractedTextResult } from "./types";

// استخراج نص من صورة باستخدام Gemini
export async function extractTextFromImage(options: ApiOptions): Promise<ApiResult> {
  if (!options.apiKey) {
    return { 
      success: false, 
      message: "No API key provided", 
      apiKeyError: true 
    };
  }

  if (!options.imageBase64) {
    return { 
      success: false, 
      message: "No image data provided" 
    };
  }

  try {
    // تحضير البيانات لطلب Gemini
    const defaultPrompt = `
      Extract all the text from this image carefully. Then analyze this receipt or invoice image and extract:
      - code: the order/receipt code
      - senderName: name of sender or customer
      - phoneNumber: contact number (format as standard phone number)
      - province: location or province
      - price: total price amount
      - companyName: name of company or business
      
      Return the results as a clean JSON object with 'extractedText', 'confidence' (percentage), and 'parsedData' fields containing structured data.
    `;

    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";
    
    const requestBody = {
      contents: [
        {
          parts: [
            { text: options.prompt || defaultPrompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: options.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
              }
            }
          ]
        }
      ],
      generation_config: {
        temperature: options.temperature || 0.1,
        max_output_tokens: 2048
      },
      safety_settings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH"
        }
      ]
    };

    const response = await fetch(`${apiUrl}?key=${options.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      
      // تحقق من رسائل خطأ محددة متعلقة بالمفتاح
      const isApiKeyError = data?.error?.message?.includes("API key") || 
                           data?.error?.message?.includes("not authorized") ||
                           data?.error?.message?.includes("billing") ||
                           data?.error?.status === "PERMISSION_DENIED" ||
                           data?.error?.status === "UNAUTHENTICATED" ||
                           response.status === 401 || 
                           response.status === 403;
      
      return {
        success: false,
        message: data?.error?.message || "Error processing image",
        apiKeyError: isApiKeyError
      };
    }

    // معالجة استجابة Gemini والحصول على النص
    if (!data.candidates || !data.candidates[0]?.content?.parts) {
      return {
        success: false,
        message: "Invalid response format from Gemini",
        apiKeyError: false
      };
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // محاولة استخراج بيانات هيكلية، إما في كتل نص JSON أو من النص العادي
    const result: ExtractedTextResult = {
      extractedText: text,
      confidence: 85, // قيمة افتراضية
      parsedData: {}
    };

    try {
      // البحث عن كتل JSON في النص
      const jsonMatches = text.match(/```(?:json)?([\s\S]*?)```/g) || 
                         text.match(/{[\s\S]*?}/g);
      
      if (jsonMatches && jsonMatches.length > 0) {
        // تنظيف النص المطابق وتحليله كـ JSON
        const cleanJson = jsonMatches[0]
          .replace(/```json\s*/, '')
          .replace(/```/, '')
          .trim();
        
        try {
          const parsedJson = JSON.parse(cleanJson);
          
          // إذا كان JSON يحتوي على parsedData، استخدمه مباشرة
          if (parsedJson.parsedData) {
            result.parsedData = parsedJson.parsedData;
            
            // تحديث النص المستخرج والثقة إذا كانت متاحة
            if (parsedJson.extractedText) {
              result.extractedText = parsedJson.extractedText;
            }
            if (parsedJson.confidence) {
              result.confidence = parsedJson.confidence;
            }
          } else {
            // إذا لم يكن لديه بنية محددة، افترض أن كامل الكائن يمثل البيانات المنظمة
            result.parsedData = parsedJson;
          }
        } catch (jsonError) {
          console.error("Error parsing JSON from Gemini response:", jsonError);
          // المتابعة باستخدام التعبيرات العادية كخطة بديلة
        }
      } else {
        // معالجة النص لاستخراج البيانات الرئيسية باستخدام التعبيرات العادية
        const extractValue = (text: string, key: string): string => {
          const regex = new RegExp(`${key}\\s*:?\\s*([^\\n]+)`, 'i');
          const match = text.match(regex);
          return match ? match[1].trim() : '';
        };
        
        result.parsedData = {
          code: extractValue(text, 'code'),
          senderName: extractValue(text, 'sender[_\\s]?name'),
          phoneNumber: extractValue(text, 'phone[_\\s]?number'),
          province: extractValue(text, 'province'),
          price: extractValue(text, 'price'),
          companyName: extractValue(text, 'company[_\\s]?name')
        };
      }
    } catch (parseError) {
      console.error("Error extracting structured data:", parseError);
    }

    return {
      success: true,
      data: result,
      apiKeyError: false
    };

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return {
      success: false,
      message: error.message || "Error processing image with Gemini",
      apiKeyError: false
    };
  }
}

// اختبار الاتصال بـ Gemini API
export async function testConnection(apiKey: string): Promise<ApiResult> {
  if (!apiKey) {
    return { 
      success: false, 
      message: "No API key provided", 
      apiKeyError: true 
    };
  }

  try {
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    
    const requestBody = {
      contents: [{
        parts: [{ text: "Respond with 'Connection successful' if you receive this message." }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 20
      }
    };

    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API test error:", data);
      return {
        success: false,
        message: data?.error?.message || "API connection test failed",
        apiKeyError: true
      };
    }

    return {
      success: true,
      message: "Connection successful",
      apiKeyError: false
    };
  } catch (error: any) {
    console.error("Error testing Gemini API:", error);
    return {
      success: false,
      message: error.message || "Error testing connection",
      apiKeyError: true
    };
  }
}
