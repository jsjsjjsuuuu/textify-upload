
// نظام لإدارة وتبديل مفاتيح Gemini API

// المفتاح الرئيسي الافتراضي
export const DEFAULT_GEMINI_API_KEY: string = "AIzaSyAW9EbEuvXYdg6FmLjlhl_jXv-SGtFHCC4";

// قائمة المفاتيح الإضافية (يمكن للمستخدمين إضافة المزيد)
const API_KEYS: string[] = [
  DEFAULT_GEMINI_API_KEY, 
  "AIzaSyAHm38lmQWCN5S6rxIM_J7zrbFkFdPUdW4",
  "AIzaSyAPiPCTjtxn1Ay9nWKGYiDPF09BitbKaXg"
];

// مؤشر يشير إلى المفتاح الحالي
let currentKeyIndex = 0;

// حالة المفاتيح
const keyStatus = new Map<string, { errors: number, lastError: string, blocked: boolean }>();

// تهيئة حالة المفاتيح
API_KEYS.forEach(key => {
  keyStatus.set(key, { errors: 0, lastError: "", blocked: false });
});

// الحصول على المفتاح التالي للدوران
export const getNextApiKey = (): string => {
  // التحقق من وجود مفاتيح غير محظورة
  const activeKeys = API_KEYS.filter(key => !keyStatus.get(key)?.blocked);
  
  if (activeKeys.length === 0) {
    console.warn("جميع مفاتيح API محظورة! إعادة تعيين المفتاح الرئيسي...");
    keyStatus.set(DEFAULT_GEMINI_API_KEY, { errors: 0, lastError: "", blocked: false });
    currentKeyIndex = API_KEYS.indexOf(DEFAULT_GEMINI_API_KEY);
    return DEFAULT_GEMINI_API_KEY;
  }
  
  // البحث عن المفتاح التالي غير المحظور
  let attempts = 0;
  while (attempts < API_KEYS.length) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    const key = API_KEYS[currentKeyIndex];
    
    if (!keyStatus.get(key)?.blocked) {
      return key;
    }
    
    attempts++;
  }
  
  // إذا لم يتم العثور على مفتاح غير محظور، استخدم المفتاح الرئيسي
  currentKeyIndex = API_KEYS.indexOf(DEFAULT_GEMINI_API_KEY);
  return DEFAULT_GEMINI_API_KEY;
};

// الإبلاغ عن خطأ لمفتاح API
export const reportApiKeyError = (key: string, error: string): void => {
  if (!API_KEYS.includes(key)) return;
  
  const status = keyStatus.get(key) || { errors: 0, lastError: "", blocked: false };
  status.errors += 1;
  status.lastError = error;
  
  console.warn(`خطأ لمفتاح API ${key.substring(0, 10)}...: ${error} (${status.errors} أخطاء)`);
  
  // حظر المفتاح إذا تجاوز حد الأخطاء
  if (status.errors >= 5) {
    status.blocked = true;
    console.error(`تم حظر مفتاح API ${key.substring(0, 10)}... بسبب كثرة الأخطاء`);
  }
  
  keyStatus.set(key, status);
};

// الحصول على مفتاح API الحالي
export const getCurrentApiKey = (): string => {
  return API_KEYS[currentKeyIndex];
};

// إعادة تعيين حالة مفتاح API محدد
export const resetApiKey = (key: string): void => {
  if (API_KEYS.includes(key)) {
    keyStatus.set(key, { errors: 0, lastError: "", blocked: false });
    console.log(`تم إعادة تعيين حالة مفتاح API ${key.substring(0, 10)}...`);
  }
};

// إعادة تعيين جميع مفاتيح API
export const resetAllApiKeys = (): void => {
  API_KEYS.forEach(key => {
    keyStatus.set(key, { errors: 0, lastError: "", blocked: false });
  });
  currentKeyIndex = 0;
  console.log("تم إعادة تعيين جميع مفاتيح API");
};

// الحصول على إحصائيات المفاتيح
export const getApiKeyStats = (): { total: number, active: number, blocked: number, rateLimited: number } => {
  let blocked = 0;
  let rateLimited = 0;
  
  API_KEYS.forEach(key => {
    const status = keyStatus.get(key);
    if (status?.blocked) {
      blocked++;
    } else if (status?.lastError?.includes("quota") || status?.lastError?.includes("rate limit")) {
      rateLimited++;
    }
  });
  
  return {
    total: API_KEYS.length,
    active: API_KEYS.length - blocked - rateLimited,
    blocked,
    rateLimited
  };
};
