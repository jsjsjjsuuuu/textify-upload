import { toast } from "sonner";

// تعريف متغير لتخزين عنوان URL لخادم الأتمتة
let automationServerUrl: string | null = null;

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
interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: number;
  message: string;
}

// متغير لتخزين آخر حالة اتصال
let lastConnectionStatus: ConnectionStatus = {
  isConnected: false,
  lastChecked: 0,
  message: "لم يتم التحقق من الاتصال بعد"
};

// دالة للحصول على آخر حالة اتصال
export function getLastConnectionStatus(): ConnectionStatus {
  return lastConnectionStatus;
}

// دالة للتحقق من حالة الاتصال بالخادم
export async function checkConnection(showToast = true): Promise<ConnectionStatus> {
  const serverUrl = getAutomationServerUrl();
  const timeout = 5000; // مهلة 5 ثوانٍ

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
      const message = `فشل الاتصال بالخادم: ${response.status} ${response.statusText}`;
      lastConnectionStatus = {
        isConnected: false,
        lastChecked: Date.now(),
        message: message
      };
      if (showToast) {
        toast.error(message);
      }
      return lastConnectionStatus;
    }

    const data = await response.json();
    if (data.status === 'ok') {
      lastConnectionStatus = {
        isConnected: true,
        lastChecked: Date.now(),
        message: "الخادم متصل ويعمل بشكل صحيح"
      };
      if (showToast) {
        toast.success("الخادم متصل ويعمل بشكل صحيح");
      }
      return lastConnectionStatus;
    } else {
      const message = `الخادم غير متصل: ${data.message || 'لا توجد رسالة'}`;
      lastConnectionStatus = {
        isConnected: false,
        lastChecked: Date.now(),
        message: message
      };
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
    
    lastConnectionStatus = {
      isConnected: false,
      lastChecked: Date.now(),
      message: message
    };
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
