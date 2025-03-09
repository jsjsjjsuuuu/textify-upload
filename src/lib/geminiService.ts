
import { ApiResult } from "./apiService";

interface GeminiRequest {
  contents: {
    parts: {
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      }
    }[];
    role?: string;
  }[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
      role: string;
    };
    finishReason: string;
    index: number;
  }[];
  promptFeedback: {
    blockReason?: string;
  };
}

export interface GeminiExtractParams {
  apiKey: string;
  imageBase64: string;
  extractionPrompt?: string;
}

/**
 * استخراج البيانات من الصور باستخدام Gemini API
 */
export async function extractDataWithGemini({
  apiKey,
  imageBase64,
  extractionPrompt
}: GeminiExtractParams): Promise<ApiResult> {
  if (!apiKey) {
    return {
      success: false,
      message: "يرجى توفير مفتاح API صالح"
    };
  }

  const prompt = extractionPrompt || 
    "استخرج البيانات التالية من هذه الصورة: الكود، اسم المرسل، رقم الهاتف، المحافظة، السعر. قم بتنسيق المخرجات بتنسيق JSON.";

  try {
    console.log("جاري إرسال الطلب إلى Gemini API...");
    
    // استخدام نموذج Gemini 2.0-flash بدلاً من gemini-pro-vision
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
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("خطأ في استجابة Gemini API:", errorData);
      return {
        success: false,
        message: `فشل في الاتصال بـ Gemini API: ${errorData.error?.message || response.statusText}`
      };
    }

    const data: GeminiResponse = await response.json();
    
    if (data.promptFeedback?.blockReason) {
      return {
        success: false,
        message: `تم حظر الاستعلام: ${data.promptFeedback.blockReason}`
      };
    }

    if (!data.candidates || data.candidates.length === 0) {
      return {
        success: false,
        message: "لم يتم إنشاء أي استجابة من Gemini"
      };
    }

    const extractedText = data.candidates[0].content.parts[0].text;
    
    // محاولة استخراج JSON من النص
    try {
      // نبحث عن أي نص JSON في الاستجابة
      const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        extractedText.match(/{[\s\S]*?}/);
      
      let parsedData = {};
      
      if (jsonMatch) {
        const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
        parsedData = JSON.parse(jsonText);
      } else {
        // إذا لم نجد JSON، نقوم بتحليل النص بطريقة يدوية
        const lines = extractedText.split('\n');
        const dataFields = {
          "الكود": "code",
          "كود": "code",
          "اسم المرسل": "senderName",
          "الاسم": "senderName", 
          "رقم الهاتف": "phoneNumber",
          "الهاتف": "phoneNumber",
          "المحافظة": "province",
          "محافظة": "province",
          "السعر": "price",
          "سعر": "price"
        };
        
        lines.forEach(line => {
          for (const [arabicKey, englishKey] of Object.entries(dataFields)) {
            if (line.includes(arabicKey)) {
              const value = line.split(':')[1]?.trim() || line.split('،')[1]?.trim() || "";
              // @ts-ignore
              parsedData[englishKey] = value;
            }
          }
        });
      }
      
      return {
        success: true,
        message: "تم استخراج البيانات بنجاح",
        data: {
          extractedText,
          parsedData
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
 * تحويل ملف صورة إلى Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// إضافة دالة لاختبار الاتصال بـ Gemini API
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
