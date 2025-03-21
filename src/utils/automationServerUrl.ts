import { isPreview } from "./automation";

const SERVER_URL_KEY = "automationServerUrl";
const CONNECTION_STATUS_KEY = "lastConnectionStatus";

/**
 * الحصول على عنوان URL لخادم التشغيل الآلي من التخزين المحلي
 */
export const getAutomationServerUrl = (): string => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return "";
  }
  return localStorage.getItem(SERVER_URL_KEY) || "";
};

/**
 * تعيين عنوان URL لخادم التشغيل الآلي في التخزين المحلي
 */
export const setAutomationServerUrl = (url: string) => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return;
  }
  localStorage.setItem(SERVER_URL_KEY, url);
};

/**
 * فحص ما إذا كنا في بيئة المعاينة (Lovable)
 */
export const isPreviewEnvironment = (): boolean => {
  return isPreview();
};

/**
 * الحصول على مهلة الاتصال
 */
export const getConnectionTimeout = (): number => {
  // مهلة أقصر في بيئة المعاينة
  return isPreviewEnvironment() ? 5000 : 10000;
};

/**
 * فحص الاتصال بخادم التشغيل الآلي
 */
export const checkConnection = async (): Promise<{ isConnected: boolean; message?: string }> => {
  const serverUrl = getAutomationServerUrl();
  if (!serverUrl) {
    console.warn("Automation server URL is not set.");
    return { isConnected: false, message: "لم يتم تعيين عنوان URL للخادم." };
  }

  try {
    const url = `${serverUrl}/api/health`;
    console.log("Checking connection to:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      mode: 'cors',
      credentials: 'include',
      signal: AbortSignal.timeout(getConnectionTimeout())
    });

    if (!response.ok) {
      const message = `فشل الاتصال: ${response.status} - ${response.statusText}`;
      console.error(message);
      saveConnectionStatus(false, message);
      return { isConnected: false, message };
    }

    const data = await response.json();
    console.log("Connection successful:", data);
    saveConnectionStatus(true);
    return { isConnected: true };
  } catch (error: any) {
    const message = `حدث خطأ أثناء الاتصال: ${error.message || error}`;
    console.error(message);
    saveConnectionStatus(false, message);
    return { isConnected: false, message };
  }
};

/**
 * حفظ حالة الاتصال في التخزين المحلي
 */
const saveConnectionStatus = (isConnected: boolean, message?: string) => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return;
  }
  const status = {
    isConnected,
    message,
    timestamp: new Date().toISOString(),
    retryCount: getLastConnectionStatus().retryCount + 1
  };
  localStorage.setItem(CONNECTION_STATUS_KEY, JSON.stringify(status));
};

/**
 * استرجاع آخر حالة اتصال
 */
export const getLastConnectionStatus = (): { isConnected: boolean; message?: string; timestamp?: string; retryCount: number } => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return { isConnected: false, retryCount: 0 };
  }
  const storedStatus = localStorage.getItem(CONNECTION_STATUS_KEY);
  if (storedStatus) {
    try {
      return JSON.parse(storedStatus);
    } catch (error) {
      console.error("Failed to parse connection status from localStorage:", error);
      return { isConnected: false, retryCount: 0 };
    }
  }
  return { isConnected: false, retryCount: 0 };
};

/**
 * عناوين IP المسموح بها لخادم Render
 */
export const RENDER_ALLOWED_IPS = [
  "34.239.24.185",
  "3.210.61.107",
  "3.214.130.234",
  "52.20.186.181",
  "3.225.209.53",
  "54.88.118.94",
  "54.146.141.145",
  "34.230.120.140"
];

/**
 * وظيفة fetch مع إعادة المحاولة
 */
export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, retryDelayMs = 500): Promise<Response> {
  let retries = 0;
  let lastError: Error = new Error("Unknown error");

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}/${maxRetries} for URL: ${url}`);
      const response = await fetch(url, options);
      
      if (!response.ok) {
        // التعامل مع الاستجابة غير الناجحة، وإعادة المحاولة للأخطاء التي يمكن إصلاحها
        if (response.status >= 500 || response.status === 429) {
          // الأخطاء من جانب الخادم أو تجاوز عدد الطلبات، حاول مرة أخرى
          const error = new Error(`HTTP error! status: ${response.status}`);
          console.warn(`Request failed with status ${response.status}, retrying...`, error);
          retries++;
          await new Promise(resolve => setTimeout(resolve, retryDelayMs * retries));
          continue;
        }
        
        // أنواع أخرى من الأخطاء، لا تحاول مرة أخرى
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
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
        await new Promise(resolve => setTimeout(resolve, delay));
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
export function createFetchOptions(method: string, body?: any, headers?: HeadersInit): RequestInit {
  const options: RequestInit = {
    method,
    headers: {
      "Accept": "application/json",
      ...(headers || {})
    },
    credentials: "include",
    mode: "cors",
    // تعيين مهلة قصيرة للطلبات لتجنب الانتظار لفترة طويلة
    signal: AbortSignal.timeout(getConnectionTimeout())
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
}
