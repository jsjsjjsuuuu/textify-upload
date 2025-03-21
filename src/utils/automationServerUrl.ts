
import { toast } from "@/hooks/use-toast";

export const SERVER_URL_KEY = "automationServerUrl";
export const CONNECTION_STATUS_KEY = "connectionStatus";

/**
 * الحصول على مهلة الاتصال
 */
export const getConnectionTimeout = () => {
  // زيادة المهلة الزمنية بشكل موحد - تم إلغاء الفحص للبيئة
  return 120000; // دائمًا استخدام 2 دقيقة كمهلة
};

/**
 * الحصول على عنوان خادم التشغيل الآلي من الذاكرة المحلية
 */
export const getAutomationServerUrl = () => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return '';
  }
  
  // استخدام القيمة المخزنة أو الرجوع إلى القيمة الافتراضية
  const storedUrl = localStorage.getItem(SERVER_URL_KEY);
  if (!storedUrl) {
    return resetAutomationServerUrl();
  }
  
  return storedUrl;
};

/**
 * تعيين عنوان خادم التشغيل الآلي في الذاكرة المحلية
 */
export const setAutomationServerUrl = (url: string) => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return;
  }
  
  // تنظيف URL من الشرطة المائلة النهائية إذا وجدت
  const sanitizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  localStorage.setItem(SERVER_URL_KEY, sanitizedUrl);
  console.log("تم تحديث عنوان الخادم إلى:", sanitizedUrl);
};

/**
 * إعادة تعيين عنوان خادم التشغيل الآلي إلى القيمة الافتراضية
 */
export const resetAutomationServerUrl = () => {
  const defaultUrl = "https://textify-upload.onrender.com";
  setAutomationServerUrl(defaultUrl);
  console.log("تم إعادة تعيين عنوان الخادم إلى القيمة الافتراضية:", defaultUrl);
  return defaultUrl;
};

/**
 * التحقق من صحة عنوان URL
 */
export const isValidServerUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

/**
 * تحديد ما إذا كنا في بيئة المعاينة (Lovable)
 * تم تعديله ليعود دائمًا بالقيمة false (للعمل دائمًا في البيئة الفعلية)
 */
export const isPreviewEnvironment = () => {
  return false;
};

/**
 * الحصول على النطاقات المسموح بها للاتصال بالخادم
 */
export const getAllowedOrigins = () => {
  const defaultAllowedOrigins = [
    'https://d6dc1e9d-71ba-4f8b-ac87-df9860167fcf.lovableproject.com',
    'https://d6dc1e9d-71ba-4f8b-ac87-df9860167fcf.lovable.app',
    'https://textify-upload.onrender.com',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  // استخدام القيمة من متغيرات البيئة إذا كانت متاحة
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ALLOWED_ORIGINS) {
    try {
      return JSON.parse(import.meta.env.VITE_ALLOWED_ORIGINS);
    } catch (e) {
      console.warn('Failed to parse VITE_ALLOWED_ORIGINS:', e);
    }
  }
  
  return defaultAllowedOrigins;
};

/**
 * فحص الاتصال بخادم التشغيل الآلي
 */
