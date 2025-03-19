
/**
 * إدارة عنوان URL لخادم الأتمتة
 */
import { ConnectionStatus } from "./automation/types";

// ثوابت لعناوين URL للخادم
const LOCAL_SERVER_URL = 'http://localhost:10000';
const RENDER_SERVER_URL = 'https://textify-upload.onrender.com';

// ثوابت للتخزين المحلي
const SERVER_URL_KEY = 'automation_server_url';
const CONNECTION_STATUS_KEY = 'automation_server_connection_status';

// عناوين IP المسموح بها للوصول إلى Render
export const RENDER_ALLOWED_IPS = [
  '44.226.145.213',
  '54.187.200.255',
  '34.213.214.55',
  '35.164.95.156',
  '44.230.95.183',
  '44.229.200.200'
];

// الحصول على عنوان URL لخادم الأتمتة
export function getAutomationServerUrl(): string {
  try {
    // التحقق من وجود قيمة مخزنة في localStorage
    const storedUrl = localStorage.getItem(SERVER_URL_KEY);
    
    if (storedUrl) {
      console.log("استخدام عنوان خادم الأتمتة المخزن:", storedUrl);
      return storedUrl;
    }
    
    // محاولة الكشف عن بيئة التطوير مقابل الإنتاج
    const isProduction = 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.includes('192.168.') &&
      !window.location.hostname.includes('lovable.app');
    
    // استخدام عنوان مختلف بناءً على البيئة
    const defaultUrl = isProduction ? RENDER_SERVER_URL : LOCAL_SERVER_URL;
    console.log("استخدام عنوان خادم الأتمتة:", defaultUrl, "isProduction:", isProduction);
    
    // تخزين العنوان الافتراضي
    localStorage.setItem(SERVER_URL_KEY, defaultUrl);
    
    return defaultUrl;
  } catch (error) {
    console.error("خطأ في الحصول على عنوان خادم الأتمتة:", error);
    return RENDER_SERVER_URL; // العودة إلى القيمة الافتراضية في حالة حدوث خطأ
  }
}

