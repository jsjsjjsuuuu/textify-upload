import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { extractDataWithGemini, testGeminiConnection, testGeminiModels } from "@/lib/geminiService";
import { fileToBase64 } from "@/lib/gemini";

// واجهة تكوين Gemini
interface GeminiConfig {
  apiKeys: string[];
  defaultModel: string;
  keyModels: Record<number, string>;
  keyUsageCounts: Record<number, number>;
  keyRecentUsage: Record<number, number>;
  keyFailCounts: Record<number, number>;
  lastSuccessfulKeyIndex: number | null;
}

export const useGeminiProcessing = () => {
  const [config, setConfig] = useState<GeminiConfig>({
    apiKeys: [],
    defaultModel: "gemini-1.5-pro", // النموذج الافتراضي
    keyModels: {},
    keyUsageCounts: {},
    keyRecentUsage: {},
    keyFailCounts: {},
    lastSuccessfulKeyIndex: null
  });
  
  const { toast } = useToast();
  
  // استرجاع المفاتيح المخزنة عند التحميل
  useEffect(() => {
    const loadSavedKeys = () => {
      try {
        // محاولة استرداد المفاتيح المتعددة
        const storedApiKeys = localStorage.getItem('geminiApiKeys');
        if (storedApiKeys) {
          const parsedKeys = JSON.parse(storedApiKeys);
          if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
            // استرجاع إحصائيات المفاتيح
            let storedKeyUsage = {};
            let storedKeyRecentUsage = {};
            let storedKeyFailCounts = {};
            let storedKeyModels = {};
            
            try {
              const storedStats = localStorage.getItem('geminiApiKeyStats');
              if (storedStats) {
                const parsedStats = JSON.parse(storedStats);
                storedKeyUsage = parsedStats.usage || {};
                storedKeyRecentUsage = parsedStats.recent || {};
                storedKeyFailCounts = parsedStats.fails || {};
                storedKeyModels = parsedStats.models || {};
              }
            } catch (e) {
              console.warn('فشل في تحميل إحصائيات المفاتيح:', e);
            }
            
            // تهيئة إحصائيات للمفاتيح الجديدة
            const initKeyUsage = {};
            const initKeyRecentUsage = {};
            const initKeyFailCounts = {};
            const initKeyModels = {};
            
            parsedKeys.forEach((_, index) => {
              initKeyUsage[index] = storedKeyUsage[index] || 0;
              initKeyRecentUsage[index] = storedKeyRecentUsage[index] || 0;
              initKeyFailCounts[index] = storedKeyFailCounts[index] || 0;
              initKeyModels[index] = storedKeyModels[index] || "gemini-1.5-pro";
            });
            
            // تحديث التكوين
            setConfig({
              apiKeys: parsedKeys,
              defaultModel: "gemini-1.5-pro",
              keyModels: initKeyModels,
              keyUsageCounts: initKeyUsage,
              keyRecentUsage: initKeyRecentUsage,
              keyFailCounts: initKeyFailCounts,
              lastSuccessfulKeyIndex: null
            });
            
            console.log(`تم تحميل ${parsedKeys.length} مفاتيح API`);
            return;
          }
        }
        
        // الرجوع للمفتاح الفردي إذا لم توجد مفاتيح متعددة
        const singleApiKey = localStorage.getItem('geminiApiKey');
        if (singleApiKey) {
          setConfig({
            apiKeys: [singleApiKey],
            defaultModel: "gemini-1.5-pro",
            keyModels: { 0: "gemini-1.5-pro" },
            keyUsageCounts: { 0: 0 },
            keyRecentUsage: { 0: 0 },
            keyFailCounts: { 0: 0 },
            lastSuccessfulKeyIndex: null
          });
          console.log('تم تحميل مفتاح API واحد');
        } else {
          console.log('لم يتم العثور على مفاتيح API');
        }
      } catch (error) {
        console.error('خطأ في تحميل مفاتيح API:', error);
      }
    };
    
    loadSavedKeys();
    
    // إعادة ضبط عدادات الاستخدام الحديث كل 60 ثانية
    const intervalId = setInterval(() => {
      setConfig(prev => ({
        ...prev,
        keyRecentUsage: Object.fromEntries(
          Object.entries(prev.keyRecentUsage).map(([key]) => [key, 0])
        )
      }));
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // حفظ إحصائيات المفاتيح بعد كل تحديث
  useEffect(() => {
    if (config.apiKeys.length > 0) {
      try {
        const stats = {
          usage: config.keyUsageCounts,
          recent: config.keyRecentUsage,
          fails: config.keyFailCounts,
          models: config.keyModels
        };
        localStorage.setItem('geminiApiKeyStats', JSON.stringify(stats));
      } catch (e) {
        console.warn('فشل في حفظ إحصائيات المفاتيح:', e);
      }
    }
  }, [config.keyUsageCounts, config.keyRecentUsage, config.keyFailCounts, config.keyModels]);
  
  // تحديث مفاتيح API
  const setGeminiApiKeys = (keys: string[]) => {
    // تنقية المفاتيح الفارغة
    const cleanedKeys = keys.filter(key => key.trim() !== '');
    
    if (cleanedKeys.length === 0) {
      console.warn('محاولة تعيين قائمة مفاتيح فارغة!');
      return;
    }
    
    // الاحتفاظ بإحصائيات المفاتيح الموجودة
    const newKeyUsage = {};
    const newKeyRecentUsage = {};
    const newKeyFailCounts = {};
    const newKeyModels = {};
    
    cleanedKeys.forEach((_, index) => {
      // نقل الإحصائيات إذا كان المفتاح موجوداً من قبل
      if (index < config.apiKeys.length) {
        newKeyUsage[index] = config.keyUsageCounts[index] || 0;
        newKeyRecentUsage[index] = config.keyRecentUsage[index] || 0;
        newKeyFailCounts[index] = config.keyFailCounts[index] || 0;
        newKeyModels[index] = config.keyModels[index] || "gemini-1.5-pro";
      } else {
        // تهيئة إحصائيات للمفاتيح الجديدة
        newKeyUsage[index] = 0;
        newKeyRecentUsage[index] = 0;
        newKeyFailCounts[index] = 0;
        newKeyModels[index] = "gemini-1.5-pro";
      }
    });
    
    // تحديث التكوين
    setConfig({
      apiKeys: cleanedKeys,
      defaultModel: config.defaultModel,
      keyModels: newKeyModels,
      keyUsageCounts: newKeyUsage,
      keyRecentUsage: newKeyRecentUsage,
      keyFailCounts: newKeyFailCounts,
      lastSuccessfulKeyIndex: null
    });
    
    // تخزين المفاتيح
    localStorage.setItem('geminiApiKeys', JSON.stringify(cleanedKeys));
    console.log(`تم تحديث مفاتيح API. العدد الجديد: ${cleanedKeys.length}`);
  };
  
  // تعيين نموذج لمفتاح معين
  const setApiKeyModel = (keyIndex: number, model: string) => {
    setConfig(prev => ({
      ...prev,
      keyModels: {
        ...prev.keyModels,
        [keyIndex]: model
      }
    }));
  };
  
  // اختيار أفضل مفتاح للاستخدام
  const selectBestApiKey = (): { key: string, keyIndex: number, model: string } => {
    if (config.apiKeys.length === 0) {
      throw new Error('لا توجد مفاتيح API متاحة');
    }
    
    // إذا كان هناك مفتاح ناجح سابق، نحاول استخدامه مرة أخرى
    if (config.lastSuccessfulKeyIndex !== null && 
        config.keyRecentUsage[config.lastSuccessfulKeyIndex] < 5 &&
        config.keyFailCounts[config.lastSuccessfulKeyIndex] < 3) {
      const keyIndex = config.lastSuccessfulKeyIndex;
      return { 
        key: config.apiKeys[keyIndex], 
        keyIndex, 
        model: config.keyModels[keyIndex] || config.defaultModel 
      };
    }
    
    // اختيار مفتاح مع أقل استخدام حديث وأقل إخفاقات
    let bestKeyIndex = 0;
    let lowestCombinedScore = Infinity;
    
    for (let i = 0; i < config.apiKeys.length; i++) {
      // تجاهل المفاتيح التي تجاوزت عتبة الإخفاق
      if (config.keyFailCounts[i] >= 5) {
        continue;
      }
      
      // حساب مجموع الاستخدام الحديث وعدد الإخفاقات
      const recentUsage = config.keyRecentUsage[i] || 0;
      const failCount = config.keyFailCounts[i] || 0;
      const combinedScore = (recentUsage * 2) + (failCount * 5);
      
      if (combinedScore < lowestCombinedScore) {
        lowestCombinedScore = combinedScore;
        bestKeyIndex = i;
      }
    }
    
    // إذا كانت جميع المفاتيح تجاوزت عتبة الإخفاق، نختار عشوائياً
    if (lowestCombinedScore === Infinity) {
      bestKeyIndex = Math.floor(Math.random() * config.apiKeys.length);
      console.warn('جميع المفاتيح لديها إخفاقات عالية، اختيار مفتاح عشوائي:', bestKeyIndex);
    }
    
    return { 
      key: config.apiKeys[bestKeyIndex], 
      keyIndex: bestKeyIndex, 
      model: config.keyModels[bestKeyIndex] || config.defaultModel 
    };
  };
  
  // تسجيل نجاح استخدام مفتاح
  const recordKeySuccess = (keyIndex: number) => {
    setConfig(prev => ({
      ...prev,
      keyUsageCounts: {
        ...prev.keyUsageCounts,
        [keyIndex]: (prev.keyUsageCounts[keyIndex] || 0) + 1
      },
      keyRecentUsage: {
        ...prev.keyRecentUsage,
        [keyIndex]: (prev.keyRecentUsage[keyIndex] || 0) + 1
      },
      lastSuccessfulKeyIndex: keyIndex
    }));
  };
  
  // تسجيل فشل استخدام مفتاح
  const recordKeyFailure = (keyIndex: number) => {
    setConfig(prev => ({
      ...prev,
      keyFailCounts: {
        ...prev.keyFailCounts,
        [keyIndex]: (prev.keyFailCounts[keyIndex] || 0) + 1
      }
    }));
  };
  
  // الحصول على معلومات المفاتيح للعرض في واجهة المستخدم
  const getApiKeysInfo = () => {
    return config.apiKeys.map((apiKey, index) => {
      // تحديد صلاحية المفتاح بناءً على عدد الإخفاقات
      const isValid = (config.keyFailCounts[index] || 0) < 3;
      
      return {
        keyId: index,
        keyPreview: apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 3),
        isValid,
        callCount: config.keyUsageCounts[index] || 0,
        recentCalls: config.keyRecentUsage[index] || 0,
        model: config.keyModels[index] || config.defaultModel,
        failCount: config.keyFailCounts[index] || 0
      };
    });
  };
  
  // معالجة الصورة باستخدام Gemini API
  const processWithGemini = async (
    file: File, 
    imageData: ImageData
  ): Promise<Partial<ImageData>> => {
    if (!file || !imageData) {
      throw new Error('ملف الصورة أو بيانات الصورة مفقودة');
    }
    
    // اختيار أفضل مفتاح API
    let { key: apiKey, keyIndex, model } = selectBestApiKey();
    
    try {
      console.log(`استخدام المفتاح [${keyIndex}] مع النموذج [${model}] لمعالجة الصورة ${file.name}`);
      
      // تحويل الصورة إلى Base64
      const imageBase64 = await fileToBase64(file);
      if (!imageBase64) {
        throw new Error('فشل في تحويل الصورة إلى تنسيق Base64');
      }
      
      // استخدام Gemini API لاستخراج البيانات
      const result = await extractDataWithGemini({
        apiKey,
        imageBase64,
        modelVersion: model,
        enhancedExtraction: true
      });
      
      if (!result.success) {
        throw new Error(`فشل في استخراج البيانات: ${result.message}`);
      }
      
      if (!result.data) {
        throw new Error('لم يتم العثور على بيانات مستخرجة');
      }
      
      // تسجيل نجاح استخدام المفتاح
      recordKeySuccess(keyIndex);
      
      // إرجاع البيانات المستخرجة
      return {
        code: result.data.code,
        senderName: result.data.senderName,
        phoneNumber: result.data.phoneNumber,
        province: result.data.province,
        price: result.data.price,
        companyName: result.data.companyName,
        extractedText: result.data.extractedText,
        status: "completed",
        confidence: result.data.confidence || 0,
        extractionMethod: "gemini",
        usedApiKey: apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 3) // تخزين معلومات عن المفتاح المستخدم
      };
    } catch (error) {
      console.error(`خطأ في معالجة الصورة باستخدام Gemini [المفتاح ${keyIndex}]:`, error);
      
      // تسجيل فشل استخدام المفتاح
      recordKeyFailure(keyIndex);
      
      // التحقق مما إذا كان الخطأ يتعلق بقيود معدل الاستخدام أو حصة API
      const errorMessage = error.message || '';
      const isRateLimitError = 
        errorMessage.includes('quota') || 
        errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests');
      
      // إذا كان الخطأ يتعلق بقيود معدل الاستخدام وهناك مفاتيح أخرى، حاول استخدام مفتاح آخر
      if (isRateLimitError && config.apiKeys.length > 1) {
        console.log(`تم تجاوز حدود معدل الاستخدام للمفتاح ${keyIndex}، محاولة مفتاح آخر...`);
        
        // استبعاد المفتاح الحالي
        const availableKeyIndices = Array.from(
          { length: config.apiKeys.length }, 
          (_, i) => i
        ).filter(i => 
          i !== keyIndex && 
          (config.keyFailCounts[i] || 0) < 3 && 
          (config.keyRecentUsage[i] || 0) < 5
        );
        
        if (availableKeyIndices.length > 0) {
          // اختيار مفتاح جديد عشوائياً من المفاتيح المتاحة
          const newKeyIndex = availableKeyIndices[Math.floor(Math.random() * availableKeyIndices.length)];
          const newApiKey = config.apiKeys[newKeyIndex];
          const newModel = config.keyModels[newKeyIndex] || config.defaultModel;
          
          console.log(`محاولة المفتاح البديل [${newKeyIndex}] مع النموذج [${newModel}]`);
          
          try {
            // تحويل الصورة إلى Base64 مرة أخرى
            const imageBase64 = await fileToBase64(file);
            if (!imageBase64) {
              throw new Error('فشل في تحويل الصورة إلى تنسيق Base64');
            }
            
            // استخدام المفتاح الجديد
            const result = await extractDataWithGemini({
              apiKey: newApiKey,
              imageBase64,
              modelVersion: newModel,
              enhancedExtraction: true
            });
            
            if (!result.success) {
              throw new Error(`فشل في استخراج البيانات باستخدام المفتاح البديل: ${result.message}`);
            }
            
            if (!result.data) {
              throw new Error('لم يتم العثور على بيانات مستخرجة باستخدام المفتاح البديل');
            }
            
            // تسجيل نجاح استخدام المفتاح البديل
            recordKeySuccess(newKeyIndex);
            
            // إرجاع البيانات المستخرجة
            return {
              code: result.data.code,
              senderName: result.data.senderName,
              phoneNumber: result.data.phoneNumber,
              province: result.data.province,
              price: result.data.price,
              companyName: result.data.companyName,
              extractedText: result.data.extractedText,
              status: "completed",
              confidence: result.data.confidence || 0,
              extractionMethod: "gemini",
              usedApiKey: newApiKey.substring(0, 5) + '...' + newApiKey.substring(newApiKey.length - 3)
            };
          } catch (fallbackError) {
            console.error(`فشل المفتاح البديل [${newKeyIndex}] أيضاً:`, fallbackError);
            recordKeyFailure(newKeyIndex);
          }
        }
      }
      
      // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
      return {
        extractedText: `فشل في استخراج البيانات: ${errorMessage}`,
        status: "error"
      };
    }
  };
  
  // اختبار اتصال Gemini
  const testGeminiConnection = async (apiKey: string, model: string = "gemini-1.5-pro"): Promise<boolean> => {
    try {
      // تعديل هنا: نقوم بالوصول إلى خاصية success من النتيجة
      const result = await testGeminiConnection(apiKey, model);
      return result.success; // استخدام خاصية success من النتيجة
    } catch (error) {
      console.error('خطأ في اختبار اتصال Gemini:', error);
      return false;
    }
  };
  
  // اختبار نماذج Gemini المختلفة
  const testModelAvailability = async (apiKey: string): Promise<Record<string, boolean>> => {
    try {
      const result = await testGeminiModels(apiKey, "test", ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"]);
      
      // تحويل النتائج إلى الصيغة المطلوبة Record<string, boolean>
      const modelAvailability: Record<string, boolean> = {};
      result.results.forEach(modelResult => {
        modelAvailability[modelResult.model] = modelResult.success;
      });
      
      return modelAvailability;
    } catch (error) {
      console.error('خطأ في اختبار نماذج Gemini:', error);
      return {
        'gemini-1.5-pro': false,
        'gemini-1.5-flash': false,
        'gemini-pro': false
      };
    }
  };
  
  // إعادة تعيين إحصائيات المفاتيح
  const resetKeyStats = () => {
    setConfig(prev => ({
      ...prev,
      keyUsageCounts: Object.fromEntries(
        Object.keys(prev.keyUsageCounts).map(key => [key, 0])
      ),
      keyRecentUsage: Object.fromEntries(
        Object.keys(prev.keyRecentUsage).map(key => [key, 0])
      ),
      keyFailCounts: Object.fromEntries(
        Object.keys(prev.keyFailCounts).map(key => [key, 0])
      ),
      lastSuccessfulKeyIndex: null
    }));
  };
  
  return {
    apiKeys: config.apiKeys,
    setGeminiApiKeys,
    processWithGemini,
    testGeminiConnection,
    testModelAvailability,
    getApiKeysInfo,
    setApiKeyModel,
    resetKeyStats
  };
};
