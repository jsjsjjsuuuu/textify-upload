
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { extractDataWithGemini, fileToBase64, testGeminiConnection } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { updateImageWithExtractedData } from "@/utils/imageDataParser";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";

// ثوابت لإدارة الطلبات وتتبع القيود
const MAX_API_RETRIES = 3;        // عدد إعادة المحاولات
const API_RETRY_DELAY_MS = 3000;  // تأخير بين المحاولات (3 ثواني)
const API_RATE_LIMIT = 5;         // أقصى عدد طلبات في الفترة الزمنية
const API_RATE_PERIOD_MS = 60000; // فترة قياس معدل الطلبات (دقيقة واحدة)

// واجهة لمفتاح API مع تتبع استخدامه
interface ApiKeyState {
  key: string;
  callCount: number;
  timestamps: number[];
  isValid: boolean;
  model: string;
  failCount: number;
}

export const useGeminiProcessing = () => {
  const [connectionTested, setConnectionTested] = useState(false);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [apiKeys, setApiKeys] = useState<ApiKeyState[]>([]);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const { toast } = useToast();

  // تهيئة قائمة مفاتيح API
  useEffect(() => {
    // محاولة استرداد قائمة المفاتيح المخزنة
    const storedKeys = localStorage.getItem("geminiApiKeys");
    
    if (storedKeys) {
      try {
        // محاولة تحميل المفاتيح المخزنة
        const parsedKeys: string[] = JSON.parse(storedKeys);
        
        if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
          // تحويل المفاتيح إلى كائنات ApiKeyState
          const initializedKeys = parsedKeys.map(key => ({
            key,
            callCount: 0,
            timestamps: [],
            isValid: true,
            model: 'gemini-1.5-pro', // النموذج الافتراضي
            failCount: 0
          }));
          
          setApiKeys(initializedKeys);
          console.log(`تم تحميل ${initializedKeys.length} مفاتيح Gemini API من التخزين المحلي`);
          
          // اختبار جميع المفاتيح بالتوازي
          initializedKeys.forEach((keyState, index) => {
            testGeminiApiConnection(keyState.key, index);
          });
          
          return;
        }
      } catch (error) {
        console.error("خطأ في تحليل مفاتيح Gemini API المخزنة:", error);
      }
    }
    
    // استخدام المفتاح الافتراضي إذا لم تكن هناك مفاتيح مخزنة
    const defaultApiKey = localStorage.getItem("geminiApiKey") || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8";
    
    // تهيئة مصفوفة المفاتيح بالمفتاح الافتراضي
    const initialKey: ApiKeyState = {
      key: defaultApiKey,
      callCount: 0,
      timestamps: [],
      isValid: true,
      model: 'gemini-1.5-pro',
      failCount: 0
    };
    
    setApiKeys([initialKey]);
    console.log("استخدام مفتاح Gemini API افتراضي:", defaultApiKey.substring(0, 5) + "...");
    
    // اختبار الاتصال بالمفتاح الافتراضي
    testGeminiApiConnection(defaultApiKey, 0);
  }, []);

  // إضافة أو تحديث قائمة المفاتيح
  const updateApiKeys = (newKeys: string[]) => {
    if (!newKeys || newKeys.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى توفير مفتاح API واحد على الأقل",
        variant: "destructive"
      });
      return;
    }
    
    // تحويل المفاتيح الجديدة إلى كائنات ApiKeyState
    const newKeyStates = newKeys.map(key => ({
      key,
      callCount: 0,
      timestamps: [],
      isValid: true,
      model: 'gemini-1.5-pro',
      failCount: 0
    }));
    
    setApiKeys(newKeyStates);
    setCurrentKeyIndex(0);
    
    // حفظ المفاتيح في التخزين المحلي
    localStorage.setItem("geminiApiKeys", JSON.stringify(newKeys));
    
    // اختبار المفاتيح الجديدة
    newKeyStates.forEach((keyState, index) => {
      testGeminiApiConnection(keyState.key, index);
    });
    
    toast({
      title: "تم التحديث",
      description: `تم تحديث ${newKeyStates.length} مفاتيح Gemini API بنجاح`,
    });
  };

  // إعادة تعيين عداد الطلبات بشكل دوري
  useEffect(() => {
    const now = Date.now();
    
    // إزالة الطوابع الزمنية القديمة لجميع المفاتيح
    const cleanupTimestamps = () => {
      setApiKeys(prevKeys => 
        prevKeys.map(keyState => {
          const currentTime = Date.now();
          return {
            ...keyState,
            timestamps: keyState.timestamps.filter(timestamp => 
              currentTime - timestamp < API_RATE_PERIOD_MS
            )
          };
        })
      );
    };
    
    // تنظيف الطوابع الزمنية كل 10 ثوانٍ
    const intervalId = setInterval(cleanupTimestamps, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  // اختبار اتصال Gemini API
  const testGeminiApiConnection = async (apiKey: string, keyIndex: number) => {
    try {
      console.log(`اختبار اتصال Gemini API للمفتاح #${keyIndex + 1}...`);
      const result = await testGeminiConnection(apiKey);
      
      setApiKeys(prevKeys => {
        const updatedKeys = [...prevKeys];
        if (updatedKeys[keyIndex]) {
          updatedKeys[keyIndex] = {
            ...updatedKeys[keyIndex],
            isValid: result.success,
            failCount: result.success ? 0 : (updatedKeys[keyIndex].failCount + 1)
          };
        }
        return updatedKeys;
      });
      
      if (result.success) {
        console.log(`اتصال Gemini API ناجح للمفتاح #${keyIndex + 1}`);
        setConnectionTested(true);
      } else {
        console.warn(`فشل اختبار اتصال Gemini API للمفتاح #${keyIndex + 1}:`, result.message);
        toast({
          title: "تحذير",
          description: `فشل اختبار اتصال Gemini API للمفتاح #${keyIndex + 1}: ${result.message}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error(`خطأ في اختبار اتصال Gemini API للمفتاح #${keyIndex + 1}:`, error);
      setApiKeys(prevKeys => {
        const updatedKeys = [...prevKeys];
        if (updatedKeys[keyIndex]) {
          updatedKeys[keyIndex] = {
            ...updatedKeys[keyIndex],
            isValid: false,
            failCount: updatedKeys[keyIndex].failCount + 1
          };
        }
        return updatedKeys;
      });
    }
  };

  // اختيار المفتاح الأفضل للاستخدام
  const selectBestApiKey = (): { key: string, index: number, model: string } => {
    // إذا لم تكن هناك مفاتيح صالحة، إرجاع المفتاح الحالي
    const validKeys = apiKeys.filter(k => k.isValid);
    if (validKeys.length === 0) {
      return { 
        key: apiKeys[currentKeyIndex]?.key || "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8", 
        index: currentKeyIndex, 
        model: apiKeys[currentKeyIndex]?.model || 'gemini-1.5-pro'
      };
    }
    
    // اختيار المفتاح مع أقل عدد استدعاءات حديثة
    const sortedKeys = [...validKeys].sort((a, b) => 
      a.timestamps.filter(t => Date.now() - t < API_RATE_PERIOD_MS).length - 
      b.timestamps.filter(t => Date.now() - t < API_RATE_PERIOD_MS).length
    );
    
    // اختيار المفتاح الأول (مع أقل عدد استدعاءات)
    const bestKey = sortedKeys[0];
    const bestKeyIndex = apiKeys.findIndex(k => k.key === bestKey.key);
    
    return { 
      key: bestKey.key, 
      index: bestKeyIndex, 
      model: bestKey.model 
    };
  };

  // تسجيل استخدام مفتاح
  const trackApiKeyUsage = (keyIndex: number) => {
    const now = Date.now();
    
    setApiKeys(prevKeys => {
      const updatedKeys = [...prevKeys];
      if (updatedKeys[keyIndex]) {
        updatedKeys[keyIndex] = {
          ...updatedKeys[keyIndex],
          callCount: updatedKeys[keyIndex].callCount + 1,
          timestamps: [...updatedKeys[keyIndex].timestamps, now]
        };
      }
      return updatedKeys;
    });
    
    setApiCallCount(count => count + 1);
  };

  // تحديث حالة صلاحية المفتاح
  const updateApiKeyValidity = (keyIndex: number, isValid: boolean, errorMessage?: string) => {
    setApiKeys(prevKeys => {
      const updatedKeys = [...prevKeys];
      if (updatedKeys[keyIndex]) {
        updatedKeys[keyIndex] = {
          ...updatedKeys[keyIndex],
          isValid,
          failCount: isValid ? 0 : (updatedKeys[keyIndex].failCount + 1)
        };
      }
      return updatedKeys;
    });
    
    if (!isValid && errorMessage) {
      console.warn(`مفتاح API رقم ${keyIndex + 1} غير صالح:`, errorMessage);
      
      // إعلام المستخدم فقط إذا كانت هناك مشكلة مع جميع المفاتيح
      const allKeysFailing = apiKeys.every(k => !k.isValid || k.failCount > 0);
      if (allKeysFailing) {
        toast({
          title: "تحذير",
          description: `جميع مفاتيح API غير صالحة. يرجى التحقق من إعدادات Gemini API.`,
          variant: "destructive"
        });
      }
    }
  };

  // التحقق من وضع معدل الاستخدام لمفتاح محدد
  const checkKeyRateLimit = (keyIndex: number): { allowed: boolean, waitTimeMs: number } => {
    if (keyIndex < 0 || keyIndex >= apiKeys.length) {
      return { allowed: false, waitTimeMs: API_RATE_PERIOD_MS };
    }
    
    const now = Date.now();
    const keyState = apiKeys[keyIndex];
    const recentCalls = keyState.timestamps.filter(timestamp => now - timestamp < API_RATE_PERIOD_MS);
    
    if (recentCalls.length >= API_RATE_LIMIT) {
      // حساب وقت الانتظار المطلوب
      const oldestCall = Math.min(...recentCalls);
      const waitTimeMs = API_RATE_PERIOD_MS - (now - oldestCall) + 100; // 100ms إضافية للأمان
      
      return { allowed: false, waitTimeMs };
    }
    
    return { allowed: true, waitTimeMs: 0 };
  };
  
  // وظيفة مساعدة للتأخير
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processWithGemini = async (file: File, image: ImageData): Promise<ImageData> => {
    // اختيار أفضل مفتاح API للاستخدام
    const { key: selectedApiKey, index: selectedKeyIndex, model: selectedModel } = selectBestApiKey();
    console.log(`استخدام مفتاح Gemini API #${selectedKeyIndex + 1} (${selectedApiKey.substring(0, 5)}...) مع نموذج ${selectedModel}`);
    
    // تحديث مؤشر المفتاح الحالي
    setCurrentKeyIndex(selectedKeyIndex);

    // في بيئة المعاينة، نحاول استخدام Gemini مع تحذير المستخدم
    if (isPreviewEnvironment()) {
      console.log("تشغيل في بيئة معاينة (Lovable). محاولة استخدام Gemini قد تواجه قيود CORS.");
    }

    try {
      // الكشف عن حجم الملف وتقديم تحذير إذا كان كبيرًا جدًا
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) {
        console.warn(`حجم الصورة كبير: ${fileSizeMB.toFixed(1)}MB، قد تستغرق المعالجة وقتًا أطول`);
      }
      
      console.log("تحويل الملف إلى base64");
      const imageBase64 = await fileToBase64(file);
      console.log("تم تحويل الملف إلى base64، بطول:", imageBase64.length);
      
      // تحديث الصورة لتظهر أنها قيد المعالجة
      const updatedImage: ImageData = { 
        ...image, 
        status: "processing" as const,
        extractedText: "جاري معالجة الصورة واستخراج البيانات...",
        usedApiKey: `API Key #${selectedKeyIndex + 1} (${selectedApiKey.substring(0, 5)}...)`
      };
      
      // التحقق من معدل استخدام API للمفتاح الحالي
      for (let attempt = 0; attempt < MAX_API_RETRIES; attempt++) {
        const { allowed, waitTimeMs } = checkKeyRateLimit(selectedKeyIndex);
        
        if (!allowed) {
          console.warn(`تجاوز معدل الاستخدام لـ Gemini API (المفتاح #${selectedKeyIndex + 1}). محاولة اختيار مفتاح آخر...`);
          
          // محاولة العثور على مفتاح آخر متاح
          const availableKeyIndices = apiKeys
            .map((keyState, idx) => ({ keyState, idx }))
            .filter(({ keyState }) => keyState.isValid)
            .filter(({ idx }) => {
              const { allowed } = checkKeyRateLimit(idx);
              return allowed;
            })
            .map(({ idx }) => idx);
          
          if (availableKeyIndices.length > 0) {
            // استخدام مفتاح آخر متاح
            const nextKeyIndex = availableKeyIndices[0];
            const nextApiKey = apiKeys[nextKeyIndex].key;
            const nextModel = apiKeys[nextKeyIndex].model;
            
            console.log(`التحول إلى مفتاح Gemini API #${nextKeyIndex + 1} (${nextApiKey.substring(0, 5)}...) مع نموذج ${nextModel}`);
            setCurrentKeyIndex(nextKeyIndex);
            
            // استدعاء نفس الوظيفة مع المفتاح الجديد
            const updatedImageWithNewKey: ImageData = { 
              ...updatedImage, 
              usedApiKey: `API Key #${nextKeyIndex + 1} (${nextApiKey.substring(0, 5)}...)` 
            };
            
            return processWithGemini(file, updatedImageWithNewKey);
          }
          
          // إذا لم يكن هناك مفتاح آخر متاح، الانتظار
          console.warn(`لا توجد مفاتيح متاحة أخرى. الانتظار ${waitTimeMs}ms قبل المحاولة التالية`);
          
          // تحديث حالة الصورة للإشارة إلى الانتظار
          if (attempt === 0) {
            // نحدث النص فقط في المحاولة الأولى لتجنب التحديثات المتكررة
            const waitTimeSeconds = Math.ceil(waitTimeMs / 1000);
            const updatedImageWithWait: ImageData = {
              ...updatedImage,
              extractedText: `الانتظار ${waitTimeSeconds} ثوانٍ بسبب تجاوز معدل الاستخدام...`
            };
            return updatedImageWithWait;
          }
          
          // الانتظار قبل المحاولة التالية
          await delay(waitTimeMs);
          continue;
        }
        
        // إضافة معلومات تشخيصية أكثر
        console.log("بدء استدعاء extractDataWithGemini");
        console.log("إعدادات الاستخراج:", {
          apiKeyLength: selectedApiKey.length,
          imageBase64Length: imageBase64.length,
          enhancedExtraction: true,
          maxRetries: 2,
          retryDelayMs: 3000,
          model: selectedModel,
          attempt: attempt + 1
        });
        
        // تسجيل استدعاء API
        trackApiKeyUsage(selectedKeyIndex);
        
        try {
          const extractionResult = await extractDataWithGemini({
            apiKey: selectedApiKey,
            imageBase64,
            enhancedExtraction: true,
            maxRetries: 2,  // تقليل عدد المحاولات لتسريع الاستجابة
            retryDelayMs: 3000,  // زيادة مدة الانتظار بين المحاولات
            modelVersion: selectedModel  // استخدام النموذج المحدد
          });
          
          console.log("نتيجة استخراج Gemini:", extractionResult);
          
          if (extractionResult.success && extractionResult.data) {
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
              
              // تحديث صلاحية المفتاح
              updateApiKeyValidity(selectedKeyIndex, true);
              
              // تحديث الصورة بالبيانات المستخرجة
              const processedImage = updateImageWithExtractedData(
                image,
                extractedText || "",
                parsedData || {},
                parsedData.confidence ? parseInt(String(parsedData.confidence)) : 95,
                "gemini"
              );
              
              // تعيين الحالة استنادًا إلى وجود البيانات الرئيسية
              let finalImage: ImageData = {
                ...processedImage,
                usedApiKey: `API Key #${selectedKeyIndex + 1} (${selectedApiKey.substring(0, 5)}...)`
              };
              
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
                return {
                  ...image,
                  status: "pending" as const,
                  extractedText: extractedText,
                  usedApiKey: `API Key #${selectedKeyIndex + 1} (${selectedApiKey.substring(0, 5)}...)`
                };
              } else {
                return {
                  ...image,
                  status: "pending" as const,
                  extractedText: "لم يتم استخراج نص. حاول مرة أخرى بصورة أوضح.",
                  usedApiKey: `API Key #${selectedKeyIndex + 1} (${selectedApiKey.substring(0, 5)}...)`
                };
              }
            }
          } else {
            console.log("فشل استخراج Gemini:", extractionResult.message);
            
            // تحديث صلاحية المفتاح إذا كانت هناك مشكلة
            const isQuotaError = extractionResult.message?.includes('quota') || 
                                extractionResult.message?.includes('rate limit');
            
            if (isQuotaError) {
              updateApiKeyValidity(selectedKeyIndex, false, extractionResult.message);
              
              // محاولة استخدام مفتاح آخر
              if (apiKeys.length > 1) {
                console.log("محاولة استخدام مفتاح آخر بسبب تجاوز الحصة");
                
                // البحث عن مفتاح صالح آخر
                const otherValidKeyIndex = apiKeys.findIndex((k, idx) => 
                  idx !== selectedKeyIndex && k.isValid
                );
                
                if (otherValidKeyIndex >= 0) {
                  const nextApiKey = apiKeys[otherValidKeyIndex].key;
                  console.log(`التحول إلى مفتاح Gemini API #${otherValidKeyIndex + 1} (${nextApiKey.substring(0, 5)}...)`);
                  setCurrentKeyIndex(otherValidKeyIndex);
                  
                  // استدعاء نفس الوظيفة مع المفتاح الجديد
                  const updatedImageWithNewKey: ImageData = { 
                    ...updatedImage, 
                    usedApiKey: `API Key #${otherValidKeyIndex + 1} (${nextApiKey.substring(0, 5)}...)` 
                  };
                  
                  return processWithGemini(file, updatedImageWithNewKey);
                }
              }
            }
            
            if (attempt < MAX_API_RETRIES - 1) {
              console.log(`إعادة المحاولة ${attempt + 2}/${MAX_API_RETRIES} بعد ${API_RETRY_DELAY_MS}ms`);
              await delay(API_RETRY_DELAY_MS);
              continue;
            }
            
            // إعادة الصورة مع حالة خطأ
            return {
              ...image,
              status: "error" as const,
              extractedText: "فشل استخراج النص: " + extractionResult.message,
              usedApiKey: `API Key #${selectedKeyIndex + 1} (${selectedApiKey.substring(0, 5)}...)`
            };
          }
        } catch (apiError: any) {
          console.error(`خطأ في استدعاء Gemini API (المحاولة ${attempt + 1}/${MAX_API_RETRIES}):`, apiError);
          
          // التحقق من نوع الخطأ
          const isRateLimitError = apiError.message?.includes('quota') || 
                                  apiError.message?.includes('rate limit') || 
                                  apiError.message?.includes('too many requests');
          
          if (isRateLimitError) {
            // تحديث صلاحية المفتاح
            updateApiKeyValidity(selectedKeyIndex, false, apiError.message);
            
            // محاولة استخدام مفتاح آخر
            if (apiKeys.length > 1) {
              console.log("محاولة استخدام مفتاح آخر بسبب خطأ معدل الاستخدام");
              
              // البحث عن مفتاح صالح آخر
              const otherValidKeyIndex = apiKeys.findIndex((k, idx) => 
                idx !== selectedKeyIndex && k.isValid
              );
              
              if (otherValidKeyIndex >= 0) {
                const nextApiKey = apiKeys[otherValidKeyIndex].key;
                console.log(`التحول إلى مفتاح Gemini API #${otherValidKeyIndex + 1} (${nextApiKey.substring(0, 5)}...)`);
                setCurrentKeyIndex(otherValidKeyIndex);
                
                // استدعاء نفس الوظيفة مع المفتاح الجديد
                const updatedImageWithNewKey: ImageData = { 
                  ...updatedImage, 
                  usedApiKey: `API Key #${otherValidKeyIndex + 1} (${nextApiKey.substring(0, 5)}...)` 
                };
                
                return processWithGemini(file, updatedImageWithNewKey);
              }
            }
            
            // زيادة فترة الانتظار لأخطاء معدل الاستخدام
            await delay(API_RETRY_DELAY_MS * 2);
          } else {
            await delay(API_RETRY_DELAY_MS);
          }
          
          // استمرار في الحلقة للمحاولة التالية إذا لم نصل إلى الحد الأقصى
          if (attempt < MAX_API_RETRIES - 1) {
            continue;
          }
          
          // أقصى عدد من المحاولات، إرجاع خطأ
          throw apiError;
        }
      }
      
      // إذا وصلنا إلى هنا، فقد استنفدنا جميع المحاولات
      return {
        ...image,
        status: "error" as const,
        extractedText: "فشل استخراج النص بعد استنفاد جميع المحاولات",
        usedApiKey: `API Key #${selectedKeyIndex + 1} (${selectedApiKey.substring(0, 5)}...)`
      };
    } catch (geminiError: any) {
      console.error("خطأ في معالجة Gemini:", geminiError);
      
      // تحسين رسالة الخطأ
      let errorMessage = geminiError.message || 'خطأ غير معروف';
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بخادم Gemini. تأكد من اتصال الإنترنت الخاص بك والمحاولة مرة أخرى.';
      } else if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError')) {
        errorMessage = 'انتهت مهلة الاتصال بخادم Gemini. يرجى تحميل صورة أصغر حجمًا أو المحاولة مرة أخرى لاحقًا.';
      } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        errorMessage = 'تم تجاوز حصة API. يرجى الانتظار بضع دقائق والمحاولة مرة أخرى.';
        
        // تحديث صلاحية المفتاح
        updateApiKeyValidity(selectedKeyIndex, false, errorMessage);
      }
      
      // إعادة الصورة مع حالة خطأ
      return {
        ...image,
        status: "error" as const,
        extractedText: "خطأ في المعالجة: " + errorMessage,
        usedApiKey: `API Key #${selectedKeyIndex + 1} (${selectedApiKey.substring(0, 5)}...)`
      };
    }
  };

  // إضافة واجهة برمجية لتعيين مفاتيح API
  const setGeminiApiKeys = (keys: string[]) => {
    if (!keys || keys.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى توفير مفتاح API واحد على الأقل",
        variant: "destructive"
      });
      return;
    }
    
    // تحديث المفاتيح
    updateApiKeys(keys);
  };
  
  // إضافة واجهة برمجية للحصول على معلومات المفاتيح
  const getApiKeysInfo = () => {
    return apiKeys.map((keyState, index) => ({
      keyId: index,
      keyPreview: keyState.key.substring(0, 5) + '...',
      isValid: keyState.isValid,
      callCount: keyState.callCount,
      recentCalls: keyState.timestamps.filter(t => Date.now() - t < API_RATE_PERIOD_MS).length,
      model: keyState.model,
      failCount: keyState.failCount
    }));
  };
  
  // تعيين نموذج لمفتاح محدد
  const setApiKeyModel = (keyIndex: number, model: string) => {
    if (keyIndex < 0 || keyIndex >= apiKeys.length) {
      return;
    }
    
    setApiKeys(prevKeys => {
      const updatedKeys = [...prevKeys];
      if (updatedKeys[keyIndex]) {
        updatedKeys[keyIndex] = {
          ...updatedKeys[keyIndex],
          model
        };
      }
      return updatedKeys;
    });
    
    console.log(`تم تعيين نموذج مفتاح API #${keyIndex + 1} إلى ${model}`);
  };

  // نقوم بإرجاع useGemini كقيمة ثابتة true لاستخدام Gemini دائمًا
  return { 
    useGemini: true, 
    processWithGemini,
    apiCallCount,
    setGeminiApiKeys,
    getApiKeysInfo,
    setApiKeyModel
  };
};
