
/**
 * وظائف مساعدة للتحقق من بيئة التطبيق
 */

/**
 * التحقق مما إذا كان التطبيق يعمل في بيئة المعاينة (Lovable)
 * @returns {boolean} يرجع false دائمًا لضمان استخدام البيئة الفعلية
 */
export const isPreview = (): boolean => {
  // تم تعديل السلوك ليرجع دائمًا false بغض النظر عن البيئة الحقيقية
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
  // استخدام المسار الافتراضي مباشرة
  const chromePath = '/usr/bin/google-chrome-stable';
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
    '--disable-site-isolation-trials', // تعطيل تجارب عزل المواقع
    '--enable-automation' // تمكين وضع الأتمتة لدعم العديد من المحددات
  ];
  
  console.log("استخدام وسائط Chrome التالية:", args);
  return args;
};

/**
 * التأكد من تكوين Puppeteer الصحيح - تم إعادة كتابته ليعمل في المتصفح
 * @returns {object} تكوين Puppeteer لبيئة التنفيذ
 */
export const getPuppeteerConfig = () => {
  try {
    const config = {
      executablePath: getChromePath(),
      headless: 'new', // استخدام وضع headless الجديد للأداء الأفضل
      args: getPuppeteerArgs(),
      defaultViewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true, // تجاهل أخطاء HTTPS
      timeout: 60000, // زيادة مهلة الاتصال إلى دقيقة واحدة
      waitForInitialPage: true, // انتظار تحميل الصفحة الأولى
      dumpio: true, // طباعة stdout و stderr من المستعرض للمساعدة في التصحيح
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false
    };
    
    console.log("تكوين Puppeteer الكامل:", JSON.stringify(config, null, 2));
    return config;
  } catch (error) {
    console.error("حدث خطأ أثناء إنشاء تكوين Puppeteer:", error);
    return {
      headless: 'new',
      args: ['--no-sandbox', '--disable-web-security'],
      ignoreHTTPSErrors: true,
      timeout: 60000
    };
  }
};

/**
 * التحقق مما إذا كان يجب استخدام بيانات المتصفح (الكوكيز وبيانات الجلسة)
 * @returns {boolean} يجب استخدام بيانات المتصفح أم لا
 */
export const shouldUseBrowserData = (): boolean => {
  try {
    // دائمًا استخدام بيانات المتصفح للحصول على أفضل النتائج
    const shouldUse = localStorage.getItem('use_browser_data') !== 'false';
    console.log(`استخدام بيانات المتصفح: ${shouldUse}`);
    return shouldUse;
  } catch (error) {
    console.error("خطأ في الوصول إلى التخزين المحلي:", error);
    return true; // القيمة الافتراضية هي استخدام بيانات المتصفح
  }
};

/**
 * ضبط إعداد استخدام بيانات المتصفح
 * @param {boolean} value القيمة المراد ضبطها
 */
export const setUseBrowserData = (value: boolean): void => {
  try {
    console.log(`تعيين استخدام بيانات المتصفح إلى: ${value}`);
    localStorage.setItem('use_browser_data', value.toString());
  } catch (error) {
    console.error("خطأ في تعيين قيمة في التخزين المحلي:", error);
  }
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
    waitAfterAction: 1000, // انتظار بعد كل إجراء (بالمللي ثانية)
    supportXPath: true // دعم محددات XPath
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
  try {
    localStorage.removeItem('actions_log');
    console.log("تم مسح سجل الإجراءات");
  } catch (e) {
    console.error("فشل في مسح سجل الإجراءات:", e);
  }
};

/**
 * التحقق مما إذا كان محدد العنصر هو محدد XPath
 * @param {string} selector محدد العنصر
 * @returns {boolean} هل هذا محدد XPath
 */
