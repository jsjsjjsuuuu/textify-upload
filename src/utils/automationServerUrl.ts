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
const isProduction = true; // استخدام خادم Render بشكل دائم

// تخزين حالة الاتصال
let lastConnectionStatus = {
  isConnected: false,
  lastChecked: 0,
  retryCount: 0,
  lastUsedIp: RENDER_ALLOWED_IPS[0],
  timeoutMs: 10000, // إضافة مهلة زمنية افتراضية للطلبات
  lastError: null as Error | null // إضافة حقل لتخزين آخر خطأ
};

/**
 * تحديث حالة الاتصال
 */
export const updateConnectionStatus = (isConnected: boolean, usedIp?: string, error?: Error): void => {
  lastConnectionStatus = {
    isConnected,
    lastChecked: Date.now(),
    retryCount: isConnected ? 0 : lastConnectionStatus.retryCount + 1,
    lastUsedIp: usedIp || lastConnectionStatus.lastUsedIp,
    timeoutMs: lastConnectionStatus.timeoutMs,
    lastError: error || null
  };
  
  // تسجيل حالة الاتصال للتصحيح
  console.log("تحديث حالة الاتصال:", {
    isConnected,
    retryCount: lastConnectionStatus.retryCount,
    lastUsedIp: lastConnectionStatus.lastUsedIp,
    time: new Date().toISOString(),
    error: error ? error.message : null
  });
  
  // حفظ حالة الاتصال الأخيرة في localStorage للوصول إليها بسهولة
  try {
    localStorage.setItem('connection_status', JSON.stringify({
      isConnected,
      lastChecked: Date.now(),
      retryCount: lastConnectionStatus.retryCount,
      lastError: error ? error.message : null
    }));
  } catch (e) {
    console.error("خطأ في حفظ حالة الاتصال:", e);
  }
};

/**
 * الحصول على حالة الاتصال الأخيرة
 */