// تعيين عنوان URL مخصص لخادم الأتمتة
export function setAutomationServerUrl(url: string): boolean {
  try {
    if (!url || url.trim() === '') {
      throw new Error("عنوان URL غير صالح");
    }
    
    // التأكد من أن العنوان يبدأ بـ http:// أو https://
    if (!url.match(/^https?:\/\//)) {
      url = `http://${url}`;
    }
    
    // محاولة إنشاء كائن URL للتحقق من الصلاحية
    new URL(url);
    
    console.log("تعيين عنوان خادم الأتمتة:", url);
    localStorage.setItem(SERVER_URL_KEY, url);
    
    // إعادة تعيين حالة الاتصال عند تغيير العنوان
    updateConnectionStatus(false);
    
    return true;
  } catch (error) {
    console.error("خطأ في تعيين عنوان خادم الأتمتة:", error);
    return false;
  }
}

// إعادة ضبط عنوان URL إلى القيمة الافتراضية
export function resetAutomationServerUrl(): void {
  try {
    localStorage.removeItem(SERVER_URL_KEY);
    console.log("تمت إعادة تعيين عنوان خادم الأتمتة إلى القيمة الافتراضية");
    
    // إعادة تعيين حالة الاتصال
    updateConnectionStatus(false);
  } catch (error) {
    console.error("خطأ في إعادة تعيين عنوان خادم الأتمتة:", error);
  }
}

// تحديث حالة الاتصال بالخادم
export function updateConnectionStatus(isConnected: boolean, lastUsedIp: string = ''): void {
  try {
    // الحصول على الحالة الحالية
    const currentStatus = getLastConnectionStatus();
    
    // تحديث الحالة
    const updatedStatus: ConnectionStatus = {
      isConnected,
      retryCount: isConnected ? 0 : currentStatus.retryCount + 1,
      lastChecked: Date.now(),
      lastUsedIp: lastUsedIp || currentStatus.lastUsedIp
    };
    
    console.log("تحديث حالة الاتصال:", updatedStatus);
    
    // حفظ الحالة الجديدة
    localStorage.setItem(CONNECTION_STATUS_KEY, JSON.stringify(updatedStatus));
  } catch (error) {
    console.error("خطأ في تحديث حالة الاتصال:", error);
  }
}

// الحصول على آخر حالة اتصال بالخادم
export function getLastConnectionStatus(): ConnectionStatus {
  try {
    const storedStatus = localStorage.getItem(CONNECTION_STATUS_KEY);
    
    if (storedStatus) {
      return JSON.parse(storedStatus);
    }
    
    // إنشاء حالة افتراضية
    return {
      isConnected: false,
      retryCount: 0,
      lastChecked: 0,
      lastUsedIp: RENDER_ALLOWED_IPS[0]
    };
  } catch (error) {
    console.error("خطأ في الحصول على حالة الاتصال:", error);
    
    // إرجاع حالة افتراضية في حالة حدوث خطأ
    return {
      isConnected: false,
      retryCount: 0,
      lastChecked: 0,
      lastUsedIp: RENDER_ALLOWED_IPS[0]
    };
  }
}

// التحقق من حالة الاتصال بالخادم
export async function isConnected(forceCheck: boolean = false): Promise<boolean> {
  try {
    // الحصول على حالة الاتصال الحالية
    const connectionStatus = getLastConnectionStatus();
    
    // التحقق مما إذا كان الفحص غير ضروري (إذا كان آخر فحص حديثًا وناجحًا)
    const lastCheckAge = Date.now() - connectionStatus.lastChecked;
    if (!forceCheck && connectionStatus.isConnected && lastCheckAge < 60000) {
      console.log("استخدام حالة الاتصال المخزنة:", connectionStatus.isConnected);
      return connectionStatus.isConnected;
    }
    
    // الحصول على عنوان خادم الأتمتة
    const serverUrl = getAutomationServerUrl();
    
    // محاولة الاتصال بكل عنوان IP المسموح به
    for (const ip of RENDER_ALLOWED_IPS) {
      console.log("جاري فحص الاتصال بـ:", serverUrl, "باستخدام IP:", ip);
      
      try {
        // تكوين الطلب
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${serverUrl}/api/status`, {
          method: 'GET',
          headers: createBaseHeaders(ip),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // التحقق من نجاح الاستجابة
        if (response.ok) {
          console.log("تم الاتصال بنجاح باستخدام IP:", ip);
          updateConnectionStatus(true, ip);
          return true;
        }
      } catch (error) {
        console.warn("فشل المحاولة باستخدام IP:", ip, error);
      }
    }
    
    // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
    console.error("فشل الاتصال بخادم Render بعد تجربة جميع عناوين IP المتاحة");
    updateConnectionStatus(false);
    
    return false;
  } catch (error) {
    console.error("خطأ في التحقق من حالة الاتصال:", error);
    updateConnectionStatus(false);
    
    return false;
  }
}

// إنشاء رؤوس أساسية للطلبات
export function createBaseHeaders(ipAddress: string = ''): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  
  if (ipAddress) {
    headers['X-Forwarded-For'] = ipAddress;
    headers['X-Render-Client-IP'] = ipAddress;
  }
  
  return headers;
}

// الحصول على عنوان IP التالي للاستخدام في طلبات Render
export function getNextIp(): string {
  const connectionStatus = getLastConnectionStatus();
  
  // العثور على مؤشر العنوان الحالي
  let currentIndex = RENDER_ALLOWED_IPS.indexOf(connectionStatus.lastUsedIp);
  
  // إذا لم يتم العثور على العنوان الحالي أو كان آخر عنوان في القائمة
  if (currentIndex === -1 || currentIndex === RENDER_ALLOWED_IPS.length - 1) {
    currentIndex = 0;
  } else {
    currentIndex++;
  }
  
  return RENDER_ALLOWED_IPS[currentIndex];
}

// إنشاء خيارات الطلب مع رؤوس مخصصة
export function createFetchOptions(
  method: string = 'GET',
  body: any = null,
  additionalHeaders: HeadersInit = {}
): RequestInit {
  const ipAddress = getNextIp();
  const baseHeaders = createBaseHeaders(ipAddress);
  
  const options: RequestInit = {
    method,
    headers: {
      ...baseHeaders,
      ...additionalHeaders
    },
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  return options;
}

// الحصول على مهلة اتصال بناءً على عدد المحاولات
export function getConnectionTimeout(retryCount: number = 0): number {
  // زيادة المهلة مع زيادة عدد المحاولات
  return Math.min(3000 + (retryCount * 1000), 10000);
}

// تنفيذ طلب مع إعادة المحاولة
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  // التحقق من الحالة الحالية
  const connectionStatus = getLastConnectionStatus();
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // تكوين خيارات الطلب مع عنوان IP جديد في كل محاولة
      const ipAddress = getNextIp();
      const optionsWithHeaders = {
        ...options,
        headers: {
          ...options.headers,
          'X-Forwarded-For': ipAddress,
          'X-Render-Client-IP': ipAddress,
          'X-Retry-Count': attempt.toString()
        }
      };
      
      // إعداد مهلة للطلب
      const controller = new AbortController();
      const timeout = getConnectionTimeout(connectionStatus.retryCount + attempt);
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // تنفيذ الطلب
      const response = await fetch(url, {
        ...optionsWithHeaders,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // التحقق من نجاح الاستجابة
      if (response.ok) {
        // تحديث حالة الاتصال
        updateConnectionStatus(true, ipAddress);
        return response;
      }
      
      // إذا كان الخطأ هو 403 (Forbidden)، فقد يكون بسبب حظر عنوان IP
      if (response.status === 403) {
        console.warn(`المحاولة ${attempt + 1}/${maxRetries}: عنوان IP ${ipAddress} محظور (403)`);
        continue;
      }
      
      // إذا كان الخطأ هو 429 (Too Many Requests)، الانتظار قبل المحاولة التالية
      if (response.status === 429) {
        console.warn(`المحاولة ${attempt + 1}/${maxRetries}: الكثير من الطلبات (429). الانتظار قبل المحاولة التالية.`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      // رمي خطأ للاستجابات غير الناجحة
      throw new Error(`استجابة HTTP غير ناجحة: ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`المحاولة ${attempt + 1}/${maxRetries} فشلت:`, lastError.message);
      
      // الانتظار قبل المحاولة التالية
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
  const errorMessage = lastError ? lastError.message : "فشلت جميع محاولات الاتصال";
  console.error(`فشلت جميع المحاولات (${maxRetries}):`, errorMessage);
  
  // تحديث حالة الاتصال
  updateConnectionStatus(false);
  
  throw new Error(`تعذر الاتصال بالخادم بعد ${maxRetries} محاولات: ${errorMessage}`);
}
