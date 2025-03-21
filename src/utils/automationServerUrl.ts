
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
 * إعادة تعيين عنوان URL لخادم التشغيل الآلي إلى القيمة الافتراضية
 */
export const resetAutomationServerUrl = () => {
  const defaultUrl = "https://automation-server.onrender.com";
  setAutomationServerUrl(defaultUrl);
  return defaultUrl;
};

/**
 * التحقق من صحة URL الخادم
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
 * فحص ما إذا كنا في بيئة المعاينة (Lovable)
 */
export const isPreviewEnvironment = (): boolean => {
  return isPreview();
};

/**
 * الحصول على مهلة الاتصال
 * تم زيادة المهلة لتجنب مشكلة signal timed out
 */
export const getConnectionTimeout = (): number => {
  // مهلة أطول لتجنب انتهاء المهلة الزمنية
  return isPreviewEnvironment() ? 15000 : 30000;
};

/**
 * تحديث حالة الاتصال
 */
export const updateConnectionStatus = (isConnected: boolean, lastUsedIp?: string) => {
  saveConnectionStatus(isConnected, isConnected ? undefined : "حدث خطأ في الاتصال", lastUsedIp);
};

/**
 * التحقق من حالة الاتصال الحالية
 */
export const isConnected = async (silent: boolean = false): Promise<boolean> => {
  // في بيئة المعاينة، دائماً نعتبر الاتصال ناجح
  if (isPreviewEnvironment()) {
    return true;
  }
  
  // التحقق من آخر حالة معروفة
  const lastStatus = getLastConnectionStatus();
  
  // إذا كان الاتصال ناجح في آخر 5 دقائق، نعتبره لا يزال متصل
  if (lastStatus.isConnected && lastStatus.timestamp) {
    const lastTimestamp = new Date(lastStatus.timestamp).getTime();
    const now = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - lastTimestamp < fiveMinutes) {
      return true;
    }
  }
  
  // محاولة التحقق من الاتصال مباشرة
  try {
    const result = await checkConnection();
    return result.isConnected;
  } catch (error) {
    if (!silent) {
      console.error("خطأ في التحقق من الاتصال:", error);
    }
    return false;
  }
};

/**
 * إنشاء رؤوس طلب HTTP أساسية
 */
export const createBaseHeaders = (ipAddress?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Client-Version": "1.0.0"
  };
  
  if (ipAddress) {
    headers["X-Forwarded-For"] = ipAddress;
    headers["X-Real-IP"] = ipAddress;
  }
  
  return headers;
};

/**
 * الحصول على عنوان IP التالي من قائمة العناوين المسموح بها
 */
export const getNextIp = (): string => {
  const lastStatus = getLastConnectionStatus();
  const retryCount = lastStatus.retryCount || 0;
  const index = retryCount % RENDER_ALLOWED_IPS.length;
  return RENDER_ALLOWED_IPS[index];
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
const saveConnectionStatus = (isConnected: boolean, message?: string, lastUsedIp?: string) => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available.');
    return;
  }
  const status = {
    isConnected,
    message,
    lastUsedIp,
    timestamp: new Date().toISOString(),
    retryCount: getLastConnectionStatus().retryCount + 1
  };
  localStorage.setItem(CONNECTION_STATUS_KEY, JSON.stringify(status));
};

/**
 * استرجاع آخر حالة اتصال
 */
export const getLastConnectionStatus = (): { isConnected: boolean; message?: string; timestamp?: string; retryCount: number; lastUsedIp?: string } => {
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
 * وظيفة fetch مع إعادة المحاولة وزيادة المهلة الزمنية
 */
export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 5, retryDelayMs = 1000): Promise<Response> {
  let retries = 0;
  let lastError: Error = new Error("Unknown error");

  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}/${maxRetries} for URL: ${url}`);
      
      // نسخة من خيارات الطلب مع إمكانية تعديلها
      const optionsWithSignal = { ...options };
      
      // إذا لم يتم تحديد مهلة زمنية للطلب، قم بتعيينها
      if (!optionsWithSignal.signal) {
        // زيادة المهلة مع كل محاولة
        const timeout = getConnectionTimeout() * (retries + 1);
        optionsWithSignal.signal = AbortSignal.timeout(timeout);
        console.log(`Set timeout to ${timeout}ms for attempt ${retries + 1}`);
      }
      
      const response = await fetch(url, optionsWithSignal);
      
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
      
      // التحقق من نوع الخطأ
      const errorMsg = lastError.message || '';
      
      // تعامل خاص مع أخطاء المهلة الزمنية
      if (errorMsg.includes('timed out') || errorMsg.includes('TimeoutError') || errorMsg.includes('AbortError')) {
        console.warn('Request timed out, increasing timeout for next attempt');
        // سنحاول مرة أخرى مع زيادة المهلة في المحاولة التالية
      }
      // تخطي إعادة المحاولة لبعض الأخطاء
      else if (errorMsg.includes('CORS') || errorMsg.includes('blocked by extension')) {
        console.error('CORS or extension blockage detected, retrying might not help:', lastError.message);
        // سنحاول على أي حال، ولكن مع تأخير أطول
      }
      
      retries++;
      if (retries < maxRetries) {
        // زيادة فترة الانتظار مع كل محاولة فاشلة (backoff strategy) - مع زيادة تصاعدية
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
    // تعيين مهلة أطول للطلبات لتجنب مشكلة signal timed out
    signal: AbortSignal.timeout(getConnectionTimeout())
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
}