export const checkConnection = async () => {
  const serverUrl = getAutomationServerUrl();
  if (!serverUrl) {
    console.warn("Automation server URL is not set.");
    return { isConnected: false, message: "لم يتم تعيين عنوان الخادم" };
  }

  console.log("استخدام طريقة مباشرة للتحقق من الاتصال...");
  try {
    // تجربة الاتصال عن طريق نقطة نهاية ping
    const pingUrl = `${serverUrl}/api/ping`;
    console.log("محاولة اتصال سريع:", pingUrl);
    
    try {
      // الحصول على أصل (origin) النافذة الحالية
      const windowOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      console.log(`استخدام أصل النافذة الحالية: ${windowOrigin}`);
      
      const pingResponse = await fetch(pingUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store",
          "Pragma": "no-cache",
          "X-Request-Time": Date.now().toString(),
          "X-Forwarded-For": getNextIp(),
          "X-Client-ID": "web-client",
          "Origin": windowOrigin,
          "Referer": typeof window !== 'undefined' ? window.location.href : ''
        },
        mode: 'cors',
        credentials: 'omit',
        signal: createTimeoutSignal(30000) // 30 ثانية
      });
      
      if (pingResponse.ok) {
        console.log("Ping response successful:", await pingResponse.json());
        saveConnectionStatus(true);
        return { isConnected: true, message: "تم الاتصال بنجاح" };
      }
    } catch (pingError) {
      console.warn("فشل الاتصال عبر نقطة نهاية ping:", pingError);
    }
    
    // إذا فشل ping، نحاول مسار /api/status
    console.log("محاولة الاتصال عبر /api/status...");
    const healthUrl = `${serverUrl}/api/status`;
    
    // الحصول على أصل (origin) النافذة الحالية
    const windowOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    
    const response = await fetchWithRetry(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Forwarded-For": getNextIp(),
        "X-Client-ID": "web-client",
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache",
        "X-Request-Time": Date.now().toString(),
        "Origin": windowOrigin,
        "Referer": typeof window !== 'undefined' ? window.location.href : ''
      },
      mode: 'cors',
      credentials: 'omit',
      signal: createTimeoutSignal(getConnectionTimeout())
    }, 2, 5000); // محاولتان فقط مع تأخير 5 ثوانٍ

    if (response.ok) {
      console.log("تم الاتصال بنجاح عبر /api/status");
      saveConnectionStatus(true);
      return { isConnected: true, message: "تم الاتصال بنجاح" };
    } else {
      console.error("فشل الاتصال بحالة:", response.status);
      saveConnectionStatus(false);
      return { isConnected: false, message: `فشل الاتصال: ${response.statusText}` };
    }
  } catch (error: any) {
    console.error("خطأ الاتصال:", error);
    let errorMessage = error.message || 'خطأ غير معروف';
    
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'فشل الاتصال بالخادم. تأكد من عنوان الخادم أو اتصال الإنترنت.';
    } else if (errorMessage.includes('timed out') || errorMessage.includes('TimeoutError')) {
      errorMessage = 'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقًا.';
    }
    
    saveConnectionStatus(false);
    return { isConnected: false, message: `خطأ في الاتصال: ${errorMessage}` };
  }
};

export const RENDER_ALLOWED_IPS = [
  "44.226.145.213",
  "54.187.200.255",
  "34.213.214.55",
  "35.164.95.156",
  "44.230.95.183",
  "44.229.200.200"
];

/**
 * الحصول على عنوان IP التالي من القائمة للاستخدام في الطلبات
 */
export const getNextIp = (): string => {
  const currentIndex = Math.floor(Math.random() * RENDER_ALLOWED_IPS.length);
  return RENDER_ALLOWED_IPS[currentIndex];
};

/**
 * إنشاء الرؤوس الأساسية للطلبات
 */
export const createBaseHeaders = (ip?: string): Record<string, string> => {
  const origin = typeof window !== 'undefined' ? window.location.origin : getAutomationServerUrl();
  const referer = typeof window !== 'undefined' ? window.location.href : getAutomationServerUrl();

  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Forwarded-For": ip || getNextIp(),
    "X-Render-Client-IP": ip || getNextIp(),
    "Origin": origin,
    "Referer": referer,
    "X-Client-ID": "web-client",
    "Cache-Control": "no-cache, no-store",
    "Pragma": "no-cache"
  };
};

/**
 * إنشاء إشارة مهلة متوافقة مع مختلف المتصفحات
 */
export const createTimeoutSignal = (ms: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error(`تجاوز المهلة المحددة (${ms} مللي ثانية)`)), ms);
  return controller.signal;
};

/**
 * وظيفة fetch مع إعادة المحاولة
 */
