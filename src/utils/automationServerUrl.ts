
/**
 * إدارة عنوان URL الخاص بخادم الأتمتة
 */

// قائمة عناوين IP الثابتة المسموح بها من Render
export const RENDER_ALLOWED_IPS = [
  '44.226.145.213',
  '54.187.200.255',
  '34.213.214.55',
  '35.164.95.156',
  '44.230.95.183',
  '44.229.200.200'
];

// عنوان تطبيقك على Render 
const CLOUD_AUTOMATION_SERVER = 'https://textify-upload.onrender.com';

// عنوان خادم الأتمتة المحلي - تحديث للمنفذ 10000
const LOCAL_AUTOMATION_SERVER = 'http://localhost:10000';

// تحديد ما إذا كان التطبيق يعمل في وضع الإنتاج
// تم تعديله للاتصال بخادم Render دائماً
const isProduction = true; // تغيير هذه القيمة لاستخدام خادم Render دائمًا

// تخزين حالة الاتصال
let lastConnectionStatus = {
  isConnected: false,
  lastChecked: 0,
  retryCount: 0,
  lastUsedIp: RENDER_ALLOWED_IPS[0]
};

/**
 * تحديث حالة الاتصال
 */
export const updateConnectionStatus = (isConnected: boolean, usedIp?: string): void => {
  lastConnectionStatus = {
    isConnected,
    lastChecked: Date.now(),
    retryCount: isConnected ? 0 : lastConnectionStatus.retryCount + 1,
    lastUsedIp: usedIp || lastConnectionStatus.lastUsedIp
  };
  
  // تسجيل حالة الاتصال للتصحيح
  console.log("تحديث حالة الاتصال:", {
    isConnected,
    retryCount: lastConnectionStatus.retryCount,
    lastUsedIp: lastConnectionStatus.lastUsedIp,
    time: new Date().toISOString()
  });
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
  
  // استخدام خادم Render دائمًا
  const serverUrl = CLOUD_AUTOMATION_SERVER;
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
  
  // إعادة تعيين حالة الاتصال عند تغيير URL
  updateConnectionStatus(false);
};

/**
 * إعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية
 */
export const resetAutomationServerUrl = (): void => {
  console.log("إعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية");
  localStorage.removeItem('automation_server_url');
  
  // إعادة تعيين حالة الاتصال
  updateConnectionStatus(false);
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
