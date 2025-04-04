
/**
 * مدير مفاتيح API لجيمناي - يقوم بتدوير المفاتيح وإدارة استخدامها
 */

// تخزين مفتاح API المحدد
const API_KEYS = [
  "AIzaSyAW9EbEuvXYdg6FmLjlhl_jXv-SGtFHCC4", // المفتاح المقدم من المستخدم
];

// مؤشر للمفتاح الحالي
let currentKeyIndex = 0;

// سجل استخدام المفاتيح
// يتتبع الاستخدام لكل مفتاح لمنع تجاوز الحد
interface KeyUsage {
  key: string;
  usageCount: number;
  lastUsed: number;
  errors: number;
  rateLimit: boolean;
  cooldownUntil: number; // إضافة وقت انتهاء فترة التهدئة
}

// تهيئة سجل الاستخدام
const keyUsageMap = new Map<string, KeyUsage>(
  API_KEYS.map(key => [
    key, 
    { 
      key, 
      usageCount: 0, 
      lastUsed: 0, 
      errors: 0, 
      rateLimit: false,
      cooldownUntil: 0
    }
  ])
);

/**
 * الحصول على المفتاح التالي
 */
export const getNextApiKey = (): string => {
  // دائما نستخدم المفتاح الوحيد المحدد
  return API_KEYS[0];
};

/**
 * تسجيل خطأ لمفتاح محدد
 */
export const reportApiKeyError = (apiKey: string, errorMessage: string): void => {
  const usage = keyUsageMap.get(apiKey);
  if (!usage) return;
  
  usage.errors += 1;
  
  // التحقق مما إذا كان الخطأ بسبب تجاوز حدود الاستخدام
  const isRateLimitError = 
    errorMessage.includes("quota") || 
    errorMessage.includes("rate limit") || 
    errorMessage.includes("too many requests") ||
    errorMessage.includes("exceeded") ||
    errorMessage.includes("limit") || 
    errorMessage.includes("dailyLimit") ||
    errorMessage.includes("429"); // كود حالة تجاوز الحد للطلبات
  
  if (isRateLimitError) {
    console.log(`تم وضع علامة على مفتاح API ${apiKey.substring(0, 5)}... كمفتاح تجاوز الحد`);
    usage.rateLimit = true;
    // زيادة فترة التهدئة للمفتاح - 15 دقيقة للأخطاء المتعلقة بتجاوز الحد
    usage.cooldownUntil = Date.now() + 15 * 60 * 1000;
  }
  
  // إذا كان هناك عدد كبير من الأخطاء، ضع علامة على المفتاح كمفتاح تجاوز الحد
  if (usage.errors >= 3) {
    console.log(`تم وضع علامة على مفتاح API ${apiKey.substring(0, 5)}... كمفتاح به أخطاء متكررة`);
    usage.rateLimit = true;
    // زيادة فترة التهدئة للأخطاء العامة - 5 دقائق
    usage.cooldownUntil = Date.now() + 5 * 60 * 1000;
  }
};

/**
 * الحصول على إحصائيات استخدام المفاتيح
 */
export const getApiKeyStats = (): { active: number, rateLimited: number, total: number, cooldown: number } => {
  return {
    active: 1, // دائمًا مفتاح واحد نشط
    rateLimited: 0,
    cooldown: 0,
    total: 1
  };
};

/**
 * إعادة تعيين حالة مفتاح محدد
 */
export const resetApiKeyStatus = (apiKey: string): void => {
  const usage = keyUsageMap.get(apiKey);
  if (usage) {
    usage.rateLimit = false;
    usage.errors = 0;
    usage.cooldownUntil = 0;
    console.log(`تم إعادة تعيين حالة مفتاح API: ${apiKey.substring(0, 5)}...`);
  }
};

/**
 * إعادة تعيين جميع مفاتيح API
 */
export const resetAllApiKeys = (): void => {
  for (const key of API_KEYS) {
    resetApiKeyStatus(key);
  }
  console.log("تم إعادة تعيين جميع مفاتيح API");
};

// تصدير المفاتيح للاستخدام في أجزاء أخرى من التطبيق
export const getAllApiKeys = (): string[] => {
  return [...API_KEYS];
};

// تصدير مفتاح API الافتراضي (أول مفتاح)
export const DEFAULT_GEMINI_API_KEY = API_KEYS[0];
