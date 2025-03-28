
import { ApiResult } from "../apiService";
import { extractDataWithGemini } from "./api";

/**
 * وظيفة لاستخراج البيانات من صورة باستخدام Gemini AI
 */
export async function geminiExtractData(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ApiResult> {
  try {
    // الحصول على مفتاح API من المتغيرات البيئية أو التخزين المحلي
    const apiKey = localStorage.getItem('gemini_api_key');
    
    if (!apiKey) {
      console.error("لم يتم العثور على مفتاح API لـ Gemini");
      return {
        success: false,
        message: "لم يتم العثور على مفتاح API لـ Gemini. يرجى إعداد المفتاح في صفحة الإعدادات."
      };
    }
    
    // التأكد من أن البيانات صالحة
    if (!imageBase64 || imageBase64.length < 100) {
      console.error("بيانات الصورة غير صالحة أو قصيرة جدًا");
      return {
        success: false,
        message: "بيانات الصورة غير صالحة"
      };
    }
    
    console.log("استخراج البيانات من الصورة باستخدام Gemini...");
    
    // استدعاء واجهة برمجة التطبيقات Gemini لاستخراج البيانات
    const result = await extractDataWithGemini({
      apiKey,
      imageBase64,
      enhancedExtraction: true
    });
    
    console.log("نتيجة Gemini:", result.success ? "نجاح" : "فشل");
    
    if (!result.success) {
      console.error("فشل استخراج البيانات من Gemini:", result.message);
      return result;
    }
    
    return {
      success: true,
      message: "تم استخراج البيانات بنجاح",
      data: result.data?.parsedData || {},
      data: {
        ...result.data?.parsedData || {},
        extractedText: result.data?.extractedText || "",
        confidence: result.data?.confidence || 0
      }
    };
  } catch (error) {
    console.error("خطأ في استخراج البيانات باستخدام Gemini:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "خطأ غير معروف في معالجة الصورة"
    };
  }
}