export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, retryDelayMs = 1000): Promise<Response> {
  let retries = 0;
  let lastError: Error = new Error("Unknown error");
  
  while(retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}/${maxRetries} for URL: ${url}`);
      
      // استخدام IP مختلف في كل محاولة
      if (options.headers && typeof options.headers === 'object') {
        const ip = getNextIp();
        (options.headers as Record<string, string>)['X-Forwarded-For'] = ip;
        (options.headers as Record<string, string>)['X-Render-Client-IP'] = ip;
        (options.headers as Record<string, string>)['X-Request-Time'] = Date.now().toString();
        
        // إضافة Origin و Referer للمساعدة في تجاوز قيود CORS
        (options.headers as Record<string, string>)['Origin'] = typeof window !== 'undefined' ? window.location.origin : getAutomationServerUrl();
        (options.headers as Record<string, string>)['Referer'] = typeof window !== 'undefined' ? window.location.href : getAutomationServerUrl();
      }
      
      // إضافة مهلة باستخدام الدالة المتوافقة
      if (!options.signal) {
        options.signal = createTimeoutSignal(getConnectionTimeout());
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        console.error(`Attempt ${retries + 1}/${maxRetries} failed with status: ${response.status}`);
        if (response.status === 404) {
          console.warn('Resource not found, no retries needed.');
          throw new Error(`Resource not found (404) at ${url}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error: any) {
      console.error(`Attempt ${retries + 1}/${maxRetries} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      retries++;
      if (retries < maxRetries) {
        // زيادة فترة الانتظار مع كل محاولة فاشلة (backoff strategy)
        const delay = retryDelayMs * Math.pow(1.5, retries - 1);
        
        console.log(`Waiting ${delay}ms before retry ${retries}/${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  // إذا وصلنا إلى هنا، فشلت جميع المحاولات
  console.error(`All ${maxRetries} attempts failed for URL: ${url}`);
  throw lastError;
}

/**
 * وظيفة لإنشاء خيارات الطلب
 */
export function createFetchOptions(method: string, body: any, additionalHeaders: Record<string, string> = {}): RequestInit {
  const baseHeaders = createBaseHeaders();
  
  // إضافة الرؤوس الخاصة بالأصل والمرجع
  baseHeaders['Origin'] = typeof window !== 'undefined' ? window.location.origin : getAutomationServerUrl();
  baseHeaders['Referer'] = typeof window !== 'undefined' ? window.location.href : getAutomationServerUrl();
  
  const options: RequestInit = {
    method,
    headers: {
      ...baseHeaders,
      ...additionalHeaders
    },
    credentials: "omit",  // تغيير إلى "omit" لتجنب مشكلات CORS
    mode: "cors",
    signal: createTimeoutSignal(getConnectionTimeout())
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
}

/**
 * التحقق من الاتصال بخادم التشغيل الآلي
 */
export const isConnected = async (forceCheck = false) => {
  // تم تعديله لإلغاء محاكاة الاتصال في بيئة المعاينة
  // دائمًا نقوم بالتحقق الفعلي من الاتصال
  
  // التحقق من آخر حالة اتصال إذا كانت حديثة (خلال الدقيقة الماضية)
  const status = getLastConnectionStatus();
  
  if (!forceCheck && status.timestamp) {
    const lastCheck = new Date(status.timestamp);
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    if (lastCheck > oneMinuteAgo) {
      console.log("Using cached connection status:", status.isConnected);
      return status.isConnected;
    }
  }
  
  // إجراء فحص جديد
  try {
    const result = await checkConnection();
    return result.isConnected;
  } catch (error) {
    console.error("Error checking connection:", error);
    return false;
  }
};

/**
 * حفظ حالة الاتصال في الذاكرة المحلية
 */
export const saveConnectionStatus = (isConnected: boolean) => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return;
  }
  const status = {
    isConnected,
    timestamp: new Date().toISOString(),
    retryCount: isConnected ? 0 : (getLastConnectionStatus().retryCount || 0) + 1
  };
  localStorage.setItem(CONNECTION_STATUS_KEY, JSON.stringify(status));
};

// إعادة تسمية هذه الدالة لتكون متوافقة مع الملفات الأخرى
export const updateConnectionStatus = saveConnectionStatus;

/**
 * استرجاع آخر حالة اتصال من الذاكرة المحلية
 */
export const getLastConnectionStatus = () => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return { isConnected: false, timestamp: null, retryCount: 0 };
  }
  const status = localStorage.getItem(CONNECTION_STATUS_KEY);
  if (status) {
    try {
      return JSON.parse(status);
    } catch (e) {
      console.error("Error parsing connection status:", e);
      return { isConnected: false, timestamp: null, retryCount: 0 };
    }
  }
  return { isConnected: false, timestamp: null, retryCount: 0 };
};
