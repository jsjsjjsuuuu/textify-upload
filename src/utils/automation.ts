/**
 * وظائف مساعدة للتحقق من بيئة التطبيق
 */

/**
 * التحقق مما إذا كان التطبيق يعمل في بيئة المعاينة (Lovable)
 * @returns {boolean} يرجع false دائمًا لضمان استخدام البيئة الفعلية
 */
export const isPreview = (): boolean => {
  // تم تغيير السلوك ليرجع دائمًا false بغض النظر عن البيئة
  console.log("فحص بيئة المعاينة - تم إجبار استخدام وضع التنفيذ الفعلي");
  return false;
};

/**
 * التحقق مما إذا كان التطبيق يعمل في بيئة الإنتاج
 * @returns {boolean} دائمًا يرجع true لضمان استخدام التنفيذ الفعلي
 */
export const isProduction = (): boolean => {
  console.log("فحص بيئة الإنتاج - تم إجبار استخدام وضع التنفيذ الفعلي");
  return true;
};

/**
 * الحصول على مسار Chrome المثبت على الخادم
 * @returns {string|undefined} مسار Chrome المثبت
 */
export const getChromePath = (): string | undefined => {
  const chromePath = process.env.CHROME_BIN || '/usr/bin/google-chrome-stable';
  console.log(`استخدام مسار Chrome: ${chromePath}`);
  return chromePath;
};

/**
 * الحصول على وسائط تشغيل Puppeteer المناسبة لبيئة Render
 * @returns {string[]} قائمة وسائط تشغيل Chrome
 */
export const getPuppeteerArgs = (): string[] => {
  // تحسين إعدادات Chrome لتجنب مشاكل CORS وتحسين الأداء
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1366,768',
    '--disable-web-security', // تجاوز قيود CORS
    '--allow-running-insecure-content', // السماح بالمحتوى غير الآمن
    '--enable-features=NetworkService,NetworkServiceInProcess', // تحسين أداء الشبكة
    '--ignore-certificate-errors', // تجاهل أخطاء الشهادات
    '--disable-features=IsolateOrigins,site-per-process', // تعطيل عزل الأصول
    '--disable-site-isolation-trials' // تعطيل تجارب عزل المواقع
  ];
  
  console.log("استخدام وسائط Chrome التالية:", args);
  return args;
};

/**
 * التأكد من تكوين Puppeteer الصحيح
 * @returns {object} تكوين Puppeteer لبيئة Render
 */
export const getPuppeteerConfig = () => {
  const config = {
    executablePath: getChromePath(),
    headless: 'new',
    args: getPuppeteerArgs(),
    defaultViewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true, // تجاهل أخطاء HTTPS
    timeout: 60000, // زيادة مهلة الاتصال إلى دقيقة واحدة
    waitForInitialPage: true, // انتظار تحميل الصفحة الأولى
    dumpio: true // طباعة stdout و stderr من المستعرض للمساعدة في التصحيح
  };
  
  console.log("تكوين Puppeteer الكامل:", JSON.stringify(config, null, 2));
  return config;
};

/**
 * التحقق مما إذا كان يجب استخدام بيانات المتصفح (الكوكيز وبيانات الجلسة)
 * @returns {boolean} يجب استخدام بيانات المتصفح أم لا
 */
export const shouldUseBrowserData = (): boolean => {
  // دائمًا استخدام بيانات المتصفح للحصول على أفضل النتائج، خاصة للمواقع التي تتطلب تسجيل الدخول
  const shouldUse = localStorage.getItem('use_browser_data') !== 'false';
  console.log(`استخدام بيانات المتصفح: ${shouldUse}`);
  return shouldUse;
};

/**
 * ضبط إعداد استخدام بيانات المتصفح
 * @param {boolean} value القيمة المراد ضبطها (true لاستخدام بيانات المتصفح، false لعدم استخدامها)
 */
export const setUseBrowserData = (value: boolean): void => {
  console.log(`تعيين استخدام بيانات المتصفح إلى: ${value}`);
  localStorage.setItem('use_browser_data', value.toString());
};

/**
 * الحصول على الإعدادات الافتراضية للتطبيق
 * @returns {object} الإعدادات الافتراضية
 */
export const getDefaultSettings = () => {
  const settings = {
    useBrowserData: true, // دائمًا استخدام بيانات المتصفح للحصول على أفضل النتائج
    forceRealExecution: true, // تأكيد على تفعيل وضع التنفيذ الفعلي دائمًا
    automationType: 'server' as 'server' | 'client',
    verboseLogging: true, // تفعيل التسجيل المفصل
    retryFailedActions: true, // إعادة محاولة الإجراءات الفاشلة
    maxRetries: 3, // الحد الأقصى لعدد إعادة المحاولات
    waitAfterAction: 1000 // انتظار بعد كل إجراء (بالمللي ثانية)
  };
  
  console.log("استخدام الإعدادات الافتراضية:", settings);
  return settings;
};

/**
 * تسجيل معلومات تنفيذ الإجراء
 * @param {string} actionType نوع الإجراء
 * @param {string} selector محدد العنصر
 * @param {string|null} value القيمة المستخدمة (إن وجدت)
 * @param {boolean} success نجاح الإجراء أم لا
 * @param {string|null} error رسالة الخطأ (إن وجدت)
 * @returns {object} معلومات الإجراء المُسجَّل
 */
export const logActionExecution = (
  actionType: string,
  selector: string,
  value: string | null = null,
  success: boolean = true,
  error: string | null = null
) => {
  const actionInfo = {
    time: new Date().toISOString(),
    actionType,
    selector,
    value,
    success,
    error
  };
  
  // تسجيل المعلومات في وحدة التحكم
  console.log(`تنفيذ إجراء ${actionType}:`, actionInfo);
  
  // يمكن هنا إضافة تخزين سجلات الإجراءات في localStorage للرجوع إليها لاحقًا
  try {
    const actionsLog = JSON.parse(localStorage.getItem('actions_log') || '[]');
    actionsLog.push(actionInfo);
    // الاحتفاظ بآخر 100 إجراء فقط
    if (actionsLog.length > 100) {
      actionsLog.shift();
    }
    localStorage.setItem('actions_log', JSON.stringify(actionsLog));
  } catch (e) {
    console.error("فشل في تخزين سجل الإجراء:", e);
  }
  
  return actionInfo;
};

/**
 * الحصول على سجل الإجراءات المنفذة
 * @returns {Array} سجل الإجراءات
 */
export const getActionsLog = () => {
  try {
    return JSON.parse(localStorage.getItem('actions_log') || '[]');
  } catch (e) {
    console.error("فشل في استرداد سجل الإجراءات:", e);
    return [];
  }
};

/**
 * مسح سجل الإجراءات
 */
export const clearActionsLog = () => {
  localStorage.removeItem('actions_log');
  console.log("تم مسح سجل الإجراءات");
};
