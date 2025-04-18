
/**
 * وظائف للتعامل مع عنوان URL لخادم الأتمتة
 */

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
