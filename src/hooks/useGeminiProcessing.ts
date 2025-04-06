import { useState, useCallback } from "react";
import { 
  getNextApiKey, 
  resetAllApiKeys, 
  getApiKeyStats,
  addApiKey,
  testConnection
} from "@/lib/gemini";
import { ApiResult } from "@/lib/gemini/types";
import { fileToBase64 } from "@/lib/gemini/utils";
import { readImageFile } from "@/utils/fileReader";
import { toast } from "sonner";
import { ImageData } from "@/types/ImageData";
import { extractTextFromImage } from "@/lib/gemini/api";

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
  
  // معالجة الصور باستخدام Gemini API - وظيفة جديدة توافق مع اسم الاستدعاء المتوقع
  const processWithGemini = useCallback(async (file: File | Blob, imageData?: ImageData): Promise<ImageData> => {
    try {
      setIsProcessing(true);
      
      // إعداد البيانات الأساسية للصورة إذا لم تكن موجودة
      const baseImageData: ImageData = imageData || {
        id: crypto.randomUUID(),
        file: null,
        previewUrl: null,
        date: new Date(),
        extractedText: "",
        confidence: 0,
        companyName: "",
        code: "",
        senderName: "",
        phoneNumber: "",
        province: "",
        price: "",
        status: "pending",
        error: null,
        storage_path: null,
        user_id: null,
        number: 0,
        submitted: false
      };
      
      // تحويل الملف إلى كائن File إذا كان من نوع Blob
      let fileToProcess: File;
      if (file instanceof File) {
        fileToProcess = file;
      } else {
        // تحويل Blob إلى File (إضافة خصائص File المفقودة)
        const blobAsFile = new File([file], "image.jpg", { 
          type: file.type || "image/jpeg", 
          lastModified: Date.now() 
        });
        fileToProcess = blobAsFile;
      }
      
      // استدعاء وظيفة معالجة الصورة مع Gemini
      const apiResult = await processImageWithGemini(fileToProcess);
      
      // عند نجاح المعالجة، تحديث بيانات الصورة
      if (apiResult.success && apiResult.data) {
        baseImageData.extractedText = apiResult.data.extractedText || "";
        baseImageData.confidence = apiResult.data.confidence || 0;
        
        if (apiResult.data.parsedData) {
          // استخراج البيانات المهيكلة
          const parsedData = apiResult.data.parsedData;
          baseImageData.code = parsedData.code || baseImageData.code;
          baseImageData.senderName = parsedData.senderName || parsedData.sender_name || baseImageData.senderName;
          baseImageData.phoneNumber = parsedData.phoneNumber || parsedData.phone_number || baseImageData.phoneNumber;
          baseImageData.province = parsedData.province || baseImageData.province;
          baseImageData.price = parsedData.price || baseImageData.price;
          baseImageData.companyName = parsedData.companyName || parsedData.company_name || baseImageData.companyName;
        }
        
        baseImageData.status = "completed";
      } else {
        // في حالة فشل المعالجة
        baseImageData.status = "error";
        baseImageData.error = apiResult.message || "حدث خطأ غير معروف";
        baseImageData.apiKeyError = apiResult.apiKeyError || false;
      }
      
      return baseImageData;
      
    } catch (error: any) {
      console.error("خطأ في معالجة الصورة مع Gemini:", error);
      
      // إرجاع بيانات الصورة مع حالة الخطأ
      const errorImageData: ImageData = {
        ...(imageData as ImageData),
        status: "error",
        error: error.message || "حدث خطأ غير معروف أثناء معالجة الصورة",
        apiKeyError: false
      };
      
      return errorImageData;
      
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
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
        // تحسين الحل لمشكلة Blob/File
        if (imageFile instanceof File) {
          base64Data = await fileToBase64(imageFile);
        } else {
          // إذا كان Blob، نحوله إلى File أولاً
          const blobAsFile = new File([imageFile], "image.jpg", { 
            type: imageFile.type || 'image/jpeg', 
            lastModified: Date.now() 
          });
          base64Data = await fileToBase64(blobAsFile);
        }
      }
      
      // إعادة ضغط الصورة إذا كانت كبيرة جدًا
      if (base64Data.length > 4000000) {
        console.log("الصورة كبيرة جدًا، محاولة ضغطها...");
        try {
          // إذا كان imageFile من نوع string، قم بتحويله إلى blob أولاً
          let fileForCompression: File;
          if (typeof imageFile === 'string') {
            const fetchedBlob = await (await fetch(imageFile)).blob();
            fileForCompression = new File([fetchedBlob], "image.jpg", { type: 'image/jpeg', lastModified: Date.now() });
          } else if (imageFile instanceof File) {
            fileForCompression = imageFile;
          } else {
            // Blob to File
            fileForCompression = new File([imageFile], "image.jpg", { type: 'image/jpeg', lastModified: Date.now() });
          }
          base64Data = await readImageFile(fileForCompression, 0.7); // ضغط بجودة 70%
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
      const result = await extractTextFromImage({
        apiKey,
        imageBase64: base64Data,
        modelVersion: geminiStats.currentModel,
        temperature: 0.1,
        enhancedExtraction: true
      });
      
      // التأكد من أن النتيجة تحتوي على حقل apiKeyError
      if (!('apiKeyError' in result)) {
        result.apiKeyError = false;
      }
      
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
    } catch (error: any) {
      console.error("خطأ في معالجة الصورة باستخدام Gemini:", error);
      geminiStats.failed++;
      
      return {
        success: false,
        message: `خطأ عام في معالجة الصورة: ${error.message}`,
        apiKeyError: false
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
      
      // اختبار الاتصال - استبدلناها بـ testConnection
      const result = await testConnection(apiKey);
      
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
    processWithGemini,
    resetApiKeys: resetAllApiKeys,
    getApiStats: getApiKeyStats,
    setGeminiModel: (model: string) => {
      geminiStats.currentModel = model;
      console.log(`تم تعيين نموذج Gemini إلى: ${model}`);
    },
    getProcessingStats: () => ({ ...geminiStats }),
    testGeminiApiConnection: async (customApiKey?: string): Promise<boolean> => {
      try {
        const apiKey = customApiKey || getNextApiKey();
        if (!apiKey) return false;
        
        const result = await testConnection(apiKey); // تغيير هنا لاستخدام الدالة الصحيحة
        
        if (result.success) {
          if (customApiKey) addApiKey(customApiKey);
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    },
    isGeminiProcessing: isProcessing
  };
};