export const isXPathSelector = (selector: string): boolean => {
  if (!selector) return false;
  
  // التحقق من أنماط شائعة لمحددات XPath
  const xpathPatterns = [
    /^\/\//,                  // يبدأ بـ //
    /^\/[a-z]/i,              // يبدأ بـ / ثم حرف
    /^id\(.+\)/,              // يبدأ بـ id(...)
    /^\(.+\)/,                // يبدأ بقوس (...)
    /contains\(.+\)/,         // يحتوي على دالة contains()
    /\[@.+\]/,                // يحتوي على سمة [@...]
    /\[\d+\]/,                // يحتوي على مؤشر رقمي [1]
    /^[a-z]+::[a-z]+/i,       // يحتوي على محور مثل ancestor::div
    /text\(\)/,               // يحتوي على دالة text()
    /node\(\)/                // يحتوي على دالة node()
  ];
  
  return xpathPatterns.some(pattern => pattern.test(selector));
};

/**
 * التحقق مما إذا كان نص الخطأ متعلق بدالة require
 * @param {string} errorMessage نص رسالة الخطأ
 * @returns {boolean} هل الخطأ متعلق بدالة require
 */
export const isRequireError = (errorMessage: string): boolean => {
  if (!errorMessage) return false;
  
  const requireErrorPatterns = [
    /require is not defined/i,
    /require is not a function/i,
    /Cannot find module/i,
    /Module not found/i,
    /الدالة require غير متاحة/,
    /خطأ في تشغيل البرنامج/,
    /ReferenceError:\s+require/
  ];
  
  return requireErrorPatterns.some(pattern => pattern.test(errorMessage));
};

/**
 * تحويل محدد XPath إلى محدد CSS إذا أمكن (للاستخدام الاحتياطي)
 * @param {string} xpathSelector محدد XPath
 * @returns {string|null} محدد CSS المكافئ أو null إذا تعذر التحويل
 */
export const xpathToCss = (xpathSelector: string): string | null => {
  // هذه وظيفة مبسطة لتحويل بعض أنماط XPath الشائعة إلى CSS
  // لا يمكنها التعامل مع جميع أنواع محددات XPath المعقدة
  
  try {
    // التعامل مع //tagName
    if (/^\/\/([a-z0-9_-]+)$/i.test(xpathSelector)) {
      return xpathSelector.replace(/^\/\/([a-z0-9_-]+)$/i, '$1');
    }
    
    // التعامل مع //tagName[@id='value']
    if (/^\/\/([a-z0-9_-]+)\[@id=['"]([^'"]+)['"]\]$/i.test(xpathSelector)) {
      return xpathSelector.replace(/^\/\/([a-z0-9_-]+)\[@id=['"]([^'"]+)['"]\]$/i, '$1#$2');
    }
    
    // التعامل مع //tagName[@class='value']
    if (/^\/\/([a-z0-9_-]+)\[@class=['"]([^'"]+)['"]\]$/i.test(xpathSelector)) {
      return xpathSelector.replace(/^\/\/([a-z0-9_-]+)\[@class=['"]([^'"]+)['"]\]$/i, '$1.$2');
    }
    
    // التعامل مع //tagName[@attribute='value']
    if (/^\/\/([a-z0-9_-]+)\[@([a-z0-9_-]+)=['"]([^'"]+)['"]\]$/i.test(xpathSelector)) {
      return xpathSelector.replace(/^\/\/([a-z0-9_-]+)\[@([a-z0-9_-]+)=['"]([^'"]+)['"]\]$/i, '$1[$2="$3"]');
    }
    
    // التعامل مع //input[@placeholder='value']
    if (/^\/\/input\[@placeholder=['"]([^'"]+)['"]\]$/i.test(xpathSelector)) {
      return xpathSelector.replace(/^\/\/input\[@placeholder=['"]([^'"]+)['"]\]$/i, 'input[placeholder="$1"]');
    }
    
    // التعامل مع //input[@placeholder='value'][@value='value']
    if (/^\/\/input\[@placeholder=['"]([^'"]+)['"]\]\[@value=['"]([^'"]+)['"]\]$/i.test(xpathSelector)) {
      return xpathSelector.replace(/^\/\/input\[@placeholder=['"]([^'"]+)['"]\]\[@value=['"]([^'"]+)['"]\]$/i, 'input[placeholder="$1"][value="$2"]');
    }
    
    // لا يمكن التحويل
    return null;
  } catch (error) {
    console.error("خطأ في تحويل محدد XPath إلى CSS:", error);
    return null;
  }
};

