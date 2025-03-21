
import { toast } from "@/hooks/use-toast";

export const SERVER_URL_KEY = "automationServerUrl";
export const CONNECTION_STATUS_KEY = "connectionStatus";

/**
 * الحصول على مهلة الاتصال
 */
export const getConnectionTimeout = () => {
  // زيادة المهلة الزمنية بشكل كبير لتجنب أخطاء المهلة المنتهية
  return isPreviewEnvironment() ? 60000 : 120000; // 1-2 دقائق بدلاً من ثواني
};

/**
 * الحصول على عنوان خادم التشغيل الآلي من الذاكرة المحلية
 */
export const getAutomationServerUrl = () => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return '';
  }
  return localStorage.getItem(SERVER_URL_KEY) || '';
};

/**
 * تعيين عنوان خادم التشغيل الآلي في الذاكرة المحلية
 */
export const setAutomationServerUrl = (url: string) => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return;
  }
  localStorage.setItem(SERVER_URL_KEY, url);
};

/**
 * إعادة تعيين عنوان خادم التشغيل الآلي إلى القيمة الافتراضية
 */
export const resetAutomationServerUrl = () => {
  const defaultUrl = "https://textify-upload.onrender.com";
  setAutomationServerUrl(defaultUrl);
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
 */
export const isPreviewEnvironment = () => {
  // فحص عنوان URL الحالي
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes("lovable.ai");
  }
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
    const url = `${serverUrl}/api/health`;
    console.log("Checking connection to:", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      mode: 'cors',
      credentials: 'include',
      // استخدام الإشارة بطريقة متوافقة مع الإصدارات القديمة
      signal: createTimeoutSignal(getConnectionTimeout())
    });

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
    timestamp: new Date().toISOString()
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
    return { isConnected: false, timestamp: null };
  }
  const status = localStorage.getItem(CONNECTION_STATUS_KEY);
  if (status) {
    try {
      return JSON.parse(status);
    } catch (e) {
      console.error("Error parsing connection status:", e);
      return { isConnected: false, timestamp: null };
    }
  }
  return { isConnected: false, timestamp: null };
};

export const RENDER_ALLOWED_IPS = [
  "34.173.249.155",
  "34.173.4.241",
  "34.175.83.23",
  "23.22.240.140",
  "23.22.240.141",
  "23.22.240.142",
  "23.22.240.143",
  "23.22.240.144",
  "23.22.240.145",
  "23.22.240.146",
  "23.22.240.147",
  "23.22.240.148",
  "23.22.240.149",
  "23.22.240.150",
  "23.22.240.151"
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
    "X-Client-ID": "web-client"
  };
};

/**
 * إنشاء إشارة مهلة متوافقة مع مختلف المتصفحات
 */
export const createTimeoutSignal = (ms: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

/**
 * وظيفة fetch مع إعادة المحاولة
 */
export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 8, retryDelayMs = 2000): Promise<Response> {
  let retries = 0;
  let lastError: Error = new Error("Unknown error");
  
  while(retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}/${maxRetries} for URL: ${url}`);
      
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
      
      // تخطي إعادة المحاولة لبعض الأخطاء
      if (lastError.message.includes('CORS') || lastError.message.includes('blocked by extension')) {
        console.error('CORS or extension blockage detected, retrying might not help:', lastError.message);
        throw lastError;
      }
      
      retries++;
      if (retries < maxRetries) {
        // زيادة فترة الانتظار مع كل محاولة فاشلة (backoff strategy)
        const delay = retryDelayMs * Math.pow(2, retries - 1);
        
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
export function createFetchOptions(method: string, body: any, headers: Record<string, string>): RequestInit {
  const options: RequestInit = {
    method,
    headers: {
      "Accept": "application/json",
      ...headers || {}
    },
    credentials: "include",
    mode: "cors",
    // تعيين مهلة أطول للطلبات
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
  // التحقق من آخر حالة اتصال إذا كانت حديثة (خلال الـ 5 دقائق الماضية)
  const status = getLastConnectionStatus();
  
  if (!forceCheck && status.timestamp) {
    const lastCheck = new Date(status.timestamp);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (lastCheck > fiveMinutesAgo) {
      console.log("Using cached connection status:", status.isConnected);
      return status.isConnected;
    }
  }
  
  // إجراء فحص جديد
  const result = await checkConnection();
  return result.isConnected;
};
