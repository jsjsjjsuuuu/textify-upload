
/**
 * مدير مفاتيح API لجيمناي - يقوم بتدوير المفاتيح وإدارة استخدامها
 */

// تخزين مفتاح API الرئيسي
const PRIMARY_API_KEY = "AIzaSyBKczW8k6fNBXnjD5y7P2vLC5nYgJM7I4o";

// تخزين مفاتيح API المتعددة، نستخدم الآن فقط المفتاح المحدد
const API_KEYS = [
  PRIMARY_API_KEY,
  // احتفظنا بالمفاتيح الأخرى كنسخة احتياطية ولكن معطلة
  // يمكن تفعيلها لاحقاً إذا لزم الأمر
  /*
  "AIzaSyAKa3HnGszEpnhx2SXJbuQTjFNfL2Un2d8",
  "AIzaSyCzHmpOdtuRu07jP0P4GNlCMeQB_InKT7E",
  "AIzaSyCw3ET1HuGtfJtuY1ABK4GdLuOHtkqceKo",
  "AIzaSyCp7rVtu_IAdBSICRSd5RmNCvdrkiXQ7SI",
  "AIzaSyBUwu7p61Rk1BHYJb5sa-CUMuN_6ImuQOc",
  "AIzaSyDi_K0m6y-t62a_fqxFV8DToF9sVpmm7YI",
  "AIzaSyCn-oXnIxQWiYy-wYI5-UpHbr_P-3Ni68Y",
  "AIzaSyDGPa1F9XH4nh3rxtwCnBBHMEDVHrygUUk",
  "AIzaSyBL8PnaeEL4tKUCJzrVPFDk5-UJGD9M4vQ"
  */
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
  // دائماً إرجاع المفتاح الرئيسي المحدد
  return PRIMARY_API_KEY;
  
  /* تم تعطيل منطق التناوب بين المفاتيح
  const now = Date.now();
  
  // تحديث حالة فترة التهدئة للمفاتيح
  for (const usage of keyUsageMap.values()) {
    if (usage.cooldownUntil > 0 && now > usage.cooldownUntil) {
      console.log(`انتهت فترة التهدئة للمفتاح ${usage.key.substring(0, 5)}...`);
      usage.cooldownUntil = 0;
      usage.rateLimit = false;
      usage.errors = 0;
    }
  }
  
  // البحث عن المفتاح الأقل استخدامًا الذي ليس لديه قيود معدل
  const availableKeys = [...keyUsageMap.values()]
    .filter(usage => !usage.rateLimit && usage.cooldownUntil <= now); // استبعاد المفاتيح التي تجاوزت الحد أو في فترة تهدئة
  
  if (availableKeys.length === 0) {
    console.log("جميع المفاتيح وصلت للحد الأقصى أو في فترة تهدئة. اختيار أقدم مفتاح...");
    
    // استخدم المفتاح الذي مر على فترة التهدئة أطول وقت
    const oldestKey = [...keyUsageMap.values()]
      .sort((a, b) => (a.cooldownUntil || a.lastUsed) - (b.cooldownUntil || b.lastUsed))[0];
    
    // إعادة تعيين حالة المفتاح للاستخدام مرة أخرى
    oldestKey.rateLimit = false;
    oldestKey.errors = 0;
    oldestKey.cooldownUntil = 0;
    
    console.log(`إعادة استخدام المفتاح ${oldestKey.key.substring(0, 5)}... بعد انتهاء فترة التهدئة`);
    
    // تحديث بيانات الاستخدام
    oldestKey.usageCount += 1;
    oldestKey.lastUsed = now;
    
    return oldestKey.key;
  }

  // ترتيب المفاتيح المتاحة حسب الأقل استخدامًا والأقدم استخدامًا
  const sortedKeys = availableKeys.sort((a, b) => {
    // أولوية للمفاتيح الأقل استخدامًا
    if (a.usageCount !== b.usageCount) {
      return a.usageCount - b.usageCount;
    }
    // إذا كان الاستخدام متساويًا، استخدم الأقدم آخر استخدام
    return a.lastUsed - b.lastUsed;
  });
  
  // استخدام المفتاح الأقل استخدامًا
  const nextKey = sortedKeys[0].key;
  
  // تحديث بيانات الاستخدام
  const usage = keyUsageMap.get(nextKey)!;
  usage.usageCount += 1;
  usage.lastUsed = now;
  
  console.log(`استخدام مفتاح API: ${nextKey.substring(0, 5)}... (الاستخدام: ${usage.usageCount})`);
  
  return nextKey;
  */
};

/**
 * تسجيل خطأ لمفتاح محدد
 */
export const reportApiKeyError = (apiKey: string, errorMessage: string): void => {
  // تسجيل الخطأ فقط دون تغيير حالة المفتاح
  console.log(`حدث خطأ باستخدام المفتاح: ${apiKey.substring(0, 5)}... - ${errorMessage}`);
  
  /* تم تعطيل منطق التناوب
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
  */
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
  
  /* تم تعطيل منطق التناوب
  const now = Date.now();
  const stats = {
    active: 0,
    rateLimited: 0,
    cooldown: 0,
    total: keyUsageMap.size
  };
  
  for (const usage of keyUsageMap.values()) {
    if (usage.cooldownUntil > now) {
      stats.cooldown++;
    } else if (usage.rateLimit) {
      stats.rateLimited++;
    } else {
      stats.active++;
    }
  }
  
  return stats;
  */
};

/**
 * إعادة تعيين حالة مفتاح محدد
 */
export const resetApiKeyStatus = (apiKey: string): void => {
  console.log(`تم إعادة تعيين حالة مفتاح API: ${apiKey.substring(0, 5)}...`);
  
  /* تم تعطيل منطق التناوب
  const usage = keyUsageMap.get(apiKey);
  if (usage) {
    usage.rateLimit = false;
    usage.errors = 0;
    usage.cooldownUntil = 0;
    console.log(`تم إعادة تعيين حالة مفتاح API: ${apiKey.substring(0, 5)}...`);
  }
  */
};

/**
 * إعادة تعيين جميع مفاتيح API
 */
export const resetAllApiKeys = (): void => {
  console.log("تم إعادة تعيين جميع مفاتيح API");
  
  /* تم تعطيل منطق التناوب
  for (const key of API_KEYS) {
    resetApiKeyStatus(key);
  }
  console.log("تم إعادة تعيين جميع مفاتيح API");
  */
};

// تصدير المفاتيح للاستخدام في أجزاء أخرى من التطبيق
export const getAllApiKeys = (): string[] => {
  return [PRIMARY_API_KEY];
};

// تصدير مفتاح API الافتراضي (أول مفتاح)
export const DEFAULT_GEMINI_API_KEY = PRIMARY_API_KEY;
