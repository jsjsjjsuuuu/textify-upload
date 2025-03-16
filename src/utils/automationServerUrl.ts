
/**
 * إدارة عنوان URL الخاص بخادم الأتمتة
 */

// قم بتغيير هذا العنوان إلى عنوان تطبيقك على Render بعد النشر
// عنوان تطبيقك الجديد المنشور على Render
const CLOUD_AUTOMATION_SERVER = 'https://textify-upload.onrender.com';

// عنوان خادم الأتمتة المحلي - تحديث للمنفذ 10000
const LOCAL_AUTOMATION_SERVER = 'http://localhost:10000';

// تحديد ما إذا كان التطبيق يعمل في وضع الإنتاج
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

// تخزين حالة الاتصال
let lastConnectionStatus = {
  isConnected: false,
  lastChecked: 0,
  retryCount: 0
};

/**
 * تحديث حالة الاتصال
 */
export const updateConnectionStatus = (isConnected: boolean): void => {
  lastConnectionStatus = {
    isConnected,
    lastChecked: Date.now(),
    retryCount: isConnected ? 0 : lastConnectionStatus.retryCount + 1
  };
};

/**
 * الحصول على حالة الاتصال الأخيرة
 */
export const getLastConnectionStatus = () => {
  return { ...lastConnectionStatus };
};

/**
 * الحصول على عنوان URL الخاص بخادم الأتمتة بناءً على البيئة الحالية
 */
export const getAutomationServerUrl = (): string => {
  // التحقق من وجود تخطي في localStorage
  const overrideUrl = localStorage.getItem('automation_server_url');
  if (overrideUrl) {
    console.log("استخدام عنوان URL مخصص من localStorage:", overrideUrl);
    return overrideUrl;
  }
  
  // استخدام الخادم السحابي في الإنتاج، والمحلي في التطوير
  const serverUrl = isProduction ? CLOUD_AUTOMATION_SERVER : LOCAL_AUTOMATION_SERVER;
  console.log("استخدام عنوان خادم الأتمتة:", serverUrl, "isProduction:", isProduction);
  return serverUrl;
};

/**
 * تعيين عنوان URL مخصص لخادم الأتمتة (للاختبار أو التكوينات المخصصة)
 */
export const setCustomAutomationServerUrl = (url: string): void => {
  if (url && url.trim() !== '') {
    console.log("تعيين عنوان URL مخصص:", url);
    localStorage.setItem('automation_server_url', url.trim());
  } else {
    console.log("إزالة عنوان URL المخصص");
    localStorage.removeItem('automation_server_url');
  }
};

/**
 * إعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية
 */
export const resetAutomationServerUrl = (): void => {
  console.log("إعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية");
  localStorage.removeItem('automation_server_url');
};

/**
 * التحقق من صلاحية عنوان URL لخادم الأتمتة
 */
export const isValidServerUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};
