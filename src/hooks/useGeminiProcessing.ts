
import { useState, useCallback } from "react";
import { 
  extractDataWithGemini, 
  getNextApiKey, 
  resetAllApiKeys, 
  getApiKeyStats,
  addApiKey,
  testGeminiConnection
} from "@/lib/geminiService";
import { ApiResult } from "@/lib/apiService";
import { fileToBase64 } from "@/lib/gemini/utils";
import { readImageFile } from "@/utils/fileReader";
import { toast } from "sonner";

export interface GeminiStats {
  processed: number;
  successful: number;
  failed: number;
  currentModel: string;
}

// حالة المعالجة المشتركة
const geminiStats: GeminiStats = {
  processed: 0,
  successful: 0,
  failed: 0,
  currentModel: 'gemini-2.0-flash'
};

export const useGeminiProcessing = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // معالجة الصور باستخدام Gemini API
  const processImageWithGemini = useCallback(async (imageFile: File | Blob | string): Promise<ApiResult> => {
    try {
      setIsProcessing(true);
      geminiStats.processed++;
      
      let base64Data: string;
      
      if (typeof imageFile === 'string') {
        // إذا كان عنوان URL صورة أو Base64 بالفعل
        if (imageFile.startsWith('data:image')) {
          base64Data = imageFile;
        } else {
          // تحويل عنوان URL إلى Base64
          const response = await fetch(imageFile);
          const blob = await response.blob();
          base64Data = await fileToBase64(blob);
        }
      } else {
        // تحويل ملف أو Blob إلى Base64
        base64Data = await fileToBase64(imageFile);
      }
      
      // إعادة ضغط الصورة إذا كانت كبيرة جدًا
      if (base64Data.length > 4000000) {
        console.log("الصورة كبيرة جدًا، محاولة ضغطها...");
        try {
          base64Data = await readImageFile(imageFile, 0.7); // ضغط بجودة 70%
        } catch (compressionError) {
          console.error("فشل ضغط الصورة:", compressionError);
        }
      }
      
      // الحصول على مفتاح API نشط
      const apiKey = getNextApiKey();
      if (!apiKey) {
        geminiStats.failed++;
        return {
          success: false,
          message: "لم يتم العثور على مفتاح API صالح",
          apiKeyError: true
        };
      }
      
      console.log(`استخدام مفتاح API (الأحرف الأولى): ${apiKey.substring(0, 5)}...`);
      
      // معالجة الصورة
      const result = await extractDataWithGemini({
        apiKey,
        imageBase64: base64Data,
        modelVersion: geminiStats.currentModel,
        temperature: 0.1,
        enhancedExtraction: true
      });
      
      if (result.success) {
        geminiStats.successful++;
      } else {
        geminiStats.failed++;
        
        // إذا كان الخطأ متعلقًا بمفتاح API، حاول مرة أخرى بمفتاح آخر
        if (result.apiKeyError) {
          console.log("تم اكتشاف خطأ في مفتاح API، محاولة استخدام مفتاح آخر...");
          
          // تحقق مما إذا كان المستخدم يستخدم مفتاحًا مخصصًا
          const useCustomKey = localStorage.getItem('use_custom_gemini_api_key') === 'true';
          const customKey = localStorage.getItem('custom_gemini_api_key');
          
          if (useCustomKey && customKey) {
            // عرض تنبيه للمستخدم
            toast.error("حدث خطأ مع مفتاح API المخصص الخاص بك. يرجى التحقق من إعدادات المفتاح.", {
              duration: 6000,
              action: {
                label: "إدارة المفاتيح",
                onClick: () => {
                  // يمكنك هنا فتح نافذة إدارة المفاتيح
                  console.log("فتح إدارة المفاتيح");
                }
              }
            });
          } else {
            // محاولة استخدام المفتاح الافتراضي
            toast.error("حدث خطأ مع مفتاح API. جاري المحاولة باستخدام المفتاح الافتراضي.", {
              duration: 3000
            });
            
            // تعطيل استخدام المفتاح المخصص إذا كان مفعلاً
            localStorage.setItem('use_custom_gemini_api_key', 'false');
            
            // إعادة تعيين المفاتيح
            resetAllApiKeys();
            
            // محاولة مرة أخرى
            return processImageWithGemini(imageFile);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error("خطأ في معالجة الصورة باستخدام Gemini:", error);
      geminiStats.failed++;
      
      return {
        success: false,
        message: `خطأ عام في معالجة الصورة: ${error.message}`,
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // إعادة تعيين مفاتيح API
  const resetApiKeys = useCallback(() => {
    resetAllApiKeys();
  }, []);
  
  // الحصول على إحصائيات API
  const getApiStats = useCallback(() => {
    return getApiKeyStats();
  }, []);
  
  // تغيير نموذج Gemini
  const setGeminiModel = useCallback((model: string) => {
    geminiStats.currentModel = model;
    console.log(`تم تعيين نموذج Gemini إلى: ${model}`);
  }, []);
  
  // الحصول على إحصائيات المعالجة
  const getProcessingStats = useCallback(() => {
    return { ...geminiStats };
  }, []);
  
  // اختبار اتصال Gemini API
  const testGeminiApiConnection = useCallback(async (customApiKey?: string): Promise<boolean> => {
    try {
      // استخدام المفتاح المخصص إذا تم تمريره، وإلا استخدام المفتاح النشط
      const apiKey = customApiKey || getNextApiKey();
      if (!apiKey) {
        console.error("لا يوجد مفتاح API متاح للاختبار");
        return false;
      }
      
      console.log(`اختبار الاتصال باستخدام مفتاح API (الأحرف الأولى): ${apiKey.substring(0, 5)}...`);
      
      // اختبار الاتصال
      const result = await testGeminiConnection(apiKey);
      
      if (result.success) {
        console.log("تم الاتصال بـ Gemini API بنجاح");
        
        // إذا تم اختبار مفتاح مخصص وكان ناجحًا، قم بإعداده
        if (customApiKey) {
          addApiKey(customApiKey);
        }
        
        return true;
      } else {
        console.error(`فشل اختبار Gemini API: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error("خطأ في اختبار اتصال Gemini API:", error);
      return false;
    }
  }, []);
  
  return {
    processImageWithGemini,
    resetApiKeys,
    getApiStats,
    setGeminiModel,
    getProcessingStats,
    testGeminiApiConnection,
    isGeminiProcessing: isProcessing
  };
};
