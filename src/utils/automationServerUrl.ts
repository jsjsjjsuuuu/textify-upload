
import { toast } from "sonner";

// تعريف متغير لتخزين عنوان URL لخادم الأتمتة
let automationServerUrl: string | null = null;

// تعريف متغير لتخزين مهلة الاتصال بالخادم (بالمللي ثانية)
let connectionTimeout: number = 30000; // 30 ثانية افتراضيًا

// تعريف قائمة عناوين IP المسموح بها لخادم Render
export const RENDER_ALLOWED_IPS: string[] = [
  "35.209.134.25",
  "35.233.208.195",
  "34.0.192.118",
  "34.106.60.116",
  "34.145.159.201",
  "35.236.41.75"
];

// دالة للحصول على عنوان URL لخادم الأتمتة من الذاكرة المحلية
export function getAutomationServerUrl(): string {
  if (automationServerUrl) {
    return automationServerUrl;
  }
  
  // إذا لم يكن موجودًا في المتغير، حاول جلبه من الذاكرة المحلية
  const storedUrl = localStorage.getItem('automation_server_url');
  
  if (storedUrl) {
    automationServerUrl = storedUrl;
    return storedUrl;
  }
  
  // إذا لم يتم العثور عليه في الذاكرة المحلية، استخدم عنوان URL الافتراضي
  const defaultUrl = "https://textify-upload.onrender.com";
  localStorage.setItem('automation_server_url', defaultUrl);
  automationServerUrl = defaultUrl;
  return defaultUrl;
}

// دالة لتعيين عنوان URL لخادم الأتمتة وتخزينه في الذاكرة المحلية
export function setAutomationServerUrl(url: string): void {
  automationServerUrl = url;
  localStorage.setItem('automation_server_url', url);
  console.log("تم تحديث عنوان خادم الأتمتة إلى:", url);
}

// دالة لإعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية
export function resetAutomationServerUrl(): string {
  const defaultUrl = "https://textify-upload.onrender.com";
  setAutomationServerUrl(defaultUrl);
  return defaultUrl;
}

// دالة للتحقق من صحة عنوان URL لخادم الأتمتة
export function isValidServerUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// تعريف واجهة لحالة الاتصال
export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: number;
  message: string;
  retryCount?: number; // إضافة خاصية retryCount
}

// متغير لتخزين آخر حالة اتصال
let lastConnectionStatus: ConnectionStatus = {
  isConnected: false,
  lastChecked: 0,
  message: "لم يتم التحقق من الاتصال بعد",
  retryCount: 0
};

// دالة للحصول على آخر حالة اتصال
export function getLastConnectionStatus(): ConnectionStatus {
  return lastConnectionStatus;
}

// دالة لتحديث حالة الاتصال
export function updateConnectionStatus(isConnected: boolean, message?: string): void {
  lastConnectionStatus = {
    isConnected,
    lastChecked: Date.now(),
    message: message || (isConnected ? "الخادم متصل ويعمل بشكل صحيح" : "فشل الاتصال بالخادم"),
    retryCount: isConnected ? 0 : (lastConnectionStatus.retryCount || 0) + 1
  };
}

// دالة للتحقق من حالة الاتصال بالخادم
export async function checkConnection(showToast = true): Promise<ConnectionStatus> {
  const serverUrl = getAutomationServerUrl();
  const timeout = getConnectionTimeout();

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      headers: createBaseHeaders(),
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
      const message = `فشل الاتصال بالخادم: ${response.status} ${response.statusText}`;
      updateConnectionStatus(false, message);
      if (showToast) {
        toast.error(message);
      }
      return lastConnectionStatus;
    }

    const data = await response.json();
    if (data.status === 'ok') {
      updateConnectionStatus(true);
      if (showToast) {
        toast.success("الخادم متصل ويعمل بشكل صحيح");
      }
      return lastConnectionStatus;
    } else {
      const message = `الخادم غير متصل: ${data.message || 'لا توجد رسالة'}`;
      updateConnectionStatus(false, message);
      if (showToast) {
        toast.error(message);
      }
      return lastConnectionStatus;
    }
  } catch (error: any) {
    clearTimeout(setTimeout(() => {}, 0)); // مسح أي مهلة معلقة
    let message = 'حدث خطأ أثناء الاتصال بالخادم';
    if (error.name === 'AbortError') {
      message = 'انتهت مهلة الاتصال بالخادم';
    } else if (error.message) {
      message = `فشل الاتصال بالخادم: ${error.message}`;
    }
    
    updateConnectionStatus(false, message);
    if (showToast) {
      toast.error(message);
    }
    return lastConnectionStatus;
  }
}

