
/**
 * وحدة إدارة عنوان خادم الأتمتة
 */

// القيمة الافتراضية لعنوان خادم الأتمتة
const DEFAULT_AUTOMATION_SERVER_URL = 'https://textify-upload.onrender.com';

// مفتاح لتخزين عنوان الخادم في التخزين المحلي
const SERVER_URL_STORAGE_KEY = 'automation_server_url';
const CONNECTION_STATUS_KEY = 'automation_server_connection_status';

// عناوين IP المسموح بها لخادم Render (استخدم للاتصال المتناوب)
export const RENDER_ALLOWED_IPS = [
  '34.213.214.55',
  '44.226.145.213',
  '44.230.95.183',
  '44.229.200.200',
  '44.239.220.33'
];

/**
 * الحصول على عنوان خادم الأتمتة
 */
export const getAutomationServerUrl = (): string => {
  try {
    // محاولة الحصول على عنوان الخادم المخزن
    const storedUrl = localStorage.getItem(SERVER_URL_STORAGE_KEY);
    
    // إذا كان موجوداً، استخدمه
    if (storedUrl) {
      return storedUrl;
    }
    
    // إذا لم يكن موجوداً، استخدم القيمة الافتراضية وخزنها
    localStorage.setItem(SERVER_URL_STORAGE_KEY, DEFAULT_AUTOMATION_SERVER_URL);
    return DEFAULT_AUTOMATION_SERVER_URL;
  } catch (error) {
    // في حالة حدوث خطأ (مثل عدم توفر localStorage)، استخدم القيمة الافتراضية
    console.error("خطأ في الحصول على عنوان خادم الأتمتة:", error);
    return DEFAULT_AUTOMATION_SERVER_URL;
  }
};

/**
 * تعيين عنوان خادم الأتمتة
 */
export const setAutomationServerUrl = (url: string): void => {
  try {
    localStorage.setItem(SERVER_URL_STORAGE_KEY, url);
    console.log("تم تعيين عنوان خادم الأتمتة:", url);
  } catch (error) {
    console.error("خطأ في تعيين عنوان خادم الأتمتة:", error);
  }
};

/**
 * إعادة تعيين عنوان الخادم إلى القيمة الافتراضية
 */
export const resetAutomationServerUrl = (): string => {
  setAutomationServerUrl(DEFAULT_AUTOMATION_SERVER_URL);
  return DEFAULT_AUTOMATION_SERVER_URL;
};

/**
 * تحقق مما إذا كنا في بيئة المعاينة
 */
export const isPreviewEnvironment = (): boolean => {
  try {
    // التحقق من عنوان URL للتأكد من أننا في بيئة معاينة
    const hostname = window.location.hostname;
    return hostname.includes('preview') || 
           hostname.includes('localhost') || 
           hostname.includes('127.0.0.1') ||
           hostname.includes('gitpod') ||
           hostname.includes('lovable.app');
  } catch (error) {
    console.error("خطأ في التحقق من بيئة المعاينة:", error);
    return false;
  }
};

/**
 * تحقق من صحة عنوان URL للخادم
 */
export const isValidServerUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

/**
 * التحقق من اتصال خادم الأتمتة
 */
