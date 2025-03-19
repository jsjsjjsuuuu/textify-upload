
// src/utils/automationServerUrl.ts

// قائمة بعناوين IP المسموح بها لخادم Render
export const RENDER_ALLOWED_IPS = [
  "34.106.88.0",
  "34.94.46.128",
  "34.82.138.64",
  "34.106.239.128",
  "34.106.102.192",
  "34.106.40.64",
  "34.82.189.128",
  "35.188.224.192"
];

// متغير مؤقت لتسجيل آخر عنوان IP تم استخدامه
let lastUsedIpIndex = 0;

// دالة للحصول على عنوان IP التالي في القائمة (للتناوب)
export function getNextIp(): string {
  const ip = RENDER_ALLOWED_IPS[lastUsedIpIndex];
  lastUsedIpIndex = (lastUsedIpIndex + 1) % RENDER_ALLOWED_IPS.length;
  return ip;
}

// وقت مهلة الاتصال الافتراضي بالثواني
const DEFAULT_CONNECTION_TIMEOUT = 15000; // 15 ثانية
let connectionTimeout = DEFAULT_CONNECTION_TIMEOUT;

// دالة لضبط وقت مهلة الاتصال
export function setConnectionTimeout(timeout: number): void {
  connectionTimeout = timeout;
}

// دالة للحصول على وقت مهلة الاتصال الحالي
export function getConnectionTimeout(): number {
  return connectionTimeout;
}

// دالة للتحقق من صحة عنوان URL
export function isValidServerUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// دالة لحفظ عنوان URL لخادم الأتمتة في التخزين المحلي
export function setAutomationServerUrl(url: string): void {
  localStorage.setItem('automationServerUrl', url);
}

// دالة لاسترجاع عنوان URL لخادم الأتمتة من التخزين المحلي
export function getAutomationServerUrl(): string {
  // محاولة استخدام متغير البيئة إذا كان متاحًا
  if (typeof process !== 'undefined' && process.env && process.env.AUTOMATION_SERVER_URL) {
    return process.env.AUTOMATION_SERVER_URL;
  }
  
  // استخدام التخزين المحلي كخيار احتياطي
  const savedUrl = localStorage.getItem('automationServerUrl');
  if (savedUrl) {
    return savedUrl;
  }
  
  // استخدام القيمة الافتراضية
  return window.location.origin;
}

// دالة لإعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية
export function resetAutomationServerUrl(): void {
  localStorage.removeItem('automationServerUrl');
}

// دالة للتحقق من حالة الاتصال بالخادم
export async function isConnected(showToasts: boolean = false): Promise<boolean> {
  const url = getAutomationServerUrl();
  try {
    const response = await fetch(`${url}/api/status`);
    if (!response.ok) {
      console.error(`فشل الاتصال بالخادم: ${response.status} ${response.statusText}`);
      return false;
    }
    const data = await response.json();
    console.log("حالة الخادم:", data);
    return true;
  } catch (error) {
    console.error("خطأ في الاتصال بالخادم:", error);
    return false;
  }
}

// واجهة لحالة الاتصال الأخيرة
export interface ConnectionStatus {
  isConnected: boolean;
  lastAttempt: number;
  retryCount: number;
  lastChecked: number;
  lastUsedIp?: string;
}

// دالة لتحديث حالة الاتصال
export function updateConnectionStatus(isConnected: boolean, lastUsedIp?: string): void {
  const currentStatus = getLastConnectionStatus();
  const updatedStatus: ConnectionStatus = {
    isConnected,
    lastAttempt: currentStatus.lastAttempt,
    retryCount: isConnected ? 0 : currentStatus.retryCount + 1,
    lastChecked: Date.now(),
    lastUsedIp: lastUsedIp || currentStatus.lastUsedIp
  };
  
  setLastConnectionStatus(updatedStatus);
}

// دالة جديدة للتحقق من الاتصال وإرجاع رسالة مفصلة
export async function checkConnection(): Promise<{ isConnected: boolean; message: string }> {
  const url = getAutomationServerUrl();
  try {
    const response = await fetch(`${url}/api/status`);
    if (!response.ok) {
      return {
        isConnected: false,
        message: `فشل الاتصال بالخادم: ${response.status} ${response.statusText}`
      };
    }
    const data = await response.json();
    if (!data.status || data.status !== 'ok') {
      return {
        isConnected: false,
        message: `الخادم غير مستجيب: ${JSON.stringify(data)}`
      };
    }
    return {
      isConnected: true,
      message: 'الخادم متصل ومستجيب'
    };
  } catch (error) {
    return {
      isConnected: false,
      message: `خطأ في الاتصال بالخادم: ${error}`
    };
  }
}

// دالة لتخزين حالة الاتصال الأخيرة
export function setLastConnectionStatus(status: ConnectionStatus): void {
  localStorage.setItem('lastConnectionStatus', JSON.stringify(status));
}

// دالة لاسترجاع حالة الاتصال الأخيرة
export function getLastConnectionStatus(): ConnectionStatus {
  const storedStatus = localStorage.getItem('lastConnectionStatus');
  if (storedStatus) {
    try {
      return JSON.parse(storedStatus) as ConnectionStatus;
    } catch (e) {
      console.error("خطأ في تحليل بيانات حالة الاتصال:", e);
    }
  }
  return { 
    isConnected: false, 
    lastAttempt: 0, 
    retryCount: 0, 
    lastChecked: 0 
  };
}

// دالة لإنشاء رؤوس الطلب الأساسية
export function createBaseHeaders(clientIp?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // إضافة رؤوس IP إذا كانت متوفرة
  if (clientIp) {
    headers['X-Forwarded-For'] = clientIp;
    headers['X-Render-Client-IP'] = clientIp;
  }
  
  // إضافة رؤوس أخرى مهمة
  const serverUrl = getAutomationServerUrl();
  headers['Origin'] = serverUrl;
  headers['Referer'] = serverUrl;
  
  return headers;
}

// دالة لإنشاء خيارات الطلب (fetch options)
export function createFetchOptions(
  method: string,
  body?: any,
  additionalHeaders?: Record<string, string>,
  timeout: number = getConnectionTimeout()
): RequestInit {
  const headers = {
    ...createBaseHeaders(getNextIp()),
    ...additionalHeaders
  };
  
  const options: RequestInit = {
    method,
    headers,
    mode: 'cors',
    credentials: 'omit',
  };
  
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  return options;
}

// دالة لتنفيذ طلب مع محاولات إعادة تلقائية
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Response> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      // إضافة رقم المحاولة إلى الرؤوس لتتبع المحاولات
      if (retries > 0 && options.headers) {
        const headers = options.headers as Record<string, string>;
        headers['X-Retry-Count'] = retries.toString();
        
        // استخدام عنوان IP مختلف في كل محاولة
        const newIp = getNextIp();
        headers['X-Forwarded-For'] = newIp;
        headers['X-Render-Client-IP'] = newIp;
      }
      
      // تحديد وقت المهلة
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), getConnectionTimeout());
      
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`فشل في المحاولة ${retries + 1}/${maxRetries}:`, error);
      retries++;
      
      if (retries < maxRetries) {
        // انتظار قبل إعادة المحاولة مع زيادة الوقت بشكل تصاعدي
        const delay = initialDelay * Math.pow(2, retries - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
  throw lastError || new Error("فشلت جميع محاولات الاتصال");
}