// دالة للتحقق من حالة الاتصال بشكل متزامن
export async function isConnected(showToast = true): Promise<boolean> {
  const status = await checkConnection(showToast);
  return status.isConnected;
}

// دالة لإنشاء خيارات Fetch مع تضمين بيانات الاعتماد
export function createFetchOptions(method: string, body: any): RequestInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  const options: RequestInit = {
    method: method,
    headers: headers,
    body: JSON.stringify(body),
    credentials: 'omit' // أو 'same-origin' أو 'include' حسب الحاجة
  };
  
  return options;
}

// دالة لتنفيذ طلب Fetch مع إعادة المحاولة
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      // إذا كانت الاستجابة ليست ناجحة ولكنها ليست خطأً فادحًا، يمكن إعادة المحاولة
      if (response.status !== 400 && response.status !== 401 && response.status !== 403) {
        attempt++;
        console.log(`Attempt ${attempt} failed with status ${response.status}, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        // إذا كان الخطأ فادحًا، لا تقم بإعادة المحاولة
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      attempt++;
      console.log(`Attempt ${attempt} failed with error ${error.message}, retrying in ${retryDelay}ms...`);
      if (attempt >= maxRetries) {
        throw error; // إذا تم الوصول إلى الحد الأقصى لعدد المحاولات، قم برمي الخطأ
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw new Error(`Max retries exceeded`);
}

// دالة للتحقق من بيئة المعاينة، الآن تعيد دائمًا false لإجبار استخدام التنفيذ الحقيقي
export function isPreviewEnvironment(): boolean {
  // إرجاع false دائمًا للتأكد من استخدام البيئة الحقيقية بغض النظر عن اسم النطاق
  console.log("فحص بيئة المعاينة - إرجاع false دائمًا لتفعيل وضع التنفيذ الفعلي.");
  return false;
}

// دالة للحصول على مهلة الاتصال الحالية
export function getConnectionTimeout(): number {
  return connectionTimeout;
}

// دالة لتعيين مهلة الاتصال
export function setConnectionTimeout(timeoutMs: number): void {
  connectionTimeout = timeoutMs;
  console.log(`تم تعيين مهلة الاتصال إلى ${timeoutMs} مللي ثانية`);
}

// دالة للحصول على عنوان IP التالي من القائمة بشكل دوري
let currentIpIndex = 0;
export function getNextIp(): string {
  const ip = RENDER_ALLOWED_IPS[currentIpIndex];
  currentIpIndex = (currentIpIndex + 1) % RENDER_ALLOWED_IPS.length;
  return ip;
}

// دالة لإنشاء رؤوس HTTP أساسية للطلبات
export function createBaseHeaders(ipAddress?: string): HeadersInit {
  const ip = ipAddress || getNextIp();
  
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Forwarded-For': ip,
    'X-Render-Client-IP': ip,
    'X-Client-Info': 'Textify Automation Client',
    'Origin': typeof window !== 'undefined' ? window.location.origin : '',
    'Referer': typeof window !== 'undefined' ? window.location.href : ''
  };
}

// دالة لإنشاء إشارة مهلة زمنية
export function createTimeoutSignal(timeout: number = connectionTimeout): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller.signal;
}
