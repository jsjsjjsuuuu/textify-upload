
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { extractDataWithGemini, fileToBase64, testGeminiConnection } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";

export const useGeminiProcessing = () => {
  const [useGemini, setUseGemini] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [currentModel, setCurrentModel] = useState('gemini-1.5-pro');
  const { toast } = useToast();

  useEffect(() => {
    const geminiApiKey = localStorage.getItem("geminiApiKey");
    
    // إعداد مفتاح API افتراضي إذا لم يكن موجودًا
    if (!geminiApiKey) {
      const defaultApiKey = "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
      localStorage.setItem("geminiApiKey", defaultApiKey);
      console.log("تم تعيين مفتاح Gemini API افتراضي:", defaultApiKey);
      setUseGemini(true);
      // اختبار الاتصال بالمفتاح الافتراضي
      testGeminiApiConnection(defaultApiKey);
    } else {
      console.log("استخدام مفتاح Gemini API موجود بطول:", geminiApiKey.length);
      setUseGemini(true);
      // اختبار الاتصال بالمفتاح الموجود
      if (!connectionTested) {
        testGeminiApiConnection(geminiApiKey);
      }
    }
    
    // التحقق من حالة تجاوز الحصة المخزنة
    const storedQuotaExceeded = localStorage.getItem("geminiQuotaExceeded") === "true";
    if (storedQuotaExceeded) {
      setQuotaExceeded(true);
      setCurrentModel('gemini-1.5-flash'); // التبديل إلى نموذج أقل كلفة
      console.log("تم اكتشاف تجاوز للحصة سابق، استخدام نموذج بديل:", 'gemini-1.5-flash');
    }
  }, [connectionTested]);

  // اختبار اتصال Gemini API
  const testGeminiApiConnection = async (apiKey: string) => {
    try {
      console.log("اختبار اتصال Gemini API...");
      const result = await testGeminiConnection(apiKey);
      if (result.success) {
        console.log("اتصال Gemini API ناجح");
        setConnectionTested(true);
      } else {
        console.warn("فشل اختبار اتصال Gemini API:", result.message);
        toast({
          title: "تحذير",
          description: `فشل اختبار اتصال Gemini API: ${result.message}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("خطأ في اختبار اتصال Gemini API:", error);
    }
  };

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    const geminiApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    console.log("استخدام مفتاح Gemini API بطول:", geminiApiKey.length);
    console.log("استخدام نموذج Gemini:", currentModel);

    // في بيئة المعاينة، نحاول استخدام Gemini مع تحذير المستخدم
    if (isPreviewEnvironment()) {
      console.log("تشغيل في بيئة معاينة (Lovable). محاولة استخدام Gemini قد تواجه قيود CORS.");
      toast({
        title: "تنبيه",
        description: "استخدام Gemini في بيئة المعاينة قد يواجه قيود CORS، يرجى التحلي بالصبر في حالة بطء المعالجة",
        variant: "default"
      });
    }

    try {
      // الكشف عن حجم الملف وتقديم تحذير إذا كان كبيرًا جدًا
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) {
        toast({
          title: "تنبيه",
          description: `حجم الصورة كبير (${fileSizeMB.toFixed(1)}MB)، قد تستغرق المعالجة وقتًا أطول`,
          variant: "default"
        });
      }
      
      console.log("تحويل الملف إلى base64");
      const imageBase64 = await fileToBase64(file);
      console.log("تم تحويل الملف إلى base64، بطول:", imageBase64.length);
      
      // تحديث الصورة لتظهر أنها قيد المعالجة
      const updatedImage: ImageData = { 
        ...image, 
        status: "processing" as const,
        extractedText: "جاري معالجة الصورة واستخراج البيانات..."
      };
      
      // إضافة معلومات تشخيصية أكثر
      console.log("بدء استدعاء extractDataWithGemini");
      console.log("إعدادات الاستخراج:", {
        apiKeyLength: geminiApiKey.length,
        imageBase64Length: imageBase64.length,
        enhancedExtraction: true,
        maxRetries: 2,
        retryDelayMs: 3000,
        modelVersion: currentModel
      });
      
      const extractionResult = await extractDataWithGemini({
        apiKey: geminiApiKey,
        imageBase64,
        enhancedExtraction: true,
        maxRetries: 2,  // تقليل عدد المحاولات لتسريع الاستجابة
        retryDelayMs: 3000,  // تقليل مدة الانتظار بين المحاولات عند حدوث الخطأ
        modelVersion: currentModel  // استخدام النموذج الحالي
      });
      
      console.log("نتيجة استخراج Gemini:", extractionResult);
      
      if (extractionResult.success && extractionResult.data) {
        // إعادة تعيين حالة تجاوز الحصة عند نجاح الطلب
        if (quotaExceeded) {
          setQuotaExceeded(false);
          localStorage.removeItem("geminiQuotaExceeded");
        }
        
        const { parsedData, extractedText } = extractionResult.data;
        
        // تحقق من وجود بيانات تم استخراجها
        if (parsedData && Object.keys(parsedData).length > 0) {
          console.log("Gemini نجح في استخراج البيانات:", parsedData);
          
          // التحقق من البيانات المستخرجة
          console.log("البيانات المستخرجة المفصلة:", {
            code: parsedData.code,
            senderName: parsedData.senderName,
            phoneNumber: parsedData.phoneNumber,
            province: parsedData.province,
            price: parsedData.price,
            companyName: parsedData.companyName
          });
          
          toast({
            title: "تم الاستخراج بنجاح",
            description: "تم استخراج البيانات باستخدام Gemini AI",
          });

          // تحديث الصورة بالبيانات المستخرجة
          const processedImage = updateImageWithExtractedData(
            image,
            extractedText || "",
            parsedData || {},
            parsedData.confidence ? parseInt(String(parsedData.confidence)) : 95,
            "gemini"
          );
          
          // تحقق من تحديث الصورة بشكل صحيح
          console.log("الصورة المحدثة بعد الاستخراج:", {
            code: processedImage.code,
            senderName: processedImage.senderName,
            phoneNumber: processedImage.phoneNumber,
            province: processedImage.province,
            price: processedImage.price,
            companyName: processedImage.companyName
          });
          
          // تعيين الحالة استنادًا إلى وجود البيانات الرئيسية
          let finalImage: ImageData = processedImage;
          
          if (finalImage.code || finalImage.senderName || finalImage.phoneNumber) {
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
            toast({
              title: "تم استخراج النص",
              description: "تم استخراج النص ولكن لم يتم التعرف على البيانات المنظمة",
              variant: "default"
            });
            
            return {
              ...image,
              status: "pending" as const,
              extractedText: extractedText
            };
          } else {
            toast({
              title: "تنبيه",
              description: "لم يتمكن Gemini من استخراج بيانات من الصورة، يرجى محاولة تحميل صورة أوضح",
              variant: "default"
            });
            
            return {
              ...image,
              status: "pending" as const,
              extractedText: "لم يتم استخراج نص. حاول مرة أخرى بصورة أوضح."
            };
          }
        }
      } else {
        console.log("فشل استخراج Gemini:", extractionResult.message);
        
        // التحقق من وجود خطأ في تجاوز الحصة
        if (extractionResult.message && 
            (extractionResult.message.includes("quota") || 
             extractionResult.message.includes("429") || 
             extractionResult.message.includes("rate limit"))) {
          
          // حفظ حالة تجاوز الحصة
          setQuotaExceeded(true);
          localStorage.setItem("geminiQuotaExceeded", "true");
          
          // تبديل النموذج إلى نموذج أقل كلفة
          const nextModel = 'gemini-1.5-flash';
          setCurrentModel(nextModel);
          
          console.log("تم اكتشاف تجاوز للحصة، محاولة استخدام نموذج بديل:", nextModel);
          
          toast({
            title: "تم تجاوز حصة Gemini API",
            description: "سنحاول استخدام نموذج بديل. يرجى إعادة المحاولة.",
            variant: "warning"
          });
          
          // إعادة محاولة مع النموذج البديل
          try {
            // تأخير قصير للتأكد من عدم ضرب API بسرعة كبيرة جدًا
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const retryResult = await extractDataWithGemini({
              apiKey: geminiApiKey,
              imageBase64,
              enhancedExtraction: true,
              maxRetries: 1,
              retryDelayMs: 2000,
              modelVersion: nextModel
            });
            
            if (retryResult.success && retryResult.data) {
              console.log("نجحت إعادة المحاولة مع النموذج البديل:", nextModel);
              toast({
                title: "نجاح المحاولة البديلة",
                description: "تم استخراج البيانات باستخدام نموذج Gemini بديل",
              });
              
              // معالجة النتائج
              const { parsedData, extractedText } = retryResult.data;
              const processedImage = updateImageWithExtractedData(
                image,
                extractedText || "",
                parsedData || {},
                parsedData?.confidence ? parseInt(String(parsedData.confidence)) : 90,
                "gemini"
              );
              
              return {
                ...processedImage,
                status: "completed" as const
              };
            } else {
              throw new Error("فشلت المحاولة مع النموذج البديل: " + retryResult.message);
            }
          } catch (retryError) {
            console.error("فشلت إعادة المحاولة مع النموذج البديل:", retryError);
            
            // الانتقال إلى OCR عند فشل جميع محاولات Gemini
            toast({
              title: "تبديل إلى OCR",
              description: "فشل استخدام Gemini API. سيتم محاولة استخدام OCR البسيط.",
              variant: "default"
            });
            
            return {
              ...image,
              status: "error" as const,
              extractionMethod: "failed_gemini",
              extractedText: "فشل استخراج البيانات باستخدام Gemini. تم تجاوز الحصة اليومية. يرجى محاولة استخدام OCR أو الانتظار."
            };
          }
        }
        
        toast({
          title: "فشل الاستخراج",
          description: "فشل استخراج البيانات: " + extractionResult.message,
          variant: "destructive"
        });
        
        // إعادة الصورة مع حالة خطأ
        return {
          ...image,
          status: "error" as const,
          extractedText: "فشل استخراج النص: " + extractionResult.message
        };
      }
    } catch (geminiError: any) {
      console.error("خطأ في معالجة Gemini:", geminiError);
      
      // تحسين رسالة الخطأ
      let errorMessage = geminiError.message || 'خطأ غير معروف';
      
      // التحقق من وجود خطأ في تجاوز الحصة
      if (errorMessage.includes('429') || 
          errorMessage.includes('quota') || 
          errorMessage.includes('rate limit') || 
          errorMessage.includes('RESOURCE_EXHAUSTED')) {
        
        setQuotaExceeded(true);
        localStorage.setItem("geminiQuotaExceeded", "true");
        
        // تبديل النموذج تلقائيًا
        const nextModel = 'gemini-1.5-flash';
        setCurrentModel(nextModel);
        
        toast({
          title: "تم تجاوز حصة Gemini API",
          description: "سيتم الانتقال إلى نموذج أقل كلفة في المرة القادمة. يرجى إعادة المحاولة.",
          variant: "warning"
        });
        
        errorMessage = 'تم تجاوز الحصة اليومية لـ Gemini API. يرجى المحاولة لاحقًا أو استخدام OCR البسيط بدلاً من ذلك.';
      } else if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك والمحاولة مرة أخرى.';
      } else if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError')) {
        errorMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى تحميل صورة أصغر حجمًا أو المحاولة مرة أخرى لاحقًا.';
      }
      
      toast({
        title: "خطأ",
        description: `فشل في استخراج البيانات: ${errorMessage}`,
        variant: "destructive"
      });
      
      // إعادة الصورة مع حالة خطأ
      return {
        ...image,
        status: "error" as const,
        extractedText: "خطأ في المعالجة: " + errorMessage
      };
    }
  };

  // إعادة تعيين حالة تجاوز الحصة يدويًا
  const resetQuotaExceededStatus = () => {
    setQuotaExceeded(false);
    localStorage.removeItem("geminiQuotaExceeded");
    setCurrentModel('gemini-1.5-pro');
    toast({
      title: "تم إعادة تعيين حالة الحصة",
      description: "سيتم محاولة استخدام النموذج الأساسي مرة أخرى",
    });
  };

  // تغيير نموذج Gemini يدويًا
  const changeGeminiModel = (modelName: string) => {
    if (['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'].includes(modelName)) {
      setCurrentModel(modelName);
      toast({
        title: "تم تغيير النموذج",
        description: `تم تعيين نموذج Gemini إلى ${modelName}`,
      });
      return true;
    }
    return false;
  };

  return { 
    useGemini, 
    processWithGemini, 
    quotaExceeded, 
    currentModel, 
    resetQuotaExceededStatus, 
    changeGeminiModel 
  };
};
