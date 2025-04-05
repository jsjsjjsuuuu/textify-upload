
// نظام لإدارة مفتاح Gemini API

// المفتاح الرئيسي الافتراضي
export const DEFAULT_GEMINI_API_KEY: string = "AIzaSyAW9EbEuvXYdg6FmLjlhl_jXv-SGtFHCC4";

// قائمة المفاتيح (الآن تحتفظ فقط بمفتاح واحد نشط)
let ACTIVE_API_KEY: string = DEFAULT_GEMINI_API_KEY;
let IS_CUSTOM_KEY: boolean = false;

// حالة المفتاح
const keyStatus = new Map<string, { errors: number, lastError: string, blocked: boolean }>();

// تهيئة حالة المفتاح الافتراضي
keyStatus.set(DEFAULT_GEMINI_API_KEY, { errors: 0, lastError: "", blocked: false });

// تاريخ آخر إعادة تعيين
let lastResetTime = Date.now();

// الحصول على المفتاح الحالي
export const getNextApiKey = (): string => {
  // التحقق من تفضيل المستخدم أولاً
  const useCustomKey = localStorage.getItem('use_custom_gemini_api_key') === 'true';
  
  // إذا كان المستخدم يريد استخدام المفتاح المخصص
  if (useCustomKey) {
    const customKey = localStorage.getItem('custom_gemini_api_key');
    
    // إذا كان هناك مفتاح مخصص، استخدمه
    if (customKey && customKey.length > 20) {
      // تأكد من إضافته إلى حالة المفاتيح إذا لم يكن موجودًا
      if (!keyStatus.has(customKey)) {
        keyStatus.set(customKey, { errors: 0, lastError: "", blocked: false });
      }
      
      // التحقق أن المفتاح ليس محظورًا
      if (!keyStatus.get(customKey)?.blocked) {
        return customKey;
      }
    }
  }
  
  // استخدام المفتاح النشط (إما المخصص أو الافتراضي)
  if (!keyStatus.get(ACTIVE_API_KEY)?.blocked) {
    return ACTIVE_API_KEY;
  }
  
  // العودة إلى المفتاح الافتراضي كخطة بديلة
  return DEFAULT_GEMINI_API_KEY;
};

// الإبلاغ عن خطأ لمفتاح API
export const reportApiKeyError = (key: string, error: string): void => {
  if (!keyStatus.has(key)) return;
  
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
  return ACTIVE_API_KEY;
};

// إعادة تعيين حالة مفتاح API محدد
export const resetApiKey = (key: string): void => {
  if (keyStatus.has(key)) {
    keyStatus.set(key, { errors: 0, lastError: "", blocked: false });
    console.log(`تم إعادة تعيين حالة مفتاح API ${key.substring(0, 10)}...`);
  }
};

// إعادة تعيين جميع مفاتيح API
export const resetAllApiKeys = (): void => {
  keyStatus.forEach((_, key) => {
    keyStatus.set(key, { errors: 0, lastError: "", blocked: false });
  });
  lastResetTime = Date.now();
  console.log("تم إعادة تعيين جميع مفاتيح API");
};

// الحصول على إحصائيات المفاتيح
export const getApiKeyStats = (): { total: number, active: number, blocked: number, rateLimited: number, lastReset: number } => {
  let total = keyStatus.size;
  let blocked = 0;
  let rateLimited = 0;
  
  keyStatus.forEach((status, _) => {
    if (status.blocked) {
      blocked++;
      if (status.lastError?.includes("quota") || status.lastError?.includes("rate limit")) {
        rateLimited++;
      }
    }
  });
  
  return {
    total,
    active: total - blocked,
    blocked,
    rateLimited,
    lastReset: lastResetTime
  };
};

// إضافة مفتاح API جديد
export const addApiKey = (newKey: string): boolean => {
  // إذا كان المفتاح هو "default"، استخدم المفتاح الافتراضي
  if (newKey === 'default') {
    ACTIVE_API_KEY = DEFAULT_GEMINI_API_KEY;
    IS_CUSTOM_KEY = false;
    console.log(`تم تعيين المفتاح النشط إلى المفتاح الافتراضي`);
    return true;
  }
  
  // التحقق من صحة المفتاح
  if (newKey.length < 20) {
    return false;
  }
  
  // تعيين المفتاح الجديد كمفتاح نشط
  ACTIVE_API_KEY = newKey;
  IS_CUSTOM_KEY = true;
  
  // إضافة المفتاح إلى حالة المفاتيح إذا لم يكن موجودًا
  if (!keyStatus.has(newKey)) {
    keyStatus.set(newKey, { errors: 0, lastError: "", blocked: false });
  }
  
  console.log(`تم تعيين مفتاح API جديد: ${newKey.substring(0, 10)}...`);
  return true;
};

// التحقق مما إذا كان المفتاح الحالي مخصصًا
export const isCustomKeyActive = (): boolean => {
  return IS_CUSTOM_KEY;
};
