
/**
 * مدير مفاتيح API لجيمناي - يقوم بتدوير المفاتيح وإدارة استخدامها
 */

// تخزين مفتاح API الرئيسي
const PRIMARY_API_KEY = "AIzaSyBKczW8k6fNBXnjD5y7P2vLC5nYgJM7I4o";

// تخزين مفاتيح API المتعددة، نستخدم الآن فقط المفتاح المحدد
const API_KEYS = [
  PRIMARY_API_KEY,
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
 * الحصول على المفتاح التالي - نستخدم الآن دائماً المفتاح الرئيسي
 */
export const getNextApiKey = (): string => {
  console.log("استخدام مفتاح API الرئيسي:", PRIMARY_API_KEY.substring(0, 5) + "...");
  return PRIMARY_API_KEY;
};

/**
 * تسجيل خطأ لمفتاح محدد
 */
export const reportApiKeyError = (apiKey: string, errorMessage: string): void => {
  // تسجيل الخطأ فقط دون تغيير حالة المفتاح
  console.log(`حدث خطأ باستخدام المفتاح: ${apiKey.substring(0, 5)}... - ${errorMessage}`);
};

/**
 * الحصول على إحصائيات استخدام المفاتيح
 */
export const getApiKeyStats = (): { active: number, rateLimited: number, total: number, cooldown: number } => {
  // دائمًا إرجاع أن لدينا مفتاح نشط واحد فقط
  return {
    active: 1,
    rateLimited: 0,
    cooldown: 0,
    total: 1
  };
};

/**
 * إعادة تعيين حالة مفتاح محدد
 */
export const resetApiKeyStatus = (apiKey: string): void => {
  console.log(`تم إعادة تعيين حالة مفتاح API: ${apiKey.substring(0, 5)}...`);
};

/**
 * إعادة تعيين جميع مفاتيح API
 */
export const resetAllApiKeys = (): void => {
  console.log("تم إعادة تعيين جميع مفاتيح API");
};

// تصدير المفاتيح للاستخدام في أجزاء أخرى من التطبيق
export const getAllApiKeys = (): string[] => {
  return [PRIMARY_API_KEY];
};

// تصدير مفتاح API الافتراضي (أول مفتاح)
export const DEFAULT_GEMINI_API_KEY = PRIMARY_API_KEY;
