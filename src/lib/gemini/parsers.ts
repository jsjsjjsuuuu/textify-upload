
/**
 * وظائف تحليل استجابة Gemini API
 */

import { GeminiResponse } from "./types";
import { ApiResult } from "../apiService";
import { autoExtractData } from "@/utils/extractionUtils";
import { formatPrice } from "./utils";

/**
 * استخراج النص والبيانات المنظمة من استجابة Gemini
 */
export function parseGeminiResponse(response: GeminiResponse): ApiResult {
  try {
    // التحقق من وجود استجابة
    if (!response || !response.candidates || response.candidates.length === 0) {
      console.error("استجابة Gemini فارغة أو لا تحتوي على مرشحين");
      return {
        success: false,
        message: "استجابة فارغة من Gemini API"
      };
    }

    // التحقق من وجود أخطاء
    if (response.promptFeedback?.blockReason) {
      return {
        success: false,
        message: `تم حظر المطالبة: ${response.promptFeedback.blockReason}`
      };
    }

    const candidate = response.candidates[0];
    
    // التحقق من وجود محتوى
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error("لا يوجد محتوى في استجابة Gemini");
      return {
        success: false,
        message: "استجابة Gemini لا تحتوي على محتوى"
      };
    }

    // استخراج النص من الاستجابة
    let extractedText = "";
    let jsonData: Record<string, string> = {};
    let confidence = 0;

    // تجميع جميع أجزاء النص
    candidate.content.parts.forEach(part => {
      if (part.text) {
        extractedText += part.text;
      }
    });

    if (!extractedText) {
      return {
        success: false,
        message: "لم يتم استخراج أي نص من الاستجابة"
      };
    }

    // البحث عن JSON في النص المستخرج
    const jsonRegex = /{[\s\S]*?}/gm;
    const jsonMatches = extractedText.match(jsonRegex);

    if (jsonMatches && jsonMatches.length > 0) {
      // محاولة تحليل كل تطابق JSON
      for (const jsonMatch of jsonMatches) {
        try {
          const parsedJson = JSON.parse(jsonMatch);
          
          // التحقق مما إذا كان هذا هو JSON الذي نبحث عنه
          if (parsedJson.code || parsedJson.companyName || parsedJson.senderName) {
            jsonData = parsedJson;
            
            // تنسيق السعر إذا وجد
            if (jsonData.price) {
              jsonData.price = formatPrice(jsonData.price);
            }
            
            // تخمين نسبة الثقة بناءً على اكتمال البيانات
            confidence = calculateConfidence(jsonData);
            break;
          }
        } catch (e) {
          console.log(`فشل تحليل JSON: ${jsonMatch}`);
          // متابعة البحث عن تطابقات أخرى
        }
      }
    }

    // إذا لم يتم العثور على JSON، محاولة استخراج البيانات من النص
    if (Object.keys(jsonData).length === 0) {
      console.log("لم يتم العثور على JSON، محاولة استخراج البيانات من النص");
      jsonData = autoExtractData(extractedText);
      confidence = calculateConfidence(jsonData);
    }

    return {
      success: true,
      data: {
        extractedText: extractedText,
        parsedData: jsonData,
        confidence: confidence
      },
      message: "تم تحليل استجابة Gemini بنجاح"
    };
  } catch (error) {
    console.error("خطأ في تحليل استجابة Gemini:", error);
    return {
      success: false,
      message: `خطأ في تحليل استجابة Gemini: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * حساب درجة الثقة بناء على اكتمال البيانات
 */
function calculateConfidence(data: Record<string, string>): number {
  // بدون بيانات = ثقة 0
  if (!data || Object.keys(data).length === 0) {
    return 0;
  }

  // تعيين وزن لكل حقل
  const weights = {
    code: 15,
    senderName: 15,
    phoneNumber: 20,
    province: 15,
    price: 15,
    companyName: 10
  };

  let totalWeight = 0;
  let scoreSum = 0;

  // حساب الدرجة لكل حقل
  for (const [field, weight] of Object.entries(weights)) {
    totalWeight += weight;
    
    if (data[field]) {
      // فحص صحة رقم الهاتف
      if (field === 'phoneNumber') {
        const digits = data[field].replace(/\D/g, '');
        if (digits.length === 11) {
          scoreSum += weight;
        } else {
          scoreSum += weight * 0.5; // نصف الدرجة لرقم هاتف غير صالح
        }
      } 
      // فحص صحة الكود
      else if (field === 'code') {
        if (data[field].length > 2) {
          scoreSum += weight;
        } else {
          scoreSum += weight * 0.5; // نصف الدرجة لكود قصير جداً
        }
      }
      // للحقول النصية الأخرى
      else {
        scoreSum += weight;
      }
    }
  }

  // حساب النسبة المئوية للثقة
  return Math.min(Math.round((scoreSum / totalWeight) * 100), 100);
}
