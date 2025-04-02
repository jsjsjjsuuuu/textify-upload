
/**
 * وظائف تحليل استجابة Gemini API
 */

import { GeminiResponse } from "./types";
import { ApiResult } from "../apiService";
import { 
  autoExtractData, 
  mergeExtractedData, 
  validateExtractedData, 
  calculateDataConfidence,
  cleanExtractedData
} from "@/utils/extractionUtils";
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

    // محاولة استخراج JSON من النص - تحسين طريقة استخراج JSON
    try {
      // 1. محاولة استخراج JSON باستخدام أنماط متعددة ومحسنة
      const jsonPatterns = [
        // نمط ال JSON في كتل markdown
        /```(?:json)?\s*({[\s\S]*?})\s*```/i,
        // نمط ال JSON العادي (أي كائن بين {} قوسين)
        /{[\s\S]*?"companyName"[\s\S]*?}/i,
        // نمط أكثر مرونة لاستخراج أي كائن JSON
        /{[\s\S]*?}/,
        // نمط يبحث عن بداية الـ JSON بدقة أكبر
        /(\{(?:\s*"[^"]+"\s*:\s*"[^"]*"\s*,?)+\})/
      ];

      let foundJson = false;
      
      for (const pattern of jsonPatterns) {
        if (foundJson) break;
        
        const match = extractedText.match(pattern);
        if (match && (match[1] || (match[0] && match[0].includes('"')))) {
          const jsonText = match[1] || match[0];
          
          try {
            // تنظيف النص قبل التحليل بطريقة أكثر شمولاً
            const cleanedJson = jsonText
              .replace(/[\u201C\u201D]/g, '"') // استبدال علامات الاقتباس الذكية
              .replace(/[\u2018\u2019]/g, "'") // استبدال علامات الاقتباس المفردة
              .replace(/،/g, ',')  // استبدال الفاصلة العربية بالإنجليزية
              .replace(/\n/g, ' ') // استبدال السطور الجديدة بمسافات
              .replace(/\s+/g, ' ') // تقليل المسافات المتعددة إلى مسافة واحدة
              .replace(/:\s*""/g, ': ""') // تنظيف المسافات حول القيم الفارغة
              .replace(/,\s*}/g, '}') // إزالة الفواصل الزائدة في النهاية
              .replace(/}[^{]*{/g, '},{') // تصحيح التنسيق المحتمل للـ JSON المتعدد
              .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'); // تأكد من أن المفاتيح محاطة بعلامات اقتباس
              
            console.log("محاولة تحليل JSON المنظف:", cleanedJson);
            jsonData = JSON.parse(cleanedJson);
            console.log("تم استخراج JSON من النص:", jsonData);
            foundJson = true;
          } catch (e) {
            console.error("خطأ في تحليل JSON من النمط:", e);
            // محاولة تنظيف إضافية في حالة الفشل
            try {
              // محاولة إصلاح مشاكل التنسيق الشائعة
              const repairJson = jsonText
                .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // إضافة علامات اقتباس للمفاتيح
                .replace(/:\s*([a-zA-Z0-9_]+)\s*([,}])/g, ':"$1"$2'); // إضافة علامات اقتباس للقيم النصية
              
              console.log("محاولة إصلاح JSON:", repairJson);
              jsonData = JSON.parse(repairJson);
              console.log("تم إصلاح JSON بنجاح:", jsonData);
              foundJson = true;
            } catch (repairError) {
              console.error("فشل إصلاح JSON:", repairError);
            }
          }
        }
      }
      
      // 2. إذا لم ينجح أي نمط، نحاول استخراج JSON كصيغة نصية - طريقة محسنة
      if (!foundJson) {
        try {
          // البحث عن أزواج الخصائص والقيم في النص بطريقة أكثر شمولاً
          const keyValuePairs: Record<string, string> = {};
          const properties = ['companyName', 'code', 'senderName', 'phoneNumber', 'province', 'price'];
          
          for (const prop of properties) {
            // أنماط متعددة للبحث عن كل خاصية
            const propPatterns = [
              new RegExp(`"?${prop}"?\\s*:\\s*"([^"]*)"`, 'i'),
              new RegExp(`"?${prop}"?\\s*:\\s*"?([^",}]*)"?`, 'i'),
              new RegExp(`${prop}\\s*[=:]\\s*([^\\n,}]*)`, 'i'),
              new RegExp(`[\\b\\s]${prop}[\\b\\s]*:?\\s*([^\\n,}]*)`, 'i')
            ];
            
            for (const pattern of propPatterns) {
              const match = extractedText.match(pattern);
              if (match && match[1]) {
                keyValuePairs[prop] = match[1].trim();
                break;
              }
            }
          }
          
          if (Object.keys(keyValuePairs).length > 0) {
            jsonData = keyValuePairs;
            console.log("تم استخراج أزواج الخصائص والقيم:", jsonData);
            foundJson = true;
          }
        } catch (e) {
          console.error("خطأ في استخراج أزواج الخصائص والقيم:", e);
        }
      }
    } catch (e) {
      console.error("خطأ عام في محاولة استخراج JSON:", e);
    }

    // 3. إذا لم يتم العثور على JSON، استخدم الاستخراج التلقائي المحسن
    if (Object.keys(jsonData).length === 0) {
      console.log("لم يتم العثور على JSON، جاري محاولة استخراج البيانات من النص");
      jsonData = autoExtractData(extractedText);
      console.log("البيانات المستخرجة تلقائياً:", jsonData);
    }
    
    // تنظيف وتصحيح البيانات المستخرجة
    jsonData = cleanExtractedData(jsonData);
    
    // محاولة تحسين البيانات بدمج النتائج من استخراج JSON واستخراج النص
    if (Object.keys(jsonData).length > 0) {
      // استخراج بيانات إضافية من النص للحقول الفارغة
      const textExtractedData = autoExtractData(extractedText);
      jsonData = mergeExtractedData(jsonData, textExtractedData);
    }
    
    // التحقق من صحة البيانات المستخرجة
    const validationResults = validateExtractedData(jsonData);
    
    // حساب درجة الثقة في البيانات
    confidence = calculateDataConfidence(jsonData);
    
    console.log("نتائج التحقق:", validationResults);
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