export const checkConnection = async (): Promise<{ isConnected: boolean; message: string }> => {
  console.log("محاولة اتصال سريع:", getAutomationServerUrl());
  
  // استخدام نهج مباشر بدون وسيط للتحقق من الاتصال
  console.log("استخدام طريقة مباشرة للتحقق من الاتصال...");
  
  try {
    // محاولة الاتصال بنقطة نهاية ping
    const response = await fetch(`${getAutomationServerUrl()}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': 'web-client',
        'Origin': window.location.origin,
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      }
    });
    
    // التحقق من نجاح الاستجابة
    if (response.ok) {
      const data = await response.json();
      console.log("Ping response successful:", data);
      
      // تحديث حالة الاتصال في التخزين المحلي
      updateConnectionStatus(true, "اتصال ناجح");
      
      return {
        isConnected: true,
        message: data.message || "تم الاتصال بنجاح بخادم الأتمتة"
      };
    } else {
      const errorText = await response.text();
      console.error("Ping response failed:", response.status, errorText);
      
      // تحديث حالة الاتصال في التخزين المحلي
      updateConnectionStatus(false, `فشل الاتصال: ${response.status} ${errorText}`);
      
      return {
        isConnected: false,
        message: `فشل الاتصال بخادم الأتمتة: ${response.status} ${errorText}`
      };
    }
  } catch (error) {
    console.error("Error during connection check:", error);
    
    // تحديث حالة الاتصال في التخزين المحلي
    updateConnectionStatus(false, `خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    
    return {
      isConnected: false,
      message: `خطأ في الاتصال بخادم الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
    };
  }
};

/**
 * تخزين حالة اتصال الخادم
 */
export const updateConnectionStatus = (isConnected: boolean, message: string = "", retryCount: number = 0): void => {
  try {
    const status = {
      isConnected,
      message,
      timestamp: new Date().toISOString(),
      retryCount
    };
    
    localStorage.setItem(CONNECTION_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error("خطأ في تخزين حالة اتصال الخادم:", error);
  }
};

/**
 * الحصول على آخر حالة اتصال مخزنة
 */
export const getLastConnectionStatus = (): { isConnected: boolean; message: string; timestamp: string; retryCount: number } => {
  try {
    const storedStatus = localStorage.getItem(CONNECTION_STATUS_KEY);
    
    if (storedStatus) {
      return JSON.parse(storedStatus);
    }
    
    // القيمة الافتراضية إذا لم يتم تخزين أي حالة بعد
    return {
      isConnected: true, // نفترض أنه متصل افتراضياً لتفادي رسائل الخطأ غير الضرورية
      message: "لم يتم التحقق من الاتصال بعد",
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
  } catch (error) {
    console.error("خطأ في الحصول على آخر حالة اتصال:", error);
    
    // في حالة حدوث خطأ
    return {
      isConnected: false,
      message: "خطأ في استرداد حالة الاتصال",
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
  }
};

/**
 * تحسين الاتصال عن طريق محاولات متعددة
 */
export const ensureConnection = async (retries = 2): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts <= retries) {
    attempts++;
    console.log(`محاولة الاتصال ${attempts}/${retries + 1}...`);
    
    const result = await checkConnection();
    
    if (result.isConnected) {
      console.log("تم الاتصال بنجاح!");
      return true;
    }
    
    console.log(`فشل الاتصال، سيتم إعادة المحاولة... (${attempts}/${retries + 1})`);
    
    if (attempts <= retries) {
      // انتظار قبل المحاولة التالية
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log("فشلت جميع محاولات الاتصال");
  return false;
};

/**
 * التحقق من حالة الاتصال
 */
export const isConnected = async (skipCache = false): Promise<boolean> => {
  if (!skipCache) {
    const status = getLastConnectionStatus();
    // التحقق مما إذا كان الاتصال قد تم التحقق منه في الدقائق الخمس الماضية
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    if (status.timestamp && new Date(status.timestamp) > fiveMinutesAgo) {
      return status.isConnected;
    }
  }
  
  // إذا كانت آخر حالة قديمة، تحقق مرة أخرى
  const result = await checkConnection();
  return result.isConnected;
};

/**
 * الحصول على عنوان IP التالي من القائمة المسموح بها
 */
export const getNextIp = (): string => {
  const lastIndex = parseInt(localStorage.getItem('last_ip_index') || '0');
  const newIndex = (lastIndex + 1) % RENDER_ALLOWED_IPS.length;
  localStorage.setItem('last_ip_index', newIndex.toString());
  return RENDER_ALLOWED_IPS[newIndex];
};

/**
 * إنشاء رؤوس أساسية للطلبات
 */
export const createBaseHeaders = (ipAddress?: string): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'X-Client-Id': 'web-client',
    'Origin': window.location.origin,
    'Cache-Control': 'no-cache, no-store',
    'Pragma': 'no-cache',
    ...(ipAddress ? { 'X-Forwarded-For': ipAddress } : {})
  };
};

/**
 * إنشاء إشارة مهلة
 */
export const createTimeoutSignal = (timeout: number): AbortSignal => {
  return AbortSignal.timeout(timeout);
};

/**
 * إنشاء خيارات الجلب
 */
export const createFetchOptions = (method: string, body?: any, timeout: number = 30000, headers: Record<string, string> = {}): RequestInit => {
  return {
    method,
    headers: {
      ...createBaseHeaders(),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: createTimeoutSignal(timeout),
    mode: 'cors',
    credentials: 'omit'
  };
};

/**
 * الحصول على مهلة الاتصال
 */
export const getConnectionTimeout = (): number => {
  return 30000; // 30 ثانية افتراضياً
};

/**
 * جلب مع إعادة المحاولة
 */
export const fetchWithRetry = async (url: string, options: RequestInit, retries: number = 3, delay: number = 1000): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('فشلت جميع محاولات الاتصال');
};
