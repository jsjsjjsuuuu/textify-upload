
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
    console.error("Gemini API Key is missing");
    return {
      success: false,
      message: "يرجى توفير مفتاح API صالح"
    };
  }

  const prompt = extractionPrompt || 
    "استخرج البيانات التالية من هذه الصورة: الكود، اسم المرسل، رقم الهاتف، المحافظة، السعر. قم بتنسيق المخرجات بتنسيق JSON مع المفاتيح التالية باللغة الإنجليزية: code, senderName, phoneNumber, province, price";

  try {
    console.log("جاري إرسال الطلب إلى Gemini API...");
    console.log("API Key length:", apiKey.length);
    console.log("First 5 characters of API Key:", apiKey.substring(0, 5));
    console.log("Image Base64 length:", imageBase64.length);
    
    // استخدام نموذج Gemini 2.0-flash بدلاً من gemini-pro-vision
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    
    const requestBody = {
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
    };
    
    console.log("Sending request to Gemini API endpoint:", endpoint);
    
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    console.log("Gemini API Response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("خطأ في استجابة Gemini API:", errorData);
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
      return {
        success: false,
        message: "لم يتم إنشاء أي استجابة من Gemini"
      };
    }

    const extractedText = data.candidates[0].content.parts[0].text;
    console.log("Extracted text from Gemini:", extractedText);
    
    // محاولة استخراج JSON من النص
    try {
      // نبحث عن أي نص JSON في الاستجابة
      const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        extractedText.match(/{[\s\S]*?}/);
      
      let parsedData: any = {};
      
      if (jsonMatch) {
        const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
        console.log("Found JSON in response:", jsonText);
        try {
          parsedData = JSON.parse(jsonText);
          console.log("Successfully parsed JSON:", parsedData);
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          // إذا فشل تحليل JSON، نحاول إصلاحه
          const cleanJsonText = jsonText.replace(/[\u0600-\u06FF]+\s*:\s*/g, (match) => {
            return `"${match.trim().slice(0, -1)}": `;
          }).replace(/'/g, '"');
          try {
            parsedData = JSON.parse(cleanJsonText);
            console.log("Successfully parsed cleaned JSON:", parsedData);
          } catch (cleanJsonError) {
            console.error("Error parsing cleaned JSON:", cleanJsonError);
          }
        }
      }
      
      // تحويل البيانات العربية إلى مفاتيح إنجليزية
      const mappedData: any = {};
      
      // تحقق من وجود أي من الحقول في parsedData وتعيينها للمفاتيح الإنجليزية
      if (parsedData.code || parsedData["الكود"] || parsedData["كود"]) {
        mappedData.code = parsedData.code || parsedData["الكود"] || parsedData["كود"];
      }
      
      if (parsedData.senderName || parsedData["اسم المرسل"] || parsedData["الاسم"]) {
        mappedData.senderName = parsedData.senderName || parsedData["اسم المرسل"] || parsedData["الاسم"];
      }
      
      if (parsedData.phoneNumber || parsedData["رقم الهاتف"] || parsedData["الهاتف"]) {
        mappedData.phoneNumber = parsedData.phoneNumber || parsedData["رقم الهاتف"] || parsedData["الهاتف"];
      }
      
      if (parsedData.province || parsedData["المحافظة"] || parsedData["محافظة"]) {
        mappedData.province = parsedData.province || parsedData["المحافظة"] || parsedData["محافظة"];
      }
      
      if (parsedData.price || parsedData["السعر"] || parsedData["سعر"]) {
        mappedData.price = parsedData.price || parsedData["السعر"] || parsedData["سعر"];
      }
      
      // إذا لم نتمكن من استخراج البيانات من JSON، نحاول استخراجها من النص مباشرة
      if (Object.keys(mappedData).length === 0) {
        console.log("No JSON data found, parsing text manually");
        const lines = extractedText.split('\n');
        const dataFields: Record<string, string> = {
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
              mappedData[englishKey] = value;
            }
          }
        });
      }
      
      console.log("Final mapped data:", mappedData);
      return {
        success: true,
        message: "تم استخراج البيانات بنجاح",
        data: {
          extractedText,
          parsedData: mappedData
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
