
/**
 * وسيط لخدمة Gemini API
 * هذا الملف يوجه الاستدعاءات إلى واجهة API الرئيسية
 */
import { extractDataWithGemini as apiExtractDataWithGemini } from "./api";
import { fileToBase64 } from "./utils";
import { ApiResult } from "../apiService";

/**
 * استخراج البيانات من الصورة باستخدام خدمة Gemini
 * @param file ملف الصورة للتحليل
 * @param existingText النص المستخرج مسبقًا (اختياري)
 */
export const extractDataWithGemini = async (
  fileOrParams: File | Blob | { imageBase64: string; apiKey: string },
  existingText: string = ""
): Promise<ApiResult> => {
  try {
    // التعامل مع الحالة التي يتم فيها تمرير كائن الإعدادات مباشرة
    if (!isFileOrBlob(fileOrParams)) {
      return apiExtractDataWithGemini(fileOrParams);
    }
    
    // تحويل الملف إلى Base64
    const imageBase64 = await fileToBase64(fileOrParams);
    
    // الحصول على مفتاح API من التخزين المحلي
    const apiKey = localStorage.getItem("geminiApiKey") || "";
    
    // التحقق من وجود مفتاح API
    if (!apiKey) {
      return {
        success: false,
        message: "لم يتم العثور على مفتاح Gemini API",
        data: null
      };
    }
    
    // استدعاء API مع النص الموجود كمساعد
    const params = {
      apiKey,
      imageBase64,
      enhancedExtraction: true
    };
    
    return await apiExtractDataWithGemini(params);
  } catch (error) {
    console.error("خطأ في استخراج البيانات:", error);
    
    return {
      success: false,
      message: `خطأ في استخراج البيانات: ${error instanceof Error ? error.message : String(error)}`,
      data: null
    };
  }
};

/**
 * التحقق مما إذا كان الكائن ملف أو blob
 */
function isFileOrBlob(obj: any): obj is File | Blob {
  return obj instanceof File || obj instanceof Blob;
}

// تصدير الدوال من ملفات API أخرى
export { testGeminiConnection } from "./api";
