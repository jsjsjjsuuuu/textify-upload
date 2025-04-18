
// استرجاع عنوان URL لخادم الأتمتة
export function getAutomationServerUrl(): string {
  // محاولة استرجاع العنوان من التخزين المحلي
  const savedUrl = localStorage.getItem("automationServerUrl");
  // إرجاع العنوان المخزن أو القيمة الافتراضية
  return savedUrl || "https://automation-server.default.url";
}

// تعيين عنوان URL جديد لخادم الأتمتة
export function setAutomationServerUrl(url: string): boolean {
  try {
    // تخزين العنوان في التخزين المحلي
    localStorage.setItem("automationServerUrl", url);
    return true;
  } catch (error) {
    console.error("فشل في حفظ عنوان خادم الأتمتة:", error);
    return false;
  }
}

// عناوين IP الثابتة لـ Render (يُستخدم للاتصال بخادم الأتمتة)
export const RENDER_ALLOWED_IPS = [
  "3.21.137.128",
  "52.14.21.179",
  "18.191.64.174",
  "18.223.22.134",
  "18.224.195.202",
  "3.131.20.204",
  "3.129.252.131",
  "3.140.200.8"
];

// تخزين حالة آخر اتصال
let lastConnectionStatus = {
  isConnected: false,
  message: "",
  timestamp: 0,
  retryCount: 0
};

// التحقق من الاتصال بخادم الأتمتة
export async function checkConnection(): Promise<{ isConnected: boolean; message: string }> {
  try {
    const serverUrl = getAutomationServerUrl();
    console.log("التحقق من الاتصال بـ", serverUrl);
    
    // محاكاة الاتصال في بيئة المعاينة
    if (isPreviewEnvironment()) {
      console.log("بيئة معاينة: محاكاة نجاح الاتصال");
      lastConnectionStatus = {
        isConnected: true,
        message: "متصل (محاكاة)",
        timestamp: Date.now(),
        retryCount: 0
      };
      return { isConnected: true, message: "متصل (محاكاة)" };
    }
    
    // إرسال طلب اختبار الاتصال
    const response = await fetch(`${serverUrl}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Header': 'connection-test'
      },
      mode: 'cors',
      credentials: 'include',
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      lastConnectionStatus = {
        isConnected: true,
        message: data.message || "متصل",
        timestamp: Date.now(),
        retryCount: 0
      };
      return { isConnected: true, message: data.message || "متصل" };
    } else {
      const errorMsg = `فشل الاتصال: ${response.status} ${response.statusText}`;
      lastConnectionStatus = {
        ...lastConnectionStatus,
        isConnected: false,
        message: errorMsg,
        timestamp: Date.now(),
        retryCount: lastConnectionStatus.retryCount + 1
      };
      return { isConnected: false, message: errorMsg };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "خطأ غير معروف";
    lastConnectionStatus = {
      ...lastConnectionStatus,
      isConnected: false,
      message: errorMsg,
      timestamp: Date.now(),
      retryCount: lastConnectionStatus.retryCount + 1
    };
    return { isConnected: false, message: errorMsg };
  }
}

// الحصول على حالة آخر اتصال
export function getLastConnectionStatus(): typeof lastConnectionStatus {
  return { ...lastConnectionStatus };
}

// التحقق مما إذا كانت البيئة الحالية هي بيئة معاينة
export function isPreviewEnvironment(): boolean {
  // تحقق من القيم المعروفة لبيئة المعاينة
  const isPreview = 
    window.location.hostname.includes('preview') || 
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.endsWith('netlify.app') ||
    window.location.hostname.endsWith('vercel.app');
  
  return isPreview;
}
