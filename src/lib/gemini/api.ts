
import { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";
import { ApiResult } from "../apiService";

/**
 * استخراج البيانات من الصورة باستخدام Gemini API
 */
export const extractDataWithGemini = async (params: GeminiExtractParams): Promise<ApiResult<any>> => {
  const { 
    apiKey, 
    imageBase64, 
    extractionPrompt = DEFAULT_EXTRACTION_PROMPT, 
    temperature = 0.2,
    modelVersion = 'gemini-1.5-pro',
    enhancedExtraction = true,
    maxRetries = 3,
    retryDelayMs = 3000,
    testConnection = false
  } = params;
  
  // إذا كان هذا اختبار اتصال فقط
  if (testConnection) {
    try {
      // اختبار الاتصال بالAPI باستخدام طلب بسيط
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `فشل اختبار الاتصال: ${errorData.error?.message || response.statusText || 'خطأ غير معروف'}`,
          data: null
        };
      }
      
      return {
        success: true,
        message: "تم الاتصال بنجاح بخادم Gemini API",
        data: null
      };
    } catch (error: any) {
      return {
        success: false,
        message: `فشل اختبار الاتصال: ${error.message || 'خطأ غير معروف'}`,
        data: null
      };
    }
  }

  // التحقق من وجود مفتاح API والصورة
  if (!apiKey) {
    console.error("مفتاح Gemini API غير موجود");
    return {
      success: false,
      message: "مفتاح Gemini API غير موجود",
      data: null
    };
  }
  
  if (!imageBase64) {
    console.error("بيانات الصورة غير موجودة");
    return {
      success: false,
      message: "بيانات الصورة غير موجودة",
      data: null
    };
  }
  
  try {
    // استخدام prompt محسن إذا كان التحسين مفعلاً
    const finalPrompt = enhancedExtraction 
      ? ENHANCED_EXTRACTION_PROMPT 
      : extractionPrompt;
    
    // إنشاء كائن الطلب
    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            { text: finalPrompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 4096
      }
    };
    
    let attempts = 0;
    let lastError = null;
    
    // تنفيذ محاولات الاتصال بـ API مع إعادة المحاولة
    while (attempts < maxRetries) {
      try {
        console.log(`محاولة استدعاء Gemini API [${attempts + 1}/${maxRetries}]`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("خطأ في استجابة Gemini API:", errorData);
          
          // التحقق من أخطاء معدل الاستخدام
          if (response.status === 429 || (errorData.error?.message && 
              (errorData.error.message.includes("quota") || 
               errorData.error.message.includes("rate")))) {
            console.warn("تجاوز معدل الاستخدام - الانتظار قبل إعادة المحاولة");
            await new Promise(resolve => setTimeout(resolve, retryDelayMs * 2));  // انتظار أطول
          } else {
            // أخطاء أخرى
            throw new Error(errorData.error?.message || response.statusText || "خطأ غير معروف");
          }
          
          attempts++;
          continue;
        }
        
        const responseData: GeminiResponse = await response.json();
        
        // التحقق من وجود خطأ في رد API
        if (responseData.promptFeedback && responseData.promptFeedback.blockReason) {
          return {
            success: false,
            message: `تم حظر المحتوى: ${responseData.promptFeedback.blockReason}`,
            data: null
          };
        }
        
        if (!responseData.candidates || responseData.candidates.length === 0) {
          return {
            success: false,
            message: "لم يتم إرجاع أي محتوى من Gemini API",
            data: null
          };
        }
        
        const textContent = responseData.candidates[0].content.parts[0].text;
        
        console.log("تم استلام النص من Gemini API بنجاح:", textContent.substring(0, 100) + "...");
        
        // محاولة تحليل النص كـ JSON
        try {
          // البحث عن بداية ونهاية JSON في النص
          const jsonMatch = textContent.match(/```json\s*(\{[\s\S]*\})\s*```/) || 
                          textContent.match(/\{[\s\S]*\}/);
          
          if (jsonMatch && jsonMatch[1]) {
            const parsedData = JSON.parse(jsonMatch[1].trim());
            return {
              success: true,
              message: "تم استخراج البيانات بنجاح",
              data: {
                extractedText: textContent,
                parsedData: parsedData
              }
            };
          } else {
            console.log("لم يتم العثور على بيانات JSON في النص المستخرج");
            // إرجاع النص المستخرج فقط
            return {
              success: true,
              message: "تم استخراج النص فقط، لا توجد بيانات منظمة",
              data: {
                extractedText: textContent,
                parsedData: null
              }
            };
          }
        } catch (jsonError) {
          console.error("خطأ في تحليل بيانات JSON:", jsonError);
          
          // إرجاع النص المستخرج فقط في حالة فشل التحليل
          return {
            success: true,
            message: "تم استخراج النص، ولكن فشل تحليل البيانات المنظمة",
            data: {
              extractedText: textContent,
              parsedData: null
            }
          };
        }
      } catch (error: any) {
        console.error(`فشل استدعاء Gemini API (المحاولة ${attempts + 1})`, error);
        lastError = error;
        
        // الانتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        attempts++;
      }
    }
    
    // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
    return {
      success: false,
      message: `فشل استخراج البيانات بعد ${maxRetries} محاولات: ${lastError?.message || 'خطأ غير معروف'}`,
      data: null
    };
  } catch (error: any) {
    console.error("خطأ غير متوقع في استخراج البيانات:", error);
    return {
      success: false,
      message: `خطأ غير متوقع: ${error.message || 'خطأ غير معروف'}`,
      data: null
    };
  }
};

