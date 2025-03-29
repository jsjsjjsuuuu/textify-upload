import { useState, useEffect, useCallback } from 'react';
import { ImageData } from '@/types/ImageData';
import { extractDataWithGemini, testGeminiConnection } from '@/lib/geminiService';
import { useToast } from './use-toast';

// واجهة معلومات مفتاح API
interface ApiKeyInfo {
  keyId: number;
  keyPreview: string;
  isValid: boolean;
  callCount: number;
  recentCalls: number;
  model: string;
  failCount: number;
}

export const useGeminiProcessing = () => {
  const [useGemini, setUseGemini] = useState<boolean>(true);
  const [apiCallCount, setApiCallCount] = useState<number>(0);
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [apiKeysUsageStats, setApiKeysUsageStats] = useState<Record<number, { calls: number, recentCalls: number, fails: number, valid: boolean }>>({}); 
  const [apiKeysModels, setApiKeysModels] = useState<Record<number, string>>({});
  const { toast } = useToast();

  // تحميل المفاتيح عند التهيئة
  useEffect(() => {
    try {
      // إضافة المفتاح الجديد بشكل افتراضي إذا لم تكن هناك مفاتيح محفوظة
      const newApiKey = 'AIzaSyBx3qfrd7NDlQ3VLg06fEO3JRNTuO23myE';
      
      // محاولة تحميل مفاتيح متعددة
      const storedKeys = localStorage.getItem('geminiApiKeys');
      if (storedKeys) {
        const parsedKeys = JSON.parse(storedKeys);
        if (Array.isArray(parsedKeys)) {
          // التحقق مما إذا كان المفتاح الجديد موجودًا بالفعل
          if (!parsedKeys.includes(newApiKey)) {
            // إضافة المفتاح الجديد إلى المفاتيح المخزنة
            const updatedKeys = [...parsedKeys, newApiKey];
            localStorage.setItem('geminiApiKeys', JSON.stringify(updatedKeys));
            setApiKeys(updatedKeys);
          } else {
            setApiKeys(parsedKeys);
          }
        }
      } else {
        // إذا لم تكن هناك مفاتيح متعددة، استخدام المفتاح الفردي
        const singleKey = localStorage.getItem('geminiApiKey');
        if (singleKey) {
          // إذا كان المفتاح القديم موجودًا، أضف كلاً من القديم والجديد
          setApiKeys([singleKey, newApiKey]);
          localStorage.setItem('geminiApiKeys', JSON.stringify([singleKey, newApiKey]));
        } else {
          // إذا لم يكن هناك مفتاح، استخدم المفتاح الجديد فقط
          setApiKeys([newApiKey]);
          localStorage.setItem('geminiApiKeys', JSON.stringify([newApiKey]));
        }
      }
      
      // تحميل نماذج المفاتيح
      const storedModels = localStorage.getItem('geminiApiKeysModels');
      if (storedModels) {
        try {
          setApiKeysModels(JSON.parse(storedModels));
        } catch (e) {
          console.error('خطأ في تحميل نماذج المفاتيح:', e);
        }
      }
      
      // تحميل إحصائيات استخدام المفاتيح
      const storedStats = localStorage.getItem('geminiApiKeysStats');
      if (storedStats) {
        try {
          setApiKeysUsageStats(JSON.parse(storedStats));
        } catch (e) {
          console.error('خطأ في تحميل إحصائيات المفاتيح:', e);
        }
      }
    } catch (error) {
      console.error('خطأ في تهيئة مفاتيح Gemini API:', error);
    }
  }, []);

  // إعادة تعيين إحصائيات المفاتيح
  const resetKeyStats = useCallback(() => {
    setApiKeysUsageStats({});
    localStorage.removeItem('geminiApiKeysStats');
  }, []);

  // تحديث المفاتيح
  const setGeminiApiKeys = useCallback((keys: string[]) => {
    setApiKeys(keys);
    localStorage.setItem('geminiApiKeys', JSON.stringify(keys));
  }, []);

  // تحديث نموذج لمفتاح محدد
  const setApiKeyModel = useCallback((keyId: number, model: string) => {
    setApiKeysModels(prev => {
      const newModels = { ...prev, [keyId]: model };
      localStorage.setItem('geminiApiKeysModels', JSON.stringify(newModels));
      return newModels;
    });
  }, []);

  // الحصول على معلومات المفاتيح
  const getApiKeysInfo = useCallback((): ApiKeyInfo[] => {
    return apiKeys.map((key, index) => {
      const stats = apiKeysUsageStats[index] || { calls: 0, recentCalls: 0, fails: 0, valid: true };
      
      // إظهار جزء محدود من المفتاح للعرض
      const keyPreview = key.length > 10 
        ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` 
        : key;
      
      return {
        keyId: index,
        keyPreview,
        isValid: stats.valid,
        callCount: stats.calls || 0,
        recentCalls: stats.recentCalls || 0,
        failCount: stats.fails || 0,
        model: apiKeysModels[index] || "gemini-1.5-pro"
      };
    });
  }, [apiKeys, apiKeysUsageStats, apiKeysModels]);

  // معالجة الصورة باستخدام Gemini API
  const processWithGemini = useCallback(async (file: File, image: ImageData): Promise<ImageData> => {
    if (!useGemini) {
      return image;
    }

    if (!apiKeys || apiKeys.length === 0) {
      toast({
        title: "خطأ في Gemini API",
        description: "لم يتم توفير أي مفاتيح لـ Gemini API. يرجى إضافتها في الإعدادات.",
        variant: "destructive",
      });
      return {
        ...image,
        status: "error",
        extractedText: "لم يتم توفير أي مفاتيح لـ Gemini API.",
      };
    }

    // اختيار مفتاح API عشوائي
    const apiKeyIndex = Math.floor(Math.random() * apiKeys.length);
    const apiKey = apiKeys[apiKeyIndex];
    const modelVersion = apiKeysModels[apiKeyIndex] || "gemini-1.5-pro";

    // تحديث حالة استخدام المفتاح
    setApiKeysUsageStats(prev => {
      const keyStats = prev[apiKeyIndex] || { calls: 0, recentCalls: 0, fails: 0, valid: true };
      const updatedStats = {
        ...keyStats,
        calls: (keyStats.calls || 0) + 1,
        recentCalls: ((keyStats.recentCalls || 0) + 1) <= 10 ? ((keyStats.recentCalls || 0) + 1) : 10,
      };
      localStorage.setItem('geminiApiKeysStats', JSON.stringify({ ...prev, [apiKeyIndex]: updatedStats }));
      return { ...prev, [apiKeyIndex]: updatedStats };
    });

    try {
      // تحويل الصورة إلى base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
      const base64Image = reader.result as string;

      // استخراج البيانات باستخدام Gemini API
      const geminiResponse = await extractDataWithGemini({
        apiKey: apiKey,
        imageBase64: base64Image,
        modelVersion: modelVersion,
        enhancedExtraction: true
      });

      if (geminiResponse.success) {
        // استخراج البيانات وتحديث حالة الصورة
        const { extractedText, senderName, phoneNumber, province, price, companyName, confidence } = geminiResponse.data;
        return {
          ...image,
          extractedText: extractedText || 'لم يتم استخراج نص',
          senderName: senderName || '',
          phoneNumber: phoneNumber || '',
          province: province || '',
          price: price || '',
          companyName: companyName || '',
          status: "completed",
          extractionMethod: "gemini",
          confidence: confidence,
        };
      } else {
        // تسجيل خطأ في استخدام المفتاح
        setApiKeysUsageStats(prev => {
          const keyStats = prev[apiKeyIndex] || { calls: 0, recentCalls: 0, fails: 0, valid: true };
          const updatedStats = {
            ...keyStats,
            fails: (keyStats.fails || 0) + 1,
            valid: (keyStats.fails || 0) + 1 < 5, // تعطيل المفتاح بعد 5 محاولات فاشلة
          };
          localStorage.setItem('geminiApiKeysStats', JSON.stringify({ ...prev, [apiKeyIndex]: updatedStats }));
          return { ...prev, [apiKeyIndex]: updatedStats };
        });

        // تحديث حالة الصورة في حالة الفشل
        return {
          ...image,
          status: "error",
          extractedText: `فشل استخراج البيانات: ${geminiResponse.message}`,
        };
      }
    } catch (error: any) {
      console.error("خطأ في معالجة Gemini API:", error);
      // تسجيل خطأ في استخدام المفتاح
      setApiKeysUsageStats(prev => {
        const keyStats = prev[apiKeyIndex] || { calls: 0, recentCalls: 0, fails: 0, valid: true };
        const updatedStats = {
          ...keyStats,
          fails: (keyStats.fails || 0) + 1,
          valid: false, // تعطيل المفتاح في حالة الخطأ
        };
        localStorage.setItem('geminiApiKeysStats', JSON.stringify({ ...prev, [apiKeyIndex]: updatedStats }));
        return { ...prev, [apiKeyIndex]: updatedStats };
      });
      return {
        ...image,
        status: "error",
        extractedText: `خطأ في معالجة Gemini API: ${error.message || error}`,
      };
    }
  }, [apiKeys, apiKeysUsageStats, apiKeysModels]);

  return {
    useGemini,
    processWithGemini,
    apiCallCount,
    setGeminiApiKeys,
    getApiKeysInfo,
    setApiKeyModel,
    resetKeyStats,
    testGeminiConnection
  };
};
