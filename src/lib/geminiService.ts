
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
  temperature?: number;
  modelVersion?: string;
  enhancedExtraction?: boolean;
}

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
      prompt = `انت خبير في استخراج البيانات من الصور التي تحتوي على معلومات للشحنات والطرود.
      
قم بتحليل هذه الصورة بدقة واستخرج القيم التالية:
1. الكود: (رقم تعريف الشحنة، عادة ما يكون رقم من 6-10 أرقام)
2. اسم المرسل: (اسم الشخص أو الشركة المرسلة)
3. رقم الهاتف: (رقم هاتف المرسل، قد يكون بتنسيق مختلف)
4. المحافظة: (اسم المحافظة أو المدينة)
5. السعر: (قيمة الشحنة، قد تكون بالدينار العراقي أو الدولار)

قواعد مهمة:
- استخرج البيانات كما هي في الصورة تمامًا، حتى لو كانت باللغة العربية أو الإنجليزية
- إذا لم تجد قيمة لأي حقل، اتركه فارغًا (null)
- حاول التقاط أي أرقام أو نصوص حتى لو كانت غير واضحة تمامًا
- قم بإرجاع النتائج بتنسيق JSON فقط بالمفاتيح التالية: code, senderName, phoneNumber, province, price
- تأكد من أن النتيجة صالحة بتنسيق JSON

مثال للمخرجات:
\`\`\`json
{
  "code": "123456",
  "senderName": "محمد علي",
  "phoneNumber": "07701234567",
  "province": "بغداد",
  "price": "25000"
}
\`\`\``;
    } else {
      prompt = "استخرج البيانات التالية من هذه الصورة: الكود، اسم المرسل، رقم الهاتف، المحافظة، السعر. قم بتنسيق المخرجات بتنسيق JSON مع المفاتيح التالية باللغة الإنجليزية: code, senderName, phoneNumber, province, price";
    }
  }

  try {
    console.log("جاري إرسال الطلب إلى Gemini API...");
    console.log("API Key length:", apiKey.length);
    console.log("First 5 characters of API Key:", apiKey.substring(0, 5));
    console.log("Image Base64 length:", imageBase64.length);
    console.log("Using model version:", modelVersion);
    console.log("Using temperature:", temperature);
    
    // استخدام إصدار النموذج المحدد
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;
    
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
        temperature: temperature,
        maxOutputTokens: 1024,
        topK: 40,
        topP: 0.95
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
      
      // تحسين استخراج البيانات بعد الحصول على JSON
      const enhancedData = enhanceExtractedData(parsedData, extractedText);
      
      // تحويل البيانات العربية إلى مفاتيح إنجليزية
      const mappedData: any = {};
      
      // تحقق من وجود أي من الحقول في parsedData وتعيينها للمفاتيح الإنجليزية
      if (enhancedData.code || enhancedData["الكود"] || enhancedData["كود"]) {
        mappedData.code = enhancedData.code || enhancedData["الكود"] || enhancedData["كود"];
      }
      
      if (enhancedData.senderName || enhancedData["اسم المرسل"] || enhancedData["الاسم"]) {
        mappedData.senderName = enhancedData.senderName || enhancedData["اسم المرسل"] || enhancedData["الاسم"];
      }
      
      if (enhancedData.phoneNumber || enhancedData["رقم الهاتف"] || enhancedData["الهاتف"]) {
        mappedData.phoneNumber = enhancedData.phoneNumber || enhancedData["رقم الهاتف"] || enhancedData["الهاتف"];
      }
      
      if (enhancedData.province || enhancedData["المحافظة"] || enhancedData["محافظة"]) {
        mappedData.province = enhancedData.province || enhancedData["المحافظة"] || enhancedData["محافظة"];
      }
      
      if (enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"]) {
        mappedData.price = enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"];
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
      // تقييم جودة البيانات المستخرجة
      const confidenceScore = calculateConfidenceScore(mappedData);
      
      return {
        success: true,
        message: "تم استخراج البيانات بنجاح",
        data: {
          extractedText,
          parsedData: mappedData,
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

// تحسين البيانات المستخرجة عن طريق تنظيفها وتحليل النص الكامل للاستدلال على البيانات المفقودة
function enhanceExtractedData(parsedData: any, fullText: string): any {
  const enhancedData = { ...parsedData };
  
  // تنظيف الكود (حذف أي أحرف غير رقمية)
  if (enhancedData.code) {
    // تنظيف الكود من الأحرف غير الرقمية (مع مراعاة الأرقام العربية)
    enhancedData.code = enhancedData.code.toString().replace(/[^\d٠-٩]/g, '');
    
    // تحويل الأرقام العربية إلى أرقام إنجليزية
    enhancedData.code = enhancedData.code.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30));
  } else {
    // محاولة استخراج الكود من النص إذا لم يتم العثور عليه
    const codeMatch = fullText.match(/كود[:\s]+([0-9]+)/i) || 
                      fullText.match(/code[:\s]+([0-9]+)/i) || 
                      fullText.match(/رقم[:\s]+([0-9]+)/i) ||
                      fullText.match(/رمز[:\s]+([0-9]+)/i) ||
                      fullText.match(/\b\d{6,9}\b/g); // البحث عن أي رقم من 6 إلى 9 أرقام
                      
    if (codeMatch && codeMatch[1]) {
      enhancedData.code = codeMatch[1].trim();
    } else if (codeMatch && Array.isArray(codeMatch)) {
      enhancedData.code = codeMatch[0].trim();
    }
  }
  
  // تنظيف رقم الهاتف (تنسيق أرقام الهاتف العراقية)
  if (enhancedData.phoneNumber) {
    // إزالة الأحرف غير الرقمية
    enhancedData.phoneNumber = enhancedData.phoneNumber.toString()
      .replace(/[^\d٠-٩\+\-]/g, '')
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30));
    
    // إذا كان الرقم لا يبدأ بـ "07" أو "+964"، نحاول إصلاحه
    if (!enhancedData.phoneNumber.match(/^(\+?964|0)7/)) {
      // إذا كان الرقم يبدأ بـ "7" فقط، نضيف "0" قبله
      if (enhancedData.phoneNumber.match(/^7/)) {
        enhancedData.phoneNumber = "0" + enhancedData.phoneNumber;
      }
    }
  } else {
    // محاولة استخراج رقم الهاتف من النص
    const phoneMatch = fullText.match(/هاتف[:\s]+([0-9\-\+\s]+)/i) || 
                       fullText.match(/phone[:\s]+([0-9\-\+\s]+)/i) || 
                       fullText.match(/جوال[:\s]+([0-9\-\+\s]+)/i) || 
                       fullText.match(/رقم الهاتف[:\s]+([0-9\-\+\s]+)/i) ||
                       fullText.match(/\b(07\d{8,9}|\+964\d{8,9})\b/g);
                       
    if (phoneMatch && phoneMatch[1]) {
      enhancedData.phoneNumber = phoneMatch[1].trim();
    } else if (phoneMatch && Array.isArray(phoneMatch)) {
      enhancedData.phoneNumber = phoneMatch[0].trim();
    }
  }
  
  // محاولة تنظيف السعر من أي أحرف غير ضرورية
  if (enhancedData.price) {
    let priceValue = enhancedData.price.toString()
      .replace(/[^\d٠-٩\.,]/g, '')
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30));
    
    // تحويل الفاصلة إلى نقطة للأرقام العشرية
    priceValue = priceValue.replace(/,/g, '.');
    
    if (priceValue) {
      enhancedData.price = priceValue;
    }
  }
  
  return enhancedData;
}