export const getLastConnectionStatus = () => {
  // محاولة استرجاع الحالة المحفوظة من localStorage أولاً
  try {
    const savedStatus = localStorage.getItem('connection_status');
    if (savedStatus) {
      const parsed = JSON.parse(savedStatus);
      // تحديث حالة الاتصال الداخلية إذا كانت الحالة المحفوظة أحدث
      if (parsed.lastChecked > lastConnectionStatus.lastChecked) {
        lastConnectionStatus.isConnected = parsed.isConnected;
        lastConnectionStatus.lastChecked = parsed.lastChecked;
        lastConnectionStatus.retryCount = parsed.retryCount;
      }
    }
  } catch (e) {
    console.error("خطأ في استرجاع حالة الاتصال:", e);
  }
  
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
 * ضبط مهلة الاتصال (بالميلي ثانية)
 */
export const setConnectionTimeout = (timeoutMs: number): void => {
  if (timeoutMs >= 5000 && timeoutMs <= 60000) {
    lastConnectionStatus.timeoutMs = timeoutMs;
    console.log(`تم ضبط مهلة الاتصال على ${timeoutMs} ميلي ثانية`);
  } else {
    console.warn("مهلة الاتصال يجب أن تكون بين 5000 و 60000 ميلي ثانية");
  }
};

/**
 * الحصول على مهلة الاتصال الحالية
 */
export const getConnectionTimeout = (): number => {
  return lastConnectionStatus.timeoutMs;
};

/**
 * إنشاء رؤوس HTTP أساسية للطلبات مع تحسينات للتوافق مع خادم Render
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
 * إنشاء خيارات الطلب مع إعدادات زمنية وإلغاء
 */
export const createFetchOptions = (
  method: string = 'GET', 
  body?: any, 
  customHeaders?: Record<string, string>,
  customIp?: string
): RequestInit => {
  const controller = new AbortController();
  const signal = controller.signal;
  
  // إلغاء الطلب بعد المهلة المحددة
  setTimeout(() => {
    controller.abort();
  }, lastConnectionStatus.timeoutMs);
  
  return {
    method,
    headers: {
      ...createBaseHeaders(customIp),
      ...(customHeaders || {})
    },
    body: body ? JSON.stringify(body) : undefined,
    mode: 'cors',
    credentials: 'omit',
    signal,
    cache: 'no-store'
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

/**
 * إجراء طلب API مع محاولات إعادة الاتصال التلقائية وتبديل IP
 */
export const fetchWithRetry = async (
  endpoint: string, 
  options: RequestInit, 
  maxRetries: number = 5
): Promise<Response> => {
  let currentRetry = 0;
  let lastError: Error | null = null;
  
  while (currentRetry < maxRetries) {
    try {
      // إذا كانت هذه إعادة محاولة، قم بتبديل عنوان IP
      if (currentRetry > 0) {
        const nextIp = getNextIp();
        console.log(`إعادة المحاولة ${currentRetry}/${maxRetries} باستخدام IP: ${nextIp}`);
        
        // تحديث الرؤوس مع عنوان IP الجديد
        if (options.headers) {
          const headers = options.headers as Record<string, string>;
          headers['X-Forwarded-For'] = nextIp;
          headers['X-Render-Client-IP'] = nextIp;
        }
        
        // تحديث حالة الاتصال
        updateConnectionStatus(false, nextIp);
      }
      
      const response = await fetch(endpoint, options);
      
      if (response.ok) {
        // تحديث حالة الاتصال في حالة النجاح
        updateConnectionStatus(true, (options.headers as Record<string, string>)['X-Forwarded-For']);
        return response;
      } else {
        // معالجة استجابات الخطأ HTTP
        const errorText = await response.text();
        lastError = new Error(`HTTP error ${response.status}: ${errorText}`);
        console.error(`فشل الطلب (${response.status}):`, errorText);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`خطأ في الطلب (محاولة ${currentRetry + 1}/${maxRetries}):`, error);
    }
    
    // زيادة عداد المحاولة
    currentRetry++;
    
    // انتظار قبل إعادة المحاولة التالية (200ms * رقم المحاولة)
    if (currentRetry < maxRetries) {
      const delayMs = 200 * currentRetry;
      console.log(`الانتظار ${delayMs}ms قبل إعادة المحاولة التالية...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
  throw lastError || new Error('فشلت جميع محاولات الاتصال');
};

/**
 * فحص حالة الاتصال بالخادم ورجوع نتيجة الفحص
 * تستخدم هذه الدالة للتحقق السريع من صحة الاتصال
 */
export const checkConnection = async (): Promise<{ isConnected: boolean; message: string }> => {
  try {
    const serverUrl = getAutomationServerUrl();
    const currentIp = getNextIp();
    
    // استخدام عملية fetch مبسطة مع مهلة زمنية قصيرة
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 ثوانٍ كحد أقصى للفحص
    
    const response = await fetch(`${serverUrl}/api/status`, {
      method: 'GET',
      headers: createBaseHeaders(currentIp),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      updateConnectionStatus(true, currentIp);
      return { 
        isConnected: true, 
        message: "متصل بالخادم بنجاح" 
      };
    } else {
      const errorMsg = `فشل الاتصال بالخادم برمز الحالة: ${response.status}`;
      updateConnectionStatus(false, currentIp, new Error(errorMsg));
      return { 
        isConnected: false, 
        message: errorMsg 
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف في الاتصال';
    updateConnectionStatus(false, lastConnectionStatus.lastUsedIp, error instanceof Error ? error : new Error(errorMsg));
    return { 
      isConnected: false, 
      message: errorMsg 
    };
  }
};

/**
 * التحقق مما إذا كان الاتصال نشطًا حاليًا
 * يعتمد على الحالة المخزنة وإذا مضى وقت طويل يقوم بفحص جديد
 */
export const isConnected = async (forceCheck = false): Promise<boolean> => {
  const status = getLastConnectionStatus();
  const timeSinceLastCheck = Date.now() - status.lastChecked;
  
  // إذا كان آخر فحص حديثاً (أقل من 30 ثانية) ولم يطلب فحص قسري، فاستخدم الحالة المخزنة
  if (!forceCheck && timeSinceLastCheck < 30000) {
    return status.isConnected;
  }
  
  // وإلا قم بالفحص وأعد النتيجة
  const checkResult = await checkConnection();
  return checkResult.isConnected;
};
