
/**
 * مدير مفاتيح API لجيمناي - يقوم بتدوير المفاتيح وإدارة استخدامها
 */

// تخزين مفاتيح API المتعددة
const API_KEYS = [
  "AIzaSyAKa3HnGszEpnhx2SXJbuQTjFNfL2Un2d8",
  "AIzaSyCzHmpOdtuRu07jP0P4GNlCMeQB_InKT7E",
  "AIzaSyCw3ET1HuGtfJtuY1ABK4GdLuOHtkqceKo",
  "AIzaSyCp7rVtu_IAdBSICRSd5RmNCvdrkiXQ7SI",
  "AIzaSyBUwu7p61Rk1BHYJb5sa-CUMuN_6ImuQOc" // المفتاح الافتراضي السابق
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
      rateLimit: false 
    }
  ])
);

/**
 * الحصول على المفتاح التالي بناءً على خوارزمية توزيع الحمل
 */
export const getNextApiKey = (): string => {
  // البحث عن المفتاح الأقل استخدامًا الذي ليس لديه قيود معدل
  const sortedKeys = [...keyUsageMap.values()]
    .filter(usage => !usage.rateLimit) // استبعاد المفاتيح التي تجاوزت الحد
    .sort((a, b) => {
      // أولوية للمفاتيح الأقل استخدامًا
      if (a.usageCount !== b.usageCount) {
        return a.usageCount - b.usageCount;
      }
      // إذا كان الاستخدام متساويًا، استخدم الأقدم آخر استخدام
      return a.lastUsed - b.lastUsed;
    });

  // إذا لم يكن هناك مفاتيح متاحة، أعد تعيين حالة الحد لجميع المفاتيح وابدأ من جديد
  if (sortedKeys.length === 0) {
    console.log("جميع المفاتيح وصلت للحد الأقصى. إعادة تعيين حالة القيود...");
    
    // إعادة تعيين حالة تجاوز الحد لجميع المفاتيح
    for (const usage of keyUsageMap.values()) {
      usage.rateLimit = false;
    }
    
    // استخدم أقدم مفتاح تم استخدامه
    const oldestKey = [...keyUsageMap.values()]
      .sort((a, b) => a.lastUsed - b.lastUsed)[0];
    
    return oldestKey.key;
  }

  // استخدام المفتاح الأقل استخدامًا
  const nextKey = sortedKeys[0].key;
  
  // تحديث بيانات الاستخدام
  const usage = keyUsageMap.get(nextKey)!;
  usage.usageCount += 1;
  usage.lastUsed = Date.now();
  
  console.log(`استخدام مفتاح API: ${nextKey.substring(0, 5)}... (الاستخدام: ${usage.usageCount})`);
  
  return nextKey;
};

/**
 * تسجيل خطأ لمفتاح محدد
 */
export const reportApiKeyError = (apiKey: string, errorMessage: string): void => {
  const usage = keyUsageMap.get(apiKey);
  if (!usage) return;
  
  usage.errors += 1;
  
  // التحقق مما إذا كان الخطأ بسبب تجاوز حدود الاستخدام
  if (
    errorMessage.includes("quota") || 
    errorMessage.includes("rate limit") || 
    errorMessage.includes("too many requests") ||
    errorMessage.includes("exceeded") ||
    errorMessage.includes("limit") || 
    errorMessage.includes("dailyLimit")
  ) {
    usage.rateLimit = true;
    console.log(`تم وضع علامة على مفتاح API ${apiKey.substring(0, 5)}... كمفتاح تجاوز الحد`);
  }
  
  // إذا كان هناك عدد كبير من الأخطاء، ضع علامة على المفتاح كمفتاح تجاوز الحد
  if (usage.errors >= 3) {
    usage.rateLimit = true;
    console.log(`تم وضع علامة على مفتاح API ${apiKey.substring(0, 5)}... كمفتاح به أخطاء متكررة`);
  }
};

/**
 * الحصول على إحصائيات استخدام المفاتيح
 */
export const getApiKeyStats = (): { active: number, rateLimited: number, total: number } => {
  const stats = {
    active: 0,
    rateLimited: 0,
    total: keyUsageMap.size
  };
  
  for (const usage of keyUsageMap.values()) {
    if (usage.rateLimit) {
      stats.rateLimited++;
    } else {
      stats.active++;
    }
  }
  
  return stats;
};

/**
 * إعادة تعيين حالة مفتاح محدد
 */
export const resetApiKeyStatus = (apiKey: string): void => {
  const usage = keyUsageMap.get(apiKey);
  if (usage) {
    usage.rateLimit = false;
    usage.errors = 0;
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