/**
 * اختبار الاتصال بـ Gemini API
 */
export const testGeminiConnection = (apiKey: string): Promise<ApiResult<any>> => {
  return extractDataWithGemini({
    apiKey,
    imageBase64: "",
    testConnection: true
  });
};

// نص الاستخراج الافتراضي
const DEFAULT_EXTRACTION_PROMPT = `
استخرج المعلومات التالية من الإيصال:
- الكود (code): رقم تعريفي للمعاملة
- اسم المرسل (senderName): الاسم الكامل للشخص المرسل
- رقم الهاتف (phoneNumber): رقم هاتف المرسل، مكون من 11 رقم
- المحافظة (province): اسم المحافظة في العراق
- السعر (price): المبلغ المالي، بالدينار العراقي
- اسم الشركة (companyName): اسم الشركة/المؤسسة

أرجع النتائج بتنسيق JSON فقط بدون أي نص إضافي:

\`\`\`json
{
  "code": "الكود",
  "senderName": "اسم المرسل",
  "phoneNumber": "رقم الهاتف",
  "province": "المحافظة",
  "price": "السعر",
  "companyName": "اسم الشركة"
}
\`\`\`
`;

// نص استخراج محسن
const ENHANCED_EXTRACTION_PROMPT = `
أنت نظام متخصص في استخراج المعلومات المهمة من الإيصالات وفواتير الشحن العراقية. مهمتك هي استخراج البيانات التالية بدقة:

1. الكود (code): الرقم التعريفي للمعاملة أو الطلب
2. اسم المرسل (senderName): الاسم الكامل للشخص المرسل (عادة مكتوب بعد "المرسل" أو "اسم الزبون")
3. رقم الهاتف (phoneNumber): رقم هاتف المرسل (يجب أن يكون 11 رقم ويبدأ غالباً بـ 075 أو 077 أو 078 أو 079)
4. المحافظة (province): اسم المحافظة في العراق (مثل بغداد، البصرة، أربيل، الموصل، الخ)
5. السعر (price): المبلغ المالي، بالدينار العراقي (يظهر غالباً بجانب "المبلغ" أو "السعر" أو "الكلفة" مع الأرقام)
6. اسم الشركة (companyName): اسم الشركة أو المؤسسة المسؤولة عن الشحن (عادة في أعلى الإيصال أو مع شعار)

ملاحظات مهمة:
- اترك الحقل فارغاً ("") إذا لم تتمكن من العثور على المعلومات
- لا تخمن البيانات إذا كنت غير متأكد
- تأكد من تنسيق رقم الهاتف بشكل صحيح (11 رقم)
- تعامل مع الأسعار كأرقام فقط، بدون رموز العملة
- الثقة (confidence): نسبة ثقتك بدقة البيانات المستخرجة (من 0 إلى 100)

قم بإرجاع النتائج بتنسيق JSON فقط، محاطة بعلامات التنسيق \`\`\`json و \`\`\`:

\`\`\`json
{
  "code": "الكود المستخرج",
  "senderName": "اسم المرسل المستخرج",
  "phoneNumber": "رقم الهاتف المستخرج",
  "province": "المحافظة المستخرجة",
  "price": "السعر المستخرج",
  "companyName": "اسم الشركة المستخرج",
  "confidence": 95
}
\`\`\`
`;
