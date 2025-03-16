
/**
 * إدارة عنوان URL الخاص بخادم الأتمتة
 */

// قم بتغيير هذا العنوان إلى عنوان تطبيقك على Render بعد النشر
// مثال: https://your-automation-app.onrender.com
const CLOUD_AUTOMATION_SERVER = 'https://your-automation-app.onrender.com';

// عنوان خادم الأتمتة المحلي
const LOCAL_AUTOMATION_SERVER = 'http://localhost:3001';

// تحديد ما إذا كان التطبيق يعمل في وضع الإنتاج
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

/**
 * الحصول على عنوان URL الخاص بخادم الأتمتة بناءً على البيئة الحالية
 */
export const getAutomationServerUrl = (): string => {
  // التحقق من وجود تخطي في localStorage
  const overrideUrl = localStorage.getItem('automation_server_url');
  if (overrideUrl) {
    return overrideUrl;
  }
  
  // استخدام الخادم السحابي في الإنتاج، والمحلي في التطوير
  return isProduction ? CLOUD_AUTOMATION_SERVER : LOCAL_AUTOMATION_SERVER;
};

/**
 * تعيين عنوان URL مخصص لخادم الأتمتة (للاختبار أو التكوينات المخصصة)
 */
export const setCustomAutomationServerUrl = (url: string): void => {
  if (url && url.trim() !== '') {
    localStorage.setItem('automation_server_url', url.trim());
  } else {
    localStorage.removeItem('automation_server_url');
  }
};

/**
 * إعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية
 */
export const resetAutomationServerUrl = (): void => {
  localStorage.removeItem('automation_server_url');
};
