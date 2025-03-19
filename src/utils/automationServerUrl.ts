// src/utils/automationServerUrl.ts

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
export function setLastConnectionStatus(status: { isConnected: boolean; lastAttempt: number; retryCount: number }): void {
  localStorage.setItem('lastConnectionStatus', JSON.stringify(status));
}

// دالة لاسترجاع حالة الاتصال الأخيرة
export function getLastConnectionStatus(): { isConnected: boolean; lastAttempt: number; retryCount: number } {
  const storedStatus = localStorage.getItem('lastConnectionStatus');
  if (storedStatus) {
    return JSON.parse(storedStatus);
  }
  return { isConnected: false, lastAttempt: 0, retryCount: 0 };
}
