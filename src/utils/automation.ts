
/**
 * وظائف مساعدة للتحقق من بيئة التطبيق
 */

/**
 * التحقق مما إذا كان التطبيق يعمل في بيئة المعاينة (Lovable)
 * @returns {boolean} دائمًا يرجع false (تم تعطيله للعمل دائمًا في البيئة الفعلية)
 */
export const isPreview = (): boolean => {
  // تم تعطيل التحقق من بيئة المعاينة وجعله دائمًا يعتبر أنه في البيئة الفعلية
  return false;
};

/**
 * التحقق مما إذا كان التطبيق يعمل في بيئة الإنتاج
 * @returns {boolean} دائمًا يرجع true (تم تعطيله للعمل دائمًا في البيئة الفعلية)
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
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1366,768'
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
    defaultViewport: { width: 1366, height: 768 }
  };
};
