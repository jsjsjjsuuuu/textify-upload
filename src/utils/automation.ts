
/**
 * وظائف مساعدة للتحقق من بيئة التطبيق
 */

/**
 * التحقق مما إذا كان التطبيق يعمل في بيئة المعاينة (Lovable)
 * @returns {boolean} يرجع false دائمًا لضمان استخدام البيئة الفعلية
 */
export const isPreview = (): boolean => {
  // تم تعديل السلوك للتأكد من التنفيذ الفعلي دائمًا
  // حتى في بيئة المعاينة Lovable
  const hostname = window.location.hostname;
  // التحقق الفعلي
  return false;
};

/**
 * التحقق مما إذا كان التطبيق يعمل في بيئة الإنتاج
 * @returns {boolean} دائمًا يرجع true لضمان استخدام التنفيذ الفعلي
 */
export const isProduction = (): boolean => {
  return true;
};

/**
 * الحصول على مسار Chrome المثبت على الخادم
 * @returns {string|undefined} مسار Chrome المثبت
 */
export const getChromePath = (): string | undefined => {
  return process.env.CHROME_BIN || '/usr/bin/google-chrome-stable';
};

/**
 * الحصول على وسائط تشغيل Puppeteer المناسبة لبيئة Render
 * @returns {string[]} قائمة وسائط تشغيل Chrome
 */
export const getPuppeteerArgs = (): string[] => {
  // تحسين إعدادات Chrome لتجنب مشاكل CORS وتحسين الأداء
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1366,768',
    '--disable-web-security', // تجاوز قيود CORS
    '--allow-running-insecure-content', // السماح بالمحتوى غير الآمن
    '--enable-features=NetworkService,NetworkServiceInProcess' // تحسين أداء الشبكة
  ];
};

/**
 * التأكد من تكوين Puppeteer الصحيح
 * @returns {object} تكوين Puppeteer لبيئة Render
 */
export const getPuppeteerConfig = () => {
  return {
    executablePath: getChromePath(),
    headless: 'new',
    args: getPuppeteerArgs(),
    defaultViewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true, // تجاهل أخطاء HTTPS
    timeout: 60000 // زيادة مهلة الاتصال إلى دقيقة واحدة
  };
};

/**
 * التحقق مما إذا كان يجب استخدام بيانات المتصفح (الكوكيز وبيانات الجلسة)
 * @returns {boolean} يجب استخدام بيانات المتصفح أم لا
 */
export const shouldUseBrowserData = (): boolean => {
  // دائمًا استخدام بيانات المتصفح للحصول على أفضل النتائج، خاصة للمواقع التي تتطلب تسجيل الدخول
  return true;
};

/**
 * ضبط إعداد استخدام بيانات المتصفح
 * @param {boolean} value القيمة المراد ضبطها (true لاستخدام بيانات المتصفح، false لعدم استخدامها)
 */
export const setUseBrowserData = (value: boolean): void => {
  localStorage.setItem('use_browser_data', value.toString());
};

/**
 * الحصول على الإعدادات الافتراضية للتطبيق
 * @returns {object} الإعدادات الافتراضية
 */
export const getDefaultSettings = () => {
  return {
    useBrowserData: true, // دائمًا استخدام بيانات المتصفح للحصول على أفضل النتائج
    forceRealExecution: true, // تأكيد على تفعيل وضع التنفيذ الفعلي دائمًا
    automationType: 'server' as 'server' | 'client'
  };
};
