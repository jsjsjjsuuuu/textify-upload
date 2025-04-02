import { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { 
  extractDataWithGemini, 
  fileToBase64, 
  testGeminiConnection,
  getNextApiKey,
  reportApiKeyError,
  getApiKeyStats,
  resetAllApiKeys
} from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";

// المفتاح الثابت الذي تم توفيره من المستخدم
const FIXED_API_KEY = "AIzaSyBKczW8k6fNBXnjD5y7P2vLC5nYgJM7I4o";

export const useGeminiProcessing = () => {
  const [useGemini, setUseGemini] = useState(true);
  const [connectionTested, setConnectionTested] = useState(false);
  const { toast } = useToast();
  
  // الحفاظ على سجل محاولات المعالجة لتجنب التكرار
  const [processingAttempts, setProcessingAttempts] = useState<Record<string, number>>({});
  
  // مؤشر لتتبع استخدام الطلبات المتعددة
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // قائمة المطالبات المختلفة للتجربة - تمت إضافة مطالبات جديدة محسنة
  const prompts = [
    "enhancedExtraction",
    "codeFocusedPrompt", // مطالبة جديدة تركز على الكود
    "handwritingExtraction",
    "hybridExtractionPrompt", // مطالبة هجينة جديدة
    "structuredExtraction",
    "stepByStepPrompt",
    "advancedHandwriting"
  ];
  
  // وظيفة للحصول على المطالبة التالية
  const getNextPrompt = useCallback(() => {
    const nextIndex = (currentPromptIndex + 1) % prompts.length;
    setCurrentPromptIndex(nextIndex);
    return prompts[nextIndex];
  }, [currentPromptIndex, prompts]);

  useEffect(() => {
    // فحص الاتصال باستخدام المفتاح الثابت
    const testConnection = async () => {
      if (!connectionTested) {
        console.log("اختبار اتصال Gemini API باستخدام المفتاح الثابت...");
        await testGeminiApiConnection(FIXED_API_KEY);
      }
    };
    
    testConnection();
  }, [connectionTested]);

  // اختبار اتصال Gemini API باستخدام المفتاح الثابت
  const testGeminiApiConnection = async (apiKey: string): Promise<boolean> => {
    try {
      console.log("اختبار اتصال Gemini API...");
      const result = await testGeminiConnection(apiKey);
      if (result.success) {
        console.log("اتصال Gemini API ناجح");
        setConnectionTested(true);
        setUseGemini(true);
        toast({
          title: "اتصال ناجح",
          description: "تم الاتصال بـ Gemini AI بنجاح",
        });
        return true;
      } else {
        console.warn("فشل اختبار اتصال Gemini API:", result.message);
        
        // محاولة مرة أخرى بعد تأخير قصير
        console.log("محاولة إعادة اتصال...");
        setTimeout(async () => {
          const newResult = await testGeminiConnection(apiKey);
          if (newResult.success) {
            console.log("نجح الاتصال في المحاولة الثانية!");
            setConnectionTested(true);
            setUseGemini(true);
            return true;
          } else {
            toast({
              title: "تحذير",
              description: `فشل الاتصال بـ Gemini AI: ${result.message}`,
              variant: "destructive"
            });
            setUseGemini(false);
            return false;
          }
        }, 2000);
      }
    } catch (error) {
      console.error("خطأ في اختبار اتصال Gemini API:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الاتصال بخدمة Gemini AI، جاري استخدام المعالجة الداخلية",
        variant: "destructive"
      });
      setUseGemini(false);
      return false;
    }
    return false;
  };

  // وظيفة للتأخير المضمون بين طلبات API
  const sleepBetweenRequests = async (milliseconds: number) => {
    console.log(`تأخير ${milliseconds}ms بين طلبات API...`);
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
  };

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    // التحقق من عدد المحاولات
    const attemptKey = image.id;
    const attempts = processingAttempts[attemptKey] || 0;
    
    // إذا كان هناك أكثر من 3 محاولات للمعالجة، نصل بها إلى حالة خطأ
    if (attempts >= 3) {
      console.log(`وصلت صورة ${image.id} إلى الحد الأقصى من المحاولات (${attempts})`);
      toast({
        title: "فشل في المعالجة",
        description: "وصلت الصورة إلى الحد الأقصى من محاولات المعالجة، يرجى تحميل صورة أخرى أو إعادة المعالجة يدوياً",
        variant: "destructive"
      });
      
      return {
        ...image,
        status: "error" as const,
        extractedText: "فشل في معالجة الصورة بعد عدة محاولات. يمكنك محاولة إعادة المعالجة."
      };
    }
    
    // زيادة عدد المحاولات
    setProcessingAttempts(prev => ({
      ...prev,
      [attemptKey]: attempts + 1
    }));
    
    // استخدام المفتاح الثابت
    const geminiApiKey = FIXED_API_KEY;
    console.log("استخدام مفتاح Gemini API الثابت...");

    // تحديث الصورة لتظهر أنها قيد المعالجة
    const processingImage: ImageData = { 
      ...image, 
      status: "processing" as const,
      extractedText: `جاري معالجة الصورة واستخراج البيانات... (محاولة ${attempts + 1}/3)`
    };

    try {
      // الكشف عن حجم الملف وتقديم تحذير إذا كان كبيرًا جدًا
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) {
        console.log(`حجم الصورة كبير (${fileSizeMB.toFixed(1)}MB)، قد تستغرق المعالجة وقتًا أطول`);
      }
      
      console.log("تحويل الملف إلى base64");
      const imageBase64 = await fileToBase64(file);
      console.log("تم تحويل الملف إلى base64، بطول:", imageBase64.length);
      
      // تأخير قبل الاستخراج
      await sleepBetweenRequests(1000);
      
      // تحديد المطالبة والنموذج بناءً على عدد المحاولات
      let promptType = "enhancedExtraction";
      let modelVersion = 'gemini-1.5-flash';
      let temperature = 0.2;
      
      // تغيير الاستراتيجية حسب عدد المحاولات
      if (attempts === 1) {
        promptType = "codeFocusedPrompt"; // استخدام المطالبة الجديدة التي تركز على الكود
        modelVersion = 'gemini-1.5-flash';
        temperature = 0.1;
      } else if (attempts === 2) {
        promptType = "hybridExtractionPrompt"; // استخدام المطالبة الهجينة الجديدة
        modelVersion = 'gemini-1.5-pro';
        temperature = 0.0;
      } else if (attempts >= 3) {
        // استخدام المطالبة التالية في القائمة
        promptType = getNextPrompt();
        modelVersion = 'gemini-1.5-pro';
        temperature = 0.0;
      }
      
      console.log(`محاولة استخراج رقم ${attempts + 1} باستخدام:`, {
        promptType,
        modelVersion,
        temperature
      });
      
      // إضافة معلومات تشخيصية
      console.log("بدء استدعاء extractDataWithGemini");
      
      // محاولة استخراج البيانات
      let extractionResult = await extractDataWithGemini({
        apiKey: geminiApiKey,
        imageBase64,
        extractionPromptType: promptType,
        maxRetries: 1,
        retryDelayMs: 1500,
        modelVersion: modelVersion,
        temperature: temperature
      });
      
      console.log("نتيجة استخراج Gemini:", extractionResult);
      
      // التحقق من نجاح الاستخراج وجودة البيانات
      if (extractionResult.success && extractionResult.data) {
        const { parsedData, extractedText, confidence } = extractionResult.data;
        
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
            parsedData.confidence ? parseInt(String(parsedData.confidence)) : confidence || 85,
            "gemini"
          );
          
          // تعيين الحالة استنادًا إلى وجود البيانات الرئيسية
          let finalImage: ImageData = processedImage;
          
          // تحقق إذا تم استخراج جميع البيانات الرئيسية
          const hasAllRequiredData = 
            finalImage.code && 
            finalImage.senderName && 
            finalImage.phoneNumber && 
            finalImage.price;
          
          if (finalImage.code || finalImage.senderName || finalImage.phoneNumber) {
            finalImage = {
              ...finalImage,
              status: "completed" as const,
              extractionSuccess: hasAllRequiredData
            };
          } else {
            finalImage = {
              ...finalImage,
              status: "pending" as const
            };
          }
          
          // إعادة تعيين عدد المحاولات لهذه الصورة عند النجاح
          setProcessingAttempts(prev => {
            const newAttempts = { ...prev };
            delete newAttempts[attemptKey];
            return newAttempts;
          });
          
          return finalImage;
        } else {
          console.log("Gemini أرجع بيانات فارغة، جاري محاولة مطالبة أخرى");
          
          // إذا كان هناك نص مستخرج ولكن لا يوجد بيانات منظمة
          if (extractedText && extractedText.length > 10) {
            toast({
              title: "تم استخراج النص",
              description: "تم استخراج النص ولكن لم يتم التعرف على البيانات المنظمة بشكل كامل، جاري إعادة المحاولة",
              variant: "default"
            });
            
            // تأخير قبل المحاولة التالية
            await sleepBetweenRequests(1000);
            
            // إرجاع الصورة بالنص المستخرج ولكن حالتها لا تزال "قيد الانتظار"
            return {
              ...image,
              status: "pending" as const,
              extractedText: extractedText
            };
          } else {
            toast({
              title: "محاولة أخرى",
              description: "لم يتمكن Gemini من استخراج بيانات من الصورة، جاري محاولة أخرى بطريقة مختلفة",
              variant: "default"
            });
            
            // تأخير قبل المحاولة التالية
            await sleepBetweenRequests(1000);
            
            // إرجاع الصورة بحالة "قيد الانتظار" للمحاولة التالية
            return {
              ...image,
              status: attempts >= 2 ? "error" as const : "pending" as const,
              extractedText: attempts >= 2 
                ? "فشل في استخراج البيانات بعد عدة محاولات. يمكنك محاولة إعادة المعالجة." 
                : "جاري محاولة استخراج البيانات بطريقة أخرى..."
            };
          }
        }
      } else {
        console.log("فشل استخراج Gemini، جاري محاولة نموذج آخر:", extractionResult.message);
        
        // تأخير قبل المحاولة التالية
        await sleepBetweenRequests(1500);
        
        // إرجاع الصورة بحالة "قيد الانتظار" أو "خطأ" بناءً على عدد المحاولات
        return {
          ...image,
          status: attempts >= 2 ? "error" as const : "pending" as const,
          extractedText: attempts >= 2 
            ? `فشل في استخراج البيانات بعد ${attempts + 1} محاولات. يمكنك محاولة إعادة المعالجة.` 
            : `فشل في استخراج البيانات: ${extractionResult.message}. جاري إعادة المحاولة...`
        };
      }
    } catch (geminiError: any) {
      console.error("خطأ في معالجة Gemini:", geminiError);
      
      // تأخير قبل المحاولة التالية
      await sleepBetweenRequests(2000);
      
      // إرجاع الصورة بحالة "قيد الانتظار" أو "خطأ" بناءً على عدد المحاولات
      return {
        ...image,
        status: attempts >= 2 ? "error" as const : "pending" as const,
        extractedText: attempts >= 2 
          ? `حدث خطأ أثناء المعالجة. يمكنك محاولة إعادة المعالجة يدوياً.` 
          : `حدث خطأ أثناء المعالجة: ${geminiError.message || "خطأ غير معروف"}. جاري إعادة المحاولة...`
      };
    }
  };

  // وظيفة إعادة تعيين جميع مفاتيح API
  const resetApiKeys = useCallback(() => {
    resetAllApiKeys();
    setProcessingAttempts({}); // إعادة تعيين سجل المحاولات أيضًا
    toast({
      title: "تم إعادة تعيين المفاتيح",
      description: "تم إعادة تعيين جميع مفاتيح API",
    });
  }, [toast]);

  // وظيفة إعادة محاولة معالجة صورة معينة - تحسين آلية إعادة المحاولة
  const retryProcessing = useCallback(async (file: File, image: ImageData): Promise<ImageData> => {
    // إعادة تعيين عدد المحاولات لهذه الصورة للسماح بمحاولات جديدة
    const attemptKey = image.id;
    setProcessingAttempts(prev => ({
      ...prev,
      [attemptKey]: 0
    }));
    
    // تغيير حالة الصورة إلى "قيد المعالجة" فوراً لتوفير ردود فعل فورية
    const processingImage: ImageData = { 
      ...image, 
      status: "processing" as const,
      extractedText: "جاري إعادة معالجة الصورة واستخراج البيانات..."
    };
    
    // إظهار إشعار البدء
    toast({
      title: "إعادة المعالجة",
      description: "تم بدء إعادة معالجة الصورة باستخدام نماذج محسنة",
      variant: "default"
    });
    
    console.log("إعادة محاولة معالجة الصورة:", image.id);
    
    // استخدام استراتيجية مختلفة في إعادة المعالجة - نستخدم نموذج أقوى مباشرة
    try {
      console.log("تحويل الملف إلى base64 لإعادة المعالجة");
      const imageBase64 = await fileToBase64(file);
      
      // استخدام استراتيجية مختلفة في إعادة المعالجة - نموذج أقوى ومطالبة مختلفة
      const extractionResult = await extractDataWithGemini({
        apiKey: FIXED_API_KEY,
        imageBase64,
        extractionPromptType: "stepByStepPrompt", // استخدام مطالبة محسنة خاصة بإعادة المعالجة
        maxRetries: 1,
        retryDelayMs: 1000,
        modelVersion: 'gemini-1.5-pro', // استخدام النموذج الأقوى مباشرة
        temperature: 0.0 // استخدام درجة حرارة 0 للحصول على نتائج أكثر دقة
      });
      
      console.log("نتيجة إعادة المعالجة:", extractionResult);
      
      if (extractionResult.success && extractionResult.data) {
        const { parsedData, extractedText, confidence } = extractionResult.data;
        
        if (parsedData && Object.keys(parsedData).length > 0) {
          toast({
            title: "تم الاستخراج بنجاح",
            description: "تم استخراج البيانات بنجاح من خلال إعادة المعالجة",
            variant: "success"
          });
          
          // تحديث الصورة بالبيانات المستخرجة
          const processedImage = updateImageWithExtractedData(
            image,
            extractedText || "",
            parsedData || {},
            confidence || 90,
            "gemini"
          );
          
          // تحقق إذا تم استخراج جميع البيانات الرئيسية
          const hasAllRequiredData = 
            processedImage.code && 
            processedImage.senderName && 
            processedImage.phoneNumber && 
            processedImage.price;
          
          return {
            ...processedImage,
            status: "completed" as const,
            extractionSuccess: hasAllRequiredData
          };
        } else {
          // في حالة فشل استخراج البيانات
          toast({
            title: "تنبيه",
            description: "تم استخراج النص ولكن فشل استخراج البيانات المنظمة. يرجى تعديل البيانات يدوياً.",
            variant: "warning"
          });
          
          return {
            ...image,
            status: "completed" as const,
            extractedText: extractedText || image.extractedText || "",
            extractionSuccess: false
          };
        }
      } else {
        // في حالة فشل إعادة المعالجة
        toast({
          title: "فشل إعادة المعالجة",
          description: extractionResult.message || "فشل إعادة معالجة الصورة. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
        
        return {
          ...image,
          status: "error" as const,
          extractedText: `فشل إعادة المعالجة: ${extractionResult.message || "خطأ غير معروف"}`,
          extractionSuccess: false
        };
      }
    } catch (error: any) {
      console.error("خطأ في إعادة معالجة الصورة:", error);
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة معالجة الصورة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      
      return {
        ...image,
        status: "error" as const,
        extractedText: `خطأ في إعادة المعالجة: ${error.message || "خطأ غير معروف"}`,
        extractionSuccess: false
      };
    }
  }, [toast]);

  return { 
    useGemini, 
    processWithGemini,
    resetApiKeys,
    getApiStats: getApiKeyStats,
    retryProcessing,
    connectionTested,
    testGeminiApiConnection
  };
};
