
/**
 * وحدة إدارة عنوان خادم الأتمتة
 */

// القيمة الافتراضية لعنوان خادم الأتمتة
const DEFAULT_AUTOMATION_SERVER_URL = 'https://textify-upload.onrender.com';

// مفتاح لتخزين عنوان الخادم في التخزين المحلي
const SERVER_URL_STORAGE_KEY = 'automation_server_url';
const CONNECTION_STATUS_KEY = 'automation_server_connection_status';

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
      setConnectionStatus(true, "اتصال ناجح");
      
      return {
        isConnected: true,
        message: data.message || "تم الاتصال بنجاح بخادم الأتمتة"
      };
    } else {
      const errorText = await response.text();
      console.error("Ping response failed:", response.status, errorText);
      
      // تحديث حالة الاتصال في التخزين المحلي
      setConnectionStatus(false, `فشل الاتصال: ${response.status} ${errorText}`);
      
      return {
        isConnected: false,
        message: `فشل الاتصال بخادم الأتمتة: ${response.status} ${errorText}`
      };
    }
  } catch (error) {
    console.error("Error during connection check:", error);
    
    // تحديث حالة الاتصال في التخزين المحلي
    setConnectionStatus(false, `خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    
    return {
      isConnected: false,
      message: `خطأ في الاتصال بخادم الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
    };
  }
};

/**
 * تخزين حالة اتصال الخادم
 */
const setConnectionStatus = (isConnected: boolean, message: string): void => {
  try {
    const status = {
      isConnected,
      message,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(CONNECTION_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error("خطأ في تخزين حالة اتصال الخادم:", error);
  }
};

/**
 * الحصول على آخر حالة اتصال مخزنة
 */
export const getLastConnectionStatus = (): { isConnected: boolean; message: string; timestamp: string } => {
  try {
    const storedStatus = localStorage.getItem(CONNECTION_STATUS_KEY);
    
    if (storedStatus) {
      return JSON.parse(storedStatus);
    }
    
    // القيمة الافتراضية إذا لم يتم تخزين أي حالة بعد
    return {
      isConnected: true, // نفترض أنه متصل افتراضياً لتفادي رسائل الخطأ غير الضرورية
      message: "لم يتم التحقق من الاتصال بعد",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("خطأ في الحصول على آخر حالة اتصال:", error);
    
    // في حالة حدوث خطأ
    return {
      isConnected: false,
      message: "خطأ في استرداد حالة الاتصال",
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * إعادة تعيين عنوان الخادم إلى القيمة الافتراضية
 */
export const resetServerUrlToDefault = (): string => {
  setAutomationServerUrl(DEFAULT_AUTOMATION_SERVER_URL);
  return DEFAULT_AUTOMATION_SERVER_URL;
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