/**
 * إصلاح أخطاء الشبكة في الاتصال بالخادم
 * @param {string} url عنوان URL الذي يتم الاتصال به
 * @param {object} options خيارات الطلب
 * @returns {Promise<Response>} استجابة الطلب مع إعادة المحاولة التلقائية
 */
export const fetchWithRetry = async (url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> => {
  let lastError: Error | null = null;
  let retryDelay = 1000;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`محاولة الاتصال بـ ${url} (محاولة ${attempt + 1}/${maxRetries})`);
      
      // إضافة رؤوس مخصصة لتجنب مشاكل CORS
      const headers = {
        ...options.headers,
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
        'X-Request-Time': Date.now().toString()
      };
      
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit'
      });
      
      // إذا كانت الاستجابة ناجحة، إرجاعها
      if (response.ok) {
        console.log(`تم الاتصال بنجاح بـ ${url}`);
        return response;
      }
      
      // إذا كانت الاستجابة غير ناجحة، رمي خطأ
      throw new Error(`فشل الاتصال: ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`فشل في المحاولة ${attempt + 1}/${maxRetries}:`, lastError.message);
      
      // انتظار قبل إعادة المحاولة
      if (attempt < maxRetries - 1) {
        console.log(`انتظار ${retryDelay}ms قبل إعادة المحاولة...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 1.5; // زيادة وقت الانتظار تدريجيًا
      }
    }
  }
  
  // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
  throw lastError || new Error(`فشلت جميع محاولات الاتصال بـ ${url}`);
};

/**
 * التحقق من توفر الاتصال بالإنترنت
 * @returns {Promise<boolean>} ما إذا كان الاتصال بالإنترنت متوفرًا
 */
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    // محاولة الاتصال بخدمة موثوقة
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      timeout: 5000
    });
    
    return true;
  } catch (error) {
    console.error("فشل في التحقق من اتصال الإنترنت:", error);
    return false;
  }
};

/**
 * توفير معلومات تشخيصية للمستخدم حول مشاكل الأتمتة
 * @param {string} errorCode كود الخطأ
 * @returns {object} معلومات تشخيصية للمساعدة في حل المشكلة
 */
export const getDiagnosticInfo = (errorCode: string) => {
  switch (errorCode) {
    case 'CONNECTION_ERROR':
      return {
        title: "خطأ في الاتصال بالشبكة",
        description: "تعذر الاتصال بالخادم المطلوب. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.",
        solutions: [
          "تأكد من اتصالك بالإنترنت",
          "تحقق من صحة عنوان URL",
          "تأكد من أن الخادم المستهدف متاح وقيد التشغيل",
          "تحقق من إعدادات جدار الحماية أو الوكيل (proxy)"
        ]
      };
    
    case 'XPATH_ERROR':
      return {
        title: "خطأ في محدد XPath",
        description: "تعذر العثور على العنصر باستخدام محدد XPath المحدد.",
        solutions: [
          "تأكد من صحة بناء محدد XPath",
          "تحقق من أن العنصر المستهدف موجود في الصفحة",
          "جرب استخدام محدد أكثر تحديدًا أو أكثر مرونة",
          "يمكنك استخدام أدوات المطور في المتصفح للتحقق من محدد XPath"
        ]
      };
    
    case 'TIMEOUT_ERROR':
      return {
        title: "خطأ انتهاء المهلة",
        description: "استغرقت العملية وقتًا أطول من المتوقع وتم إلغاؤها.",
        solutions: [
          "زيادة مهلة الانتظار",
          "التحقق من أداء الشبكة",
          "تقسيم العملية إلى خطوات أصغر"
        ]
      };
    
    default:
      return {
        title: "خطأ غير معروف",
        description: `حدث خطأ غير متوقع (${errorCode}).`,
        solutions: [
          "تحقق من سجلات الأخطاء لمزيد من المعلومات",
          "إعادة تحميل الصفحة وتجربة العملية مرة أخرى",
          "التحقق من إعدادات المتصفح والشبكة"
        ]
      };
  }
};
