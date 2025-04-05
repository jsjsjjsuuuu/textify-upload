
import { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { 
  extractDataWithGemini, 
  fileToBase64, 
  testGeminiConnection,
  getNextApiKey,
  reportApiKeyError,
  getApiKeyStats,
  resetAllApiKeys,
  addApiKey,
  isCustomKeyActive
} from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";
import { toast as sonnerToast } from "sonner";
import { autoCompressBeforeProcessing, enhanceImageForOCR } from "@/utils/imageCompression";
import { GeminiModelType, selectOptimalModel } from "@/lib/gemini/models";

export const useGeminiProcessing = () => {
  const [useGemini, setUseGemini] = useState(true);
  const [connectionTested, setConnectionTested] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // فحص الاتصال مع المفتاح
    const testConnection = async () => {
      if (!connectionTested) {
        try {
          const apiKey = getNextApiKey();
          await testGeminiApiConnection(apiKey);
        } catch (error) {
          console.error("فشل اختبار الاتصال الأولي:", error);
          // محاولة إعادة الاتصال بعد فترة قصيرة
          setTimeout(() => {
            setConnectionTested(false);
          }, 5000);
        }
      }
    };
    
    testConnection();
  }, [connectionTested]);

  // اختبار اتصال Gemini API
  const testGeminiApiConnection = async (apiKey: string) => {
    try {
      console.log("اختبار اتصال Gemini API...");
      const result = await testGeminiConnection(apiKey);
      if (result.success) {
        console.log("اتصال Gemini API ناجح");
        setConnectionTested(true);
        setUseGemini(true);
      } else {
        console.warn("فشل اختبار اتصال Gemini API:", result.message);
        toast({
          title: "تحذير",
          description: `فشل اختبار اتصال Gemini API: ${result.message}`,
          variant: "default"
        });
        
        // إعادة المحاولة بعد فترة
        setTimeout(() => {
          setConnectionTested(false);
        }, 30000); // 30 ثانية
      }
    } catch (error) {
      console.error("خطأ في اختبار اتصال Gemini API:", error);
      // إظهار رسالة خطأ مفصلة للمساعدة في تشخيص المشكلة
      sonnerToast.error(
        "خطأ في اتصال Gemini API",
        {
          description: `نوع الخطأ: ${error instanceof Error ? error.name : "غير معروف"}\nرسالة الخطأ: ${error instanceof Error ? error.message : String(error)}`
        }
      );
      
      // إعادة المحاولة بعد فترة
      setTimeout(() => {
        setConnectionTested(false);
      }, 30000); // 30 ثانية
    }
  };

  // وظيفة للتأخير المضمون بين طلبات API
  const sleepBetweenRequests = async (milliseconds: number) => {
    console.log(`تأخير ${milliseconds}ms بين طلبات API...`);
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
  };

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    // زيادة عداد المعالجة
    setProcessingCount(prev => prev + 1);
    
    try {
      // الحصول على المفتاح الحالي
      const geminiApiKey = getNextApiKey();
      console.log("استخدام مفتاح Gemini API بطول:", geminiApiKey.length);
      console.log("استخدام مفتاح مخصص:", isCustomKeyActive());

      // في بيئة المعاينة، نحاول استخدام Gemini مع تحذير المستخدم
      if (isPreviewEnvironment()) {
        console.log("تشغيل في بيئة معاينة (Lovable). محاولة استخدام Gemini قد تواجه قيود CORS.");
        sonnerToast.warning(
          "تنبيه",
          {
            description: "استخدام Gemini في بيئة المعاينة قد يواجه قيود CORS، يرجى التحلي بالصبر في حالة بطء المعالجة"
          }
        );
      }

      try {
        // معالجة الصورة وضغطها قبل إرسالها
        console.log("ضغط الصورة قبل المعالجة...");
        let processedFile: File;
        
        // الكشف عن حجم الملف وضغطه بناءً على ذلك
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 5) {
          sonnerToast.info(
            "تنبيه",
            {
              description: `جاري ضغط الصورة الكبيرة (${fileSizeMB.toFixed(1)}MB) قبل المعالجة`
            }
          );
          processedFile = await autoCompressBeforeProcessing(file);
        } else if (fileSizeMB > 2) {
          processedFile = await enhanceImageForOCR(file);
        } else {
          processedFile = file;
        }
        
        console.log("تحويل الملف إلى base64");
        const imageBase64 = await fileToBase64(processedFile);
        console.log("تم تحويل الملف إلى base64، بطول:", imageBase64.length);
        
        // تحديث الصورة لتظهر أنها قيد المعالجة
        const updatedImage: ImageData = { 
          ...image, 
          status: "processing" as const,
          extractedText: "جاري معالجة الصورة واستخراج البيانات..."
        };
        
        // تأخير قبل الاستخراج 
        await sleepBetweenRequests(2000);
        
        // اختيار النموذج المناسب بناءً على حجم الصورة وتعقيدها
        const selectedModel = selectOptimalModel(processedFile.size);
        console.log("النموذج المختار للاستخراج:", selectedModel);
        
        // إضافة معلومات تشخيصية
        console.log("بدء استدعاء extractDataWithGemini");
        console.log("إعدادات الاستخراج:", {
          apiKeyLength: geminiApiKey.length,
          imageBase64Length: imageBase64.length,
          enhancedExtraction: true,
          maxRetries: 3,
          retryDelayMs: 3000,
          fileSizeOriginalMB: fileSizeMB.toFixed(2),
          fileSizeProcessedMB: (processedFile.size / (1024 * 1024)).toFixed(2),
          isCustomKey: isCustomKeyActive(),
          modelVersion: selectedModel
        });
        
        // محاولة استخراج البيانات
        const extractionResult = await extractDataWithGemini({
          apiKey: geminiApiKey,
          imageBase64,
          enhancedExtraction: true,
          maxRetries: 2, 
          retryDelayMs: 3000,
          modelVersion: selectedModel
        });
        
        console.log("نتيجة استخراج Gemini:", extractionResult);
        
        if (extractionResult.success && extractionResult.data) {
          const { parsedData, extractedText, confidence } = extractionResult.data;
          
          // تحقق من وجود بيانات تم استخراجها
          if (parsedData && Object.keys(parsedData).length > 0) {
            console.log("Gemini نجح في استخراج البيانات:", parsedData);
            
            sonnerToast.success(
              "تم الاستخراج بنجاح",
              {
                description: "تم استخراج البيانات باستخدام Gemini AI"
              }
            );

            // تحديث الصورة بالبيانات المستخرجة
            const processedImage = updateImageWithExtractedData(
              image,
              extractedText || "",
              parsedData || {},
              confidence || 95,
              "gemini"
            );
            
            // تعيين الحالة استنادًا إلى وجود البيانات الرئيسية
            let finalImage: ImageData = processedImage;
            
            if (
              (finalImage.code && finalImage.code.length > 0) || 
              (finalImage.senderName && finalImage.senderName.length > 0) || 
              (finalImage.phoneNumber && finalImage.phoneNumber.length > 0)
            ) {
              finalImage = {
                ...finalImage,
                status: "completed" as const
              };
            } else {
              finalImage = {
                ...finalImage,
                status: "pending" as const
              };
            }
            
            return finalImage;
          } else {
            console.log("Gemini أرجع بيانات فارغة");
            
            // إذا كان هناك نص مستخرج ولكن لا يوجد بيانات منظمة
            if (extractedText && extractedText.length > 10) {
              sonnerToast.warning(
                "تم استخراج النص",
                {
                  description: "تم استخراج النص ولكن لم يتم التعرف على البيانات المنظمة"
                }
              );
              
              // محاولة استخراج البيانات من النص باستخدام parseGeminiResponse مباشرة
              const { parsedData: manualParsedData, confidenceScore: manualConfidence } = 
                await import("@/lib/gemini/parsers").then(module => module.parseGeminiResponse(extractedText));
              
              // إذا تم العثور على بيانات من خلال التحليل اليدوي
              if (manualParsedData && Object.keys(manualParsedData).length > 0) {
                console.log("تم استخراج البيانات يدويًا من النص:", manualParsedData);
                
                const manualProcessedImage = updateImageWithExtractedData(
                  image,
                  extractedText,
                  manualParsedData,
                  manualConfidence,
                  "gemini"
                );
                
                return {
                  ...manualProcessedImage,
                  status: "completed" as const
                };
              }
              
              return {
                ...image,
                status: "pending" as const,
                extractedText: extractedText
              };
            } else {
              sonnerToast.warning(
                "تنبيه",
                {
                  description: "لم يتمكن Gemini من استخراج بيانات من الصورة، يرجى محاولة تحميل صورة أوضح"
                }
              );
              
              return {
                ...image,
                status: "pending" as const,
                extractedText: "لم يتم استخراج نص. حاول مرة أخرى بصورة أوضح."
              };
            }
          }
        } else {
          console.log("فشل استخراج Gemini:", extractionResult.message);
          
          // الإبلاغ عن الخطأ لمدير المفاتيح
          reportApiKeyError(geminiApiKey, extractionResult.message || "خطأ غير معروف");
          
          sonnerToast.error(
            "فشل الاستخراج",
            {
              description: "فشل استخراج البيانات: " + extractionResult.message
            }
          );
          
          // إعادة الصورة مع حالة خطأ
          return {
            ...image,
            status: "error" as const,
            extractedText: "فشل استخراج النص: " + extractionResult.message,
            apiKeyError: true // إضافة علامة لتحديد أن الخطأ متعلق بمفتاح API
          };
        }
      } catch (geminiError: any) {
        console.error("خطأ في معالجة Gemini:", geminiError);
        
        // الإبلاغ عن الخطأ لمدير المفاتيح
        reportApiKeyError(geminiApiKey, geminiError.message || "خطأ غير معروف");
        
        // تحسين رسالة الخطأ
        let errorMessage = geminiError.message || 'خطأ غير معروف';
        let isApiKeyError = false;
        
        if (errorMessage.includes('Failed to fetch')) {
          errorMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك والمحاولة مرة أخرى.';
        } else if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError')) {
          errorMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى تحميل صورة أصغر حجمًا أو المحاولة مرة أخرى لاحقًا.';
        } else if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded') || 
                   errorMessage.includes('API key') || errorMessage.includes('invalid')) {
          errorMessage = 'تم تجاوز حصة API أو المفتاح غير صالح. قد تحتاج إلى إضافة مفتاح API خاص بك.';
          isApiKeyError = true;
        }
        
        sonnerToast.error(
          "خطأ",
          {
            description: `فشل في استخراج البيانات: ${errorMessage}`
          }
        );
        
        // إعادة الصورة مع حالة خطأ
        return {
          ...image,
          status: "error" as const,
          extractedText: "خطأ في المعالجة: " + errorMessage,
          apiKeyError: isApiKeyError // إضافة علامة لتحديد أن الخطأ متعلق بمفتاح API
        };
      }
    } catch (error) {
      console.error("خطأ عام في معالجة الصورة:", error);
      return {
        ...image,
        status: "error" as const,
        extractedText: "حدث خطأ غير متوقع أثناء معالجة الصورة. يرجى المحاولة مرة أخرى.",
      };
    } finally {
      // تقليل عداد المعالجة عند الانتهاء
      setProcessingCount(prev => Math.max(0, prev - 1));
    }
  };

  // وظيفة إعادة تعيين جميع مفاتيح API
  const resetApiKeys = useCallback(() => {
    resetAllApiKeys();
    sonnerToast.success(
      "تم إعادة تعيين المفاتيح",
      {
        description: "تم إعادة تعيين جميع مفاتيح API"
      }
    );
  }, []);

  // إضافة مفتاح API جديد
  const addNewApiKey = useCallback((key: string): boolean => {
    try {
      const result = addApiKey(key);
      if (result && key !== 'default') {
        sonnerToast.success(
          "تمت الإضافة",
          {
            description: "تم حفظ وتفعيل مفتاح API الخاص بك"
          }
        );
      } else if (result && key === 'default') {
        sonnerToast.success(
          "تم التغيير",
          {
            description: "تم العودة إلى استخدام مفتاح API الافتراضي"
          }
        );
      } else {
        sonnerToast.error(
          "خطأ",
          {
            description: "فشلت إضافة المفتاح، تأكد من صحة المفتاح"
          }
        );
      }
      return result;
    } catch (error) {
      console.error("خطأ في إضافة مفتاح API جديد:", error);
      sonnerToast.error(
        "خطأ",
        {
          description: "حدث خطأ أثناء إضافة مفتاح API جديد"
        }
      );
      return false;
    }
  }, []);

  return { 
    useGemini, 
    processWithGemini,
    resetApiKeys,
    addNewApiKey,
    getApiStats: getApiKeyStats,
    processingCount
  };
};