// حساب نتيجة الثقة في البيانات المستخرجة
function calculateConfidenceScore(data: any): number {
  let score = 0;
  const fields = ['code', 'senderName', 'phoneNumber', 'province', 'price'];
  const weights = {
    code: 25,
    senderName: 20,
    phoneNumber: 20,
    province: 15,
    price: 20
  };
  
  for (const field of fields) {
    if (data[field] && data[field].toString().trim() !== '') {
      // للكود، نتحقق من أنه رقم فعلًا
      if (field === 'code') {
        if (/^\d+$/.test(data[field].toString())) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف الدرجة إذا كان الكود غير رقمي
        }
      } 
      // لرقم الهاتف، نتحقق من أنه بالتنسيق الصحيح
      else if (field === 'phoneNumber') {
        if (/^(\+?964|0)7\d{8,9}$/.test(data[field].toString().replace(/\D/g, ''))) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف الدرجة إذا كان رقم الهاتف بتنسيق غير صحيح
        }
      } 
      // للسعر، نتحقق من أنه رقم
      else if (field === 'price') {
        if (/^\d+(\.\d+)?$/.test(data[field].toString().replace(/[^\d.]/g, ''))) {
          score += weights[field];
        } else {
          score += weights[field] * 0.5; // نصف الدرجة إذا كان السعر بتنسيق غير صحيح
        }
      } 
      // للحقول النصية، نتحقق من أنها ليست قصيرة جدًا
      else {
        if (data[field].toString().length > 2) {
          score += weights[field];
        } else {
          score += weights[field] * 0.7; // 70% من الدرجة إذا كان النص قصيرًا
        }
      }
    }
  }
  
  return score;
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

// وظيفة لاختبار نماذج Gemini المختلفة ومقارنة النتائج
export async function testGeminiModels(
  apiKey: string, 
  imageBase64: string, 
  models: string[] = ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-flash']
): Promise<{
  results: Array<{
    model: string;
    success: boolean;
    data?: any;
    confidence?: number;
    error?: string;
  }>;
  bestModel: string;
}> {
  const results = [];
  
  for (const model of models) {
    try {
      console.log(`Testing Gemini model: ${model}`);
      const result = await extractDataWithGemini({
        apiKey,
        imageBase64,
        modelVersion: model,
        enhancedExtraction: true
      });
      
      results.push({
        model,
        success: result.success,
        data: result.data,
        confidence: result.data?.confidence || 0,
        error: result.success ? undefined : result.message
      });
    } catch (error) {
      console.error(`Error testing model ${model}:`, error);
      results.push({
        model,
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      });
    }
  }
  
  // ترتيب النتائج حسب نسبة الثقة
  results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  
  // اختيار أفضل نموذج (النموذج بأعلى نسبة ثقة)
  const bestModel = results.length > 0 && results[0].success ? results[0].model : models[0];
  
  return {
    results,
    bestModel
  };
}
