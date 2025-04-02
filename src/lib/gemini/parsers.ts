
/**
 * وظائف تحليل استجابة Gemini API
 */

import { GeminiResponse } from "./types";
import { ApiResult } from "../apiService";
import { autoExtractData, mergeExtractedData } from "@/utils/extractionUtils";
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

    console.log("النص المستخرج من Gemini:", extractedText);

    // محاولة استخراج JSON من النص
    try {
      // 1. البحث عن نمط ```json ... ``` في النص
      const jsonMarkdownPattern = /```(?:json)?\s*({[\s\S]*?})\s*```/i;
      const jsonMarkdownMatch = extractedText.match(jsonMarkdownPattern);
      
      if (jsonMarkdownMatch && jsonMarkdownMatch[1]) {
        try {
          const cleanedJson = jsonMarkdownMatch[1]
            .replace(/[\u201C\u201D]/g, '"') // استبدال علامات الاقتباس الذكية
            .replace(/[\u2018\u2019]/g, "'") // استبدال علامات الاقتباس المفردة
            .replace(/،/g, ',');  // استبدال الفاصلة العربية بالإنجليزية
            
          jsonData = JSON.parse(cleanedJson);
          console.log("تم استخراج JSON من نمط Markdown:", jsonData);
        } catch (e) {
          console.error("خطأ في تحليل JSON من نمط Markdown:", e);
        }
      }
      
      // 2. إذا لم ينجح الخيار الأول، نبحث عن أي كائن JSON في النص
      if (Object.keys(jsonData).length === 0) {
        // البحث عن أي نص محاط بأقواس {}
        const simpleJsonPattern = /{[\s\S]*?}/;
        const simpleJsonMatch = extractedText.match(simpleJsonPattern);
        
        if (simpleJsonMatch && simpleJsonMatch[0]) {
          try {
            const cleanedJson = simpleJsonMatch[0]
              .replace(/[\u201C\u201D]/g, '"')
              .replace(/[\u2018\u2019]/g, "'")
              .replace(/،/g, ',');
              
            jsonData = JSON.parse(cleanedJson);
            console.log("تم استخراج JSON من النص مباشرة:", jsonData);
          } catch (e) {
            console.error("خطأ في تحليل JSON المباشر:", e);
          }
        }
      }
    } catch (e) {
      console.error("خطأ عام في محاولة استخراج JSON:", e);
    }

    // 3. إذا لم يتم العثور على JSON، استخدم الاستخراج التلقائي
    if (Object.keys(jsonData).length === 0) {
      console.log("لم يتم العثور على JSON، جاري محاولة استخراج البيانات من النص");
      jsonData = autoExtractData(extractedText);
      console.log("البيانات المستخرجة تلقائياً:", jsonData);
    } else {
      // تنظيف وتصحيح البيانات في JSON
      if (jsonData.price) {
        jsonData.price = formatPrice(jsonData.price);
      }
      
      if (jsonData.phoneNumber) {
        jsonData.phoneNumber = jsonData.phoneNumber.trim();
        // التأكد من أن رقم الهاتف يحتوي على أرقام فقط
        jsonData.phoneNumber = jsonData.phoneNumber.replace(/\D/g, '');
        
        // إضافة 0 في البداية إذا كان يبدأ بـ 7 وطوله 10 أرقام
        if (jsonData.phoneNumber.startsWith('7') && jsonData.phoneNumber.length === 10) {
          jsonData.phoneNumber = '0' + jsonData.phoneNumber;
        }
      }
    }
    
    // محاولة تحسين البيانات بدمج النتائج من استخراج JSON واستخراج النص
    if (Object.keys(jsonData).length > 0) {
      // استخراج بيانات إضافية من النص للحقول الفارغة
      const textExtractedData = autoExtractData(extractedText);
      jsonData = mergeExtractedData(jsonData, textExtractedData);
    }
    
    // حساب درجة الثقة في البيانات
    confidence = calculateConfidence(jsonData);
    
    console.log("البيانات النهائية المستخرجة:", {
      jsonData,
      confidence
    });

    // ضمان أن كل الحقول موجودة حتى لو كانت فارغة
    const finalData = {
      companyName: jsonData.companyName || "",
      code: jsonData.code || "",
      senderName: jsonData.senderName || "",
      phoneNumber: jsonData.phoneNumber || "",
      province: jsonData.province || "",
      price: jsonData.price || ""
    };

    return {
      success: true,
      data: {
        extractedText: extractedText,
        parsedData: finalData,
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
