
/**
 * ملف للتعامل مع نماذج Gemini المختلفة
 */

import { getNextApiKey, reportApiKeyError } from "./apiKeyManager";

// أنواع النماذج المتاحة
export enum GeminiModelType {
  FLASH = 'gemini-2.0-flash', // النموذج السريع والمحدث
  PRO = 'gemini-1.5-pro', // النموذج الدقيق للمحتوى المعقد
  VISION = 'gemini-1.5-vision-latest' // نموذج الرؤية المتخصص للصور
}

// قائمة كاملة بجميع النماذج المتاحة
export const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (الأحدث)', description: 'الإصدار الأحدث والسريع' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'نموذج سريع مناسب للاستخدام العام' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'نموذج متقدم للمهام المعقدة' },
  { id: 'gemini-1.5-vision-latest', name: 'Gemini Vision', description: 'نموذج متخصص للتعرف على الصور' }
];

// الإعدادات الافتراضية لكل نموذج
export const MODEL_SETTINGS = {
  [GeminiModelType.FLASH]: {
    maxTokens: 800,
    temperature: 0.1,
    topK: 40,
    topP: 0.95
  },
  [GeminiModelType.PRO]: {
    maxTokens: 1024,
    temperature: 0.2,
    topK: 40,
    topP: 0.95
  },
  [GeminiModelType.VISION]: {
    maxTokens: 1024,
    temperature: 0.2,
    topK: 40,
    topP: 0.95
  }
};

// النموذج الافتراضي للاستخدام في استخراج البيانات من الصور
export const DEFAULT_EXTRACTION_MODEL = GeminiModelType.FLASH;

// وظيفة لاختبار النماذج المتاحة
export async function testGeminiModels(): Promise<Record<string, boolean>> {
  const apiKey = getNextApiKey();
  const results: Record<string, boolean> = {};
  
  for (const model of AVAILABLE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent`;
      
      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "اختبار بسيط" }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 128
          }
        })
      };
      
      const response = await fetch(`${endpoint}?key=${apiKey}`, fetchOptions);
      
      if (response.ok) {
        results[model.id] = true;
      } else {
        results[model.id] = false;
        const error = await response.text();
        reportApiKeyError(apiKey, `فشل اختبار النموذج ${model.id}: ${error}`);
      }
    } catch (error) {
      results[model.id] = false;
      reportApiKeyError(apiKey, `خطأ اختبار النموذج ${model.id}: ${error.message}`);
      console.error(`خطأ في اختبار نموذج ${model.id}:`, error);
    }
  }
  
  return results;
}

// وظيفة لاختيار أفضل نموذج بناءً على نوع المدخلات
export function selectOptimalModel(imageSize: number, complexity: 'low' | 'medium' | 'high' = 'medium'): GeminiModelType {
  // حجم الصورة بالميجابايت
  const imageSizeMB = imageSize / (1024 * 1024);
  
  if (imageSizeMB > 5) {
    // للصور الكبيرة جدًا، نستخدم النموذج السريع
    return GeminiModelType.FLASH;
  }
  
  if (complexity === 'high') {
    // للمهام المعقدة، نستخدم النموذج المتقدم
    return GeminiModelType.PRO;
  }
  
  // الافتراضي: استخدام النموذج السريع لأغلب الاستخدامات
  return GeminiModelType.FLASH;
}

