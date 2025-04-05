
// نظام لإدارة مفتاح Gemini API

// المفتاح الرئيسي الافتراضي
export const DEFAULT_GEMINI_API_KEY: string = "AIzaSyAW9EbEuvXYdg6FmLjlhl_jXv-SGtFHCC4";

// قائمة المفاتيح (الآن تحتوي فقط على المفتاح الافتراضي والمفاتيح المضافة من قبل المستخدم)
const API_KEYS: string[] = [DEFAULT_GEMINI_API_KEY];

// مؤشر للمفتاح الحالي
let currentKeyIndex = 0;

// حالة المفاتيح
const keyStatus = new Map<string, { errors: number, lastError: string, blocked: boolean }>();

// تهيئة حالة المفتاح الافتراضي
keyStatus.set(DEFAULT_GEMINI_API_KEY, { errors: 0, lastError: "", blocked: false });

// تاريخ آخر إعادة تعيين
let lastResetTime = Date.now();

// الحصول على المفتاح الحالي (نستخدم المفتاح الأحدث إذا كان موجوداً، وإلا نستخدم المفتاح الافتراضي)
export const getNextApiKey = (): string => {
  // إذا كان هناك مفتاح مستخدم مضاف، نستخدمه أولاً
  if (API_KEYS.length > 1) {
    const userKey = API_KEYS[API_KEYS.length - 1]; // آخر مفتاح تم إضافته
    
    // التحقق أن المفتاح ليس محظوراً
    if (!keyStatus.get(userKey)?.blocked) {
      return userKey;
    }
  }
  
  // استخدام المفتاح الافتراضي كخطة بديلة
  return DEFAULT_GEMINI_API_KEY;
};

// الإبلاغ عن خطأ لمفتاح API
export const reportApiKeyError = (key: string, error: string): void => {
  if (!API_KEYS.includes(key)) return;
  
  const status = keyStatus.get(key) || { errors: 0, lastError: "", blocked: false };
  status.errors += 1;
  status.lastError = error;
  
  console.warn(`خطأ لمفتاح API ${key.substring(0, 10)}...: ${error} (${status.errors} أخطاء)`);
  
  // تحليل نوع الخطأ
  if (
    error.includes('quota') || 
    error.includes('rate limit') || 
    error.includes('Resource exhausted') ||
    error.includes('Too many requests')
  ) {
    // حظر المفتاح فورًا عند تجاوز حدود الاستخدام
    status.blocked = true;
    console.error(`تم حظر مفتاح API ${key.substring(0, 10)}... بسبب تجاوز حدود الاستخدام`);
  } else if (status.errors >= 5) {
    // حظر المفتاح إذا تجاوز حد الأخطاء
    status.blocked = true;
    console.error(`تم حظر مفتاح API ${key.substring(0, 10)}... بسبب كثرة الأخطاء`);
  }
  
  keyStatus.set(key, status);
};

// الحصول على مفتاح API الحالي
export const getCurrentApiKey = (): string => {
  return getNextApiKey(); // نستخدم نفس المنطق
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
  lastResetTime = Date.now();
  console.log("تم إعادة تعيين جميع مفاتيح API");
};

// الحصول على إحصائيات المفاتيح
export const getApiKeyStats = (): { total: number, active: number, blocked: number, rateLimited: number, lastReset: number } => {
  let blocked = 0;
  let rateLimited = 0;
  
  API_KEYS.forEach(key => {
    const status = keyStatus.get(key);
    if (status?.blocked) {
      blocked++;
      if (status?.lastError?.includes("quota") || status?.lastError?.includes("rate limit")) {
        rateLimited++;
      }
    }
  });
  
  return {
    total: API_KEYS.length,
    active: API_KEYS.length - blocked,
    blocked,
    rateLimited,
    lastReset: lastResetTime
  };
};

// إضافة مفتاح API جديد (الآن يحل محل أي مفاتيح مضافة سابقًا)
export const addApiKey = (newKey: string): boolean => {
  // التحقق من صحة المفتاح (يجب أن يكون بطول معين)
  if (newKey.length < 20) {
    return false;
  }
  
  // إزالة أي مفاتيح مضافة سابقًا (غير المفتاح الافتراضي)
  while (API_KEYS.length > 1) {
    const keyToRemove = API_KEYS.pop();
    if (keyToRemove) {
      keyStatus.delete(keyToRemove);
    }
  }
  
  // إضافة المفتاح الجديد
  API_KEYS.push(newKey);
  keyStatus.set(newKey, { errors: 0, lastError: "", blocked: false });
  console.log(`تمت إضافة مفتاح API جديد: ${newKey.substring(0, 10)}...`);
  return true;
};
