
/**
 * عنوان خادم الأتمتة واستراتيجية الاتصال
 */

// تعريف عناوين IP المسموح بها
export const RENDER_ALLOWED_IPS = [
  "render.com",
  "onrender.com",
  "api.render.com"
];

// حالة الاتصال الأخيرة
interface ConnectionStatus {
  isConnected: boolean;
  lastCheck: number;
  retryCount: number;
}

// تخزين حالة الاتصال
let lastConnectionStatus: ConnectionStatus = {
  isConnected: false,
  lastCheck: 0,
  retryCount: 0
};

// تعيين عنوان الخادم بناءً على البيئة
export const automationServerUrl = import.meta.env.VITE_AUTOMATION_SERVER_URL || 
                                  "https://textify-upload.onrender.com";

// استرجاع عنوان الخادم
export const getAutomationServerUrl = (): string => {
  return automationServerUrl;
};

// تعيين عنوان الخادم
export const setAutomationServerUrl = (url: string): void => {
  // نحن نستخدم دائمًا عنوان Render الرسمي فقط
  console.log(`تم طلب تعيين عنوان الخادم إلى: ${url}`);
  console.log("ملاحظة: نحن نستخدم عنوان Render الرسمي فقط");
};

// إعادة تعيين عنوان الخادم إلى القيمة الافتراضية
export const resetAutomationServerUrl = (): string => {
  console.log("تم إعادة تعيين عنوان الخادم إلى القيمة الافتراضية");
  return automationServerUrl;
};

// التحقق من صحة عنوان URL
export const isValidServerUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// الحصول على عنوان IP التالي للتناوب
export const getNextIp = (): string => {
  const index = Math.floor(Math.random() * RENDER_ALLOWED_IPS.length);
  return RENDER_ALLOWED_IPS[index];
};

// تحديث حالة الاتصال
export const updateConnectionStatus = (isConnected: boolean): void => {
  lastConnectionStatus = {
    isConnected,
    lastCheck: Date.now(),
    retryCount: isConnected ? 0 : lastConnectionStatus.retryCount + 1
  };
};

// الحصول على حالة الاتصال الأخيرة
export const getLastConnectionStatus = (): ConnectionStatus => {
  return lastConnectionStatus;
};

// التحقق مما إذا كان الخادم متصلاً
export const isConnected = async (showToast: boolean = false): Promise<boolean> => {
  const result = await checkConnection();
  return result.isConnected;
};

// إنشاء رؤوس HTTP أساسية
export const createBaseHeaders = (ipAddress: string = ''): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'X-Client-Id': 'web-client',
    'X-Client-Version': '1.0.0',
    'X-Request-Time': Date.now().toString(),
    'X-IP-Preference': ipAddress
  };
};

// إنشاء إشارة مهلة زمنية
export const createTimeoutSignal = (timeout: number = 30000): AbortSignal => {
  return AbortSignal.timeout(timeout);
};

// التحقق من مدة مهلة الاتصال
export const getConnectionTimeout = (): number => {
  return 30000; // 30 ثانية
};

// إنشاء خيارات الجلب
export const createFetchOptions = (method: string = 'GET', body?: any, timeout: number = 30000): RequestInit => {
  return {
    method,
    headers: createBaseHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-cache'
  };
};

// الجلب مع إعادة المحاولة
export const fetchWithRetry = async (url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`استجابة غير ناجحة: ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('حدث خطأ غير معروف');
      console.error(`فشلت المحاولة ${attempt + 1}/${maxRetries}:`, lastError);
      if (attempt < maxRetries - 1) {
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  throw lastError || new Error('فشلت جميع محاولات الجلب');
};

// الطباعة للتشخيص
console.log(`⚡️ الاتصال بخادم الأتمتة على: ${automationServerUrl}, isProduction: ${import.meta.env.PROD}`);

// تحديد ما إذا كنا في بيئة معاينة
export const isPreviewEnvironment = (): boolean => {
  // تعديل المنطق ليعود false دائمًا في البيئة الحالية للتمكن من الاختبار الفعلي
  const inPreviewMode = false;
  
  // طباعة للتشخيص
  if (inPreviewMode) {
    console.log('⚡️ تعمل في وضع المعاينة، سيتم محاكاة الأتمتة دون اتصال بخادم فعلي');
  } else {
    console.log('⚡️ تم تعيين استخدام خادم Render الرسمي فقط');
  }
  
  return inPreviewMode;
};

// التحقق من اتصال الخادم
export const checkConnection = async (): Promise<{ isConnected: boolean, details?: any, message?: string }> => {
  try {
    // إذا كنا في بيئة معاينة، نفترض أن الاتصال ناجح دائمًا
    if (isPreviewEnvironment()) {
      return { 
        isConnected: true,
        details: {
          message: "محاكاة اتصال ناجح في بيئة المعاينة",
          time: new Date().toISOString()
        },
        message: "محاكاة اتصال ناجح في بيئة المعاينة"
      };
    }
    
    console.log("محاولة اتصال سريع:", `${automationServerUrl}/api/ping`);
    
    // محاولة الاتصال بالخادم مع تجنب التخزين المؤقت
    const response = await fetch(`${automationServerUrl}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
        'x-request-time': Date.now().toString()
      }
    });
    
    // إذا كانت الاستجابة ناجحة
    if (response.ok) {
      // محاولة تحليل البيانات
      try {
        const data = await response.json();
        console.log("Ping response successful:", data);
        return { 
          isConnected: true, 
          details: data,
          message: data.message || "تم الاتصال بالخادم بنجاح"
        };
      } catch (parseError) {
        // إذا تعذر تحليل البيانات، نفترض أن الاتصال ناجح طالما أن الرد 200
        return { 
          isConnected: true,
          message: "تم الاتصال بالخادم بنجاح (بدون تفاصيل)"
        };
      }
    } else {
      // إذا كان هناك خطأ في الاستجابة
      console.error("Ping failed:", response.status, response.statusText);
      return { 
        isConnected: false,
        details: {
          status: response.status,
          statusText: response.statusText
        },
        message: `فشل الاتصال: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    // في حالة حدوث خطأ في الاتصال
    console.error("Connection check error:", error);
    return { 
      isConnected: false,
      details: { error: error instanceof Error ? error.message : "خطأ غير معروف" },
      message: error instanceof Error ? error.message : "حدث خطأ غير معروف أثناء الاتصال"
    };
  }
};
