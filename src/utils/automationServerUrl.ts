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
  // تم تعطيل التحقق وإرجاع false دائمًا لإلغاء سلوك بيئة المعاينة
  return false;
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

  try {
    // أولاً، نجرب استخدام /api/ping كنقطة نهاية خفيفة للفحص
    const pingUrl = `${serverUrl}/api/ping`;
    console.log("Checking connection via ping endpoint:", pingUrl);
    
    try {
      const pingResponse = await fetch(pingUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store",
          "Pragma": "no-cache",
          "X-Request-Time": Date.now().toString(),
          "X-Forwarded-For": getNextIp(),
          "X-Client-ID": "web-client"
        },
        mode: 'cors',
        credentials: 'omit',
        signal: createTimeoutSignal(15000) // 15 ثانية فقط للفحص السريع
      });
      
      if (pingResponse.ok) {
        // إذا نجح فحص ping، نعتبر الاتصال ناجحًا
        saveConnectionStatus(true);
        return { isConnected: true, message: "تم الاتصال بنجاح" };
      }
    } catch (pingError) {
      console.warn("فشل الاتصال عبر نقطة نهاية ping, سنحاول المسار الرئيسي:", pingError);
    }
    
    // إذا فشل ping، نستخدم /api/health
    const healthUrl = `${serverUrl}/api/health`;
    console.log("Checking connection via health endpoint:", healthUrl);
    
    const response = await fetchWithRetry(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Forwarded-For": getNextIp(),
        "X-Client-ID": "web-client",
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache",
        "X-Request-Time": Date.now().toString()
      },
      mode: 'cors',
      credentials: 'omit',
      signal: createTimeoutSignal(getConnectionTimeout())
    }, 3, 1000); // 3 محاولات فقط مع تأخير 1 ثانية

    if (!response.ok) {
      console.error("Connection failed with status:", response.status);
      return { isConnected: false, message: `فشل الاتصال: ${response.statusText}` };
    }

    const data = await response.json();
    console.log("Connection successful:", data);
    saveConnectionStatus(true);
    return { isConnected: true, message: "تم الاتصال بنجاح" };
  } catch (error: any) {
    console.error("Connection error:", error);
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
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Forwarded-For": ip || getNextIp(),
    "X-Render-Client-IP": ip || getNextIp(),
    "Origin": getAutomationServerUrl(),
    "Referer": getAutomationServerUrl(),
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
