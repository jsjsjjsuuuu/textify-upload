
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

// عنوان خادم الأتمتة المحلي
const LOCAL_AUTOMATION_SERVER = 'http://localhost:10000';

// تحديد ما إذا كان التطبيق يعمل في وضع الإنتاج
// true = استخدام خادم Render, false = استخدام الخادم المحلي
const isProduction = true; 

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
 * الحصول على عنوان IP التالي من القائمة الدورية
 */
export const getNextIp = (): string => {
  const currentStatus = getLastConnectionStatus();
  const currentIndex = RENDER_ALLOWED_IPS.indexOf(currentStatus.lastUsedIp);
  const nextIndex = (currentIndex + 1) % RENDER_ALLOWED_IPS.length;
  return RENDER_ALLOWED_IPS[nextIndex];
};

/**
 * إنشاء رؤوس HTTP أساسية للطلبات
 */
export const createBaseHeaders = (customIp?: string): Record<string, string> => {
  const ip = customIp || lastConnectionStatus.lastUsedIp || RENDER_ALLOWED_IPS[0];
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Forwarded-For, X-Render-Client-IP',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Forwarded-For': ip,
    'X-Render-Client-IP': ip,
    'Origin': CLOUD_AUTOMATION_SERVER,
    'Referer': CLOUD_AUTOMATION_SERVER
  };
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
