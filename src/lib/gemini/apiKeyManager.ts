
/**
 * مدير مفاتيح API لجيمناي - يقوم بتدوير المفاتيح وإدارة استخدامها
 */

// تخزين مفتاح API الرئيسي - نستخدم مفتاح جديد ذو صلاحيات أفضل
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
  console.log("استخدام مفتاح API الرئيسي:", PRIMARY_API_KEY.substring(0, 8) + "...");
  
  // تسجيل الاستخدام
  const usage = keyUsageMap.get(PRIMARY_API_KEY);
  if (usage) {
    usage.usageCount++;
    usage.lastUsed = Date.now();
    keyUsageMap.set(PRIMARY_API_KEY, usage);
  }
  
  return PRIMARY_API_KEY;
};

/**
 * تسجيل خطأ لمفتاح محدد
 */
export const reportApiKeyError = (apiKey: string, errorMessage: string): void => {
  // تسجيل الخطأ في سجل استخدام المفتاح
  const usage = keyUsageMap.get(apiKey);
  if (usage) {
    usage.errors++;
    
    // فحص إذا كان الخطأ متعلق بتجاوز الحد
    if (errorMessage.includes('rate') || 
        errorMessage.includes('limit') || 
        errorMessage.includes('quota') ||
        errorMessage.includes('429')) {
      
      usage.rateLimit = true;
      usage.cooldownUntil = Date.now() + (5 * 60 * 1000); // 5 دقائق تهدئة
      console.log(`تم وضع المفتاح ${apiKey.substring(0, 8)}... في فترة تهدئة لمدة 5 دقائق بسبب تجاوز الحد`);
    }
    
    keyUsageMap.set(apiKey, usage);
  }
  
  console.log(`تم تسجيل خطأ للمفتاح ${apiKey.substring(0, 8)}... - ${errorMessage}`);
};

/**
 * الحصول على إحصائيات استخدام المفاتيح
 */
export const getApiKeyStats = (): { active: number, rateLimited: number, total: number, cooldown: number } => {
  let active = 0;
  let rateLimited = 0;
  let cooldown = 0;
  
  const now = Date.now();
  
  for (const [key, usage] of keyUsageMap.entries()) {
    if (usage.rateLimit) {
      if (usage.cooldownUntil > now) {
        rateLimited++;
      } else {
        // إعادة تعيين حالة المفتاح بعد انتهاء فترة التهدئة
        usage.rateLimit = false;
        active++;
        keyUsageMap.set(key, usage);
      }
    } else {
      active++;
    }
    
    if (usage.cooldownUntil > now) {
      cooldown++;
    }
  }
  
  return {
    active,
    rateLimited,
    total: keyUsageMap.size,
    cooldown
  };
};

/**
 * إعادة تعيين حالة مفتاح محدد
 */
export const resetApiKeyStatus = (apiKey: string): void => {
  const usage = keyUsageMap.get(apiKey);
  if (usage) {
    usage.errors = 0;
    usage.rateLimit = false;
    usage.cooldownUntil = 0;
    keyUsageMap.set(apiKey, usage);
  }
  console.log(`تم إعادة تعيين حالة مفتاح API: ${apiKey.substring(0, 8)}...`);
};

/**
 * إعادة تعيين جميع مفاتيح API
 */
export const resetAllApiKeys = (): void => {
  for (const [key, usage] of keyUsageMap.entries()) {
    usage.errors = 0;
    usage.rateLimit = false;
    usage.cooldownUntil = 0;
    keyUsageMap.set(key, usage);
  }
  console.log("تم إعادة تعيين جميع مفاتيح API");
};

// تصدير المفاتيح للاستخدام في أجزاء أخرى من التطبيق
export const getAllApiKeys = (): string[] => {
  return [PRIMARY_API_KEY];
};

// تصدير مفتاح API الافتراضي (أول مفتاح)
export const DEFAULT_GEMINI_API_KEY = PRIMARY_API_KEY;
