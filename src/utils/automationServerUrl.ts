
/**
 * وظائف للتعامل مع عنوان URL لخادم الأتمتة
 */

// قائمة عناوين IP المسموح بها من خادم Render
export const RENDER_ALLOWED_IPS = [
  '44.226.145.213',
  '54.187.200.255',
  '34.213.214.55',
  '35.164.95.156',
  '44.230.95.183',
  '44.229.200.200',
  // عناوين IP إضافية للتناوب
  '44.242.143.234',
  '54.244.142.219',
  '44.241.75.25',
  '44.236.246.209',
  '52.27.36.56'
];

// حالة الاتصال الأخيرة
interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: number;
  retryCount: number;
  message?: string;
}

// الحالة الافتراضية للاتصال
const lastConnectionStatus: ConnectionStatus = {
  isConnected: false,
  lastChecked: 0,
  retryCount: 0
};

// الحصول على عنوان URL الافتراضي للخادم
const DEFAULT_SERVER_URL = 'https://automation-server-api.onrender.com';

/**
 * الحصول على عنوان URL لخادم الأتمتة من التخزين المحلي أو استخدام القيمة الافتراضية
 */
export const getAutomationServerUrl = (): string => {
  return localStorage.getItem('automation_server_url') || DEFAULT_SERVER_URL;
};

/**
 * تعيين عنوان URL لخادم الأتمتة في التخزين المحلي
 */
export const setAutomationServerUrl = (url: string): void => {
  if (!url) {
    localStorage.removeItem('automation_server_url');
    return;
  }
  
  // تأكد من أن العنوان صحيح (بدون شرطة مائلة في النهاية)
  const formattedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  localStorage.setItem('automation_server_url', formattedUrl);
};

/**
 * التحقق مما إذا كان الخادم يعمل في بيئة المعاينة
 */
export const isPreviewEnvironment = (): boolean => {
  return window.location.hostname.includes('preview') || 
         window.location.hostname.includes('localhost');
};

/**
 * فحص الاتصال بالخادم واختبار الحالة
 */
export const checkConnection = async (): Promise<ConnectionStatus> => {
  try {
    const serverUrl = getAutomationServerUrl();
    if (!serverUrl) {
      throw new Error("لم يتم تعيين عنوان URL لخادم الأتمتة");
    }

    // إرسال طلب فحص الحالة
    const response = await fetch(`${serverUrl}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Render-Client-IP': RENDER_ALLOWED_IPS[0]
      }
    });

    // التحقق من نجاح الطلب
    if (response.ok) {
      const result = await response.json();
      
      // تحديث حالة الاتصال الأخيرة
      lastConnectionStatus.isConnected = true;
      lastConnectionStatus.lastChecked = Date.now();
      lastConnectionStatus.retryCount = 0;
      lastConnectionStatus.message = "تم الاتصال بنجاح";
      
      return { ...lastConnectionStatus };
    } else {
      // فشل الاستجابة
      const errorMessage = `فشل الاتصال: ${response.status} ${response.statusText}`;
      
      // تحديث حالة الاتصال الأخيرة
      lastConnectionStatus.isConnected = false;
      lastConnectionStatus.lastChecked = Date.now();
      lastConnectionStatus.retryCount += 1;
      lastConnectionStatus.message = errorMessage;
      
      return { ...lastConnectionStatus };
    }
  } catch (error) {
    // خطأ في الاتصال
    const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف في الاتصال";
    
    // تحديث حالة الاتصال الأخيرة
    lastConnectionStatus.isConnected = false;
    lastConnectionStatus.lastChecked = Date.now();
    lastConnectionStatus.retryCount += 1;
    lastConnectionStatus.message = errorMessage;
    
    return { ...lastConnectionStatus };
  }
};

/**
 * الحصول على حالة الاتصال الأخيرة دون إرسال طلب جديد
 */
export const getLastConnectionStatus = (): ConnectionStatus => {
  return { ...lastConnectionStatus };
};
