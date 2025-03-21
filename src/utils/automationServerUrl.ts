
// عناوين URL الخوادم الافتراضية
const DEFAULT_SERVER_URL = 'https://textify-upload.onrender.com';
const DEFAULT_VITE_SERVER_URL = 'http://localhost:3333';

// تنفيذ كود الاتصال بالخادم
type ConnectionStatus = {
  isConnected: boolean;
  message: string;
  timestamp: string;
  retryCount?: number;
};

// تخزين حالة الاتصال الأخيرة
let lastConnectionStatus: ConnectionStatus = {
  isConnected: false,
  message: 'لم يتم التحقق من الاتصال بعد',
  timestamp: new Date().toISOString(),
  retryCount: 0
};

// قائمة من عناوين IP المسموح بها لخادم Render
export const RENDER_ALLOWED_IPS = [
  '3.16.60.144',
  '3.19.142.96',
  '3.19.213.152',
  '3.19.252.19',
  '3.133.126.34',
  '3.135.216.38',
  '3.141.144.131',
  '3.142.54.191',
  '3.142.91.93',
  '3.142.206.200',
  '18.119.102.167',
  '18.119.118.198',
  '18.189.192.201',
  '18.191.64.169',
  '18.191.75.124',
  '18.191.115.81',
  '18.191.209.138',
  '18.216.84.113',
  '18.217.118.131',
  '18.218.32.9',
  '18.218.250.156',
  '18.224.195.156',
  '18.224.195.207',
  '18.225.39.118',
  '52.15.56.203',
  '52.15.57.145',
];

/**
 * الحصول على القيمة من localStorage مع التحقق من الأخطاء
 */
function getLocalStorageValue(key: string, defaultValue: string): string {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.error(`خطأ في قراءة ${key} من localStorage:`, error);
    return defaultValue;
  }
}

/**
 * الحصول على عنوان URL لخادم الأتمتة
 * يبحث أولاً في متغيرات البيئة، ثم في localStorage
 */
export const getAutomationServerUrl = (): string => {
  // محاولة الحصول على عنوان URL من localStorage
  const serverUrl = getLocalStorageValue('automation_server_url', DEFAULT_SERVER_URL);
  
  // التحقق من صحة عنوان URL
  try {
    new URL(serverUrl); // سيرمي خطأً إذا كان عنوان URL غير صالح
    return serverUrl;
  } catch (error) {
    console.error('عنوان URL لخادم الأتمتة غير صالح. استخدام القيمة الافتراضية.', error);
    return DEFAULT_SERVER_URL;
  }
};

/**
 * تعيين عنوان URL لخادم الأتمتة في localStorage
 */
export const setAutomationServerUrl = (url: string): void => {
  // التحقق من صحة URL قبل الحفظ
  try {
    new URL(url); // سيرمي خطأً إذا كان URL غير صالح
    localStorage.setItem('automation_server_url', url);
    console.log(`تم تعيين عنوان URL لخادم الأتمتة: ${url}`);
  } catch (error) {
    console.error('عنوان URL غير صالح:', error);
    throw new Error('عنوان URL غير صالح');
  }
};

/**
 * إعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية
 */
export const resetAutomationServerUrl = (): string => {
  localStorage.removeItem('automation_server_url');
  console.log(`تم إعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية: ${DEFAULT_SERVER_URL}`);
  return DEFAULT_SERVER_URL;
};

/**
 * تحقق مما إذا كنا في بيئة المعاينة
 */
export const isPreviewEnvironment = (): boolean => {
  // تم تعديل السلوك ليرجع دائمًا false بغض النظر عن البيئة الحقيقية
  console.log("فحص بيئة المعاينة - تم إجبار استخدام وضع التنفيذ الفعلي");
  return false;
};

/**
 * التحقق مما إذا كان عنوان URL للخادم صالحًا
 */
export const isValidServerUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

/**
 * تحديث حالة الاتصال بالخادم
 */
export const updateConnectionStatus = (status: Partial<ConnectionStatus>): void => {
  lastConnectionStatus = {
    ...lastConnectionStatus,
    ...status,
    timestamp: new Date().toISOString()
  };
};

/**
 * الحصول على آخر حالة اتصال بالخادم
 */
export const getLastConnectionStatus = (): ConnectionStatus => {
  return { ...lastConnectionStatus };
};

/**
 * الحصول على مهلة الاتصال المناسبة بناءً على حالة الخادم
 */
export const getConnectionTimeout = (): number => {
  // زيادة مهلة الاتصال إذا كان الخادم من Render وكان في حالة السكون
  const serverUrl = getAutomationServerUrl();
  if (serverUrl.includes('render.com')) {
    // مهلة أطول لخادم Render عند بدء التشغيل (30 ثانية)
    return 30000;
  }
  // مهلة قياسية (10 ثواني)
  return 10000;
};

/**
 * إنشاء الرؤوس الأساسية للطلبات
 */
export const createBaseHeaders = (ipAddress?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Client-Id': 'web-client',
    'Cache-Control': 'no-cache, no-store',
    'Pragma': 'no-cache'
  };

  if (ipAddress) {
    headers['X-Forwarded-For'] = ipAddress;
  }

  return headers;
};

/**
 * إنشاء إشارة المهلة
 */
export const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
};

/**
 * الحصول على عنوان IP التالي من قائمة العناوين المسموح بها
 */
export const getNextIp = (): string => {
  const randomIndex = Math.floor(Math.random() * RENDER_ALLOWED_IPS.length);
  return RENDER_ALLOWED_IPS[randomIndex];
};

/**
 * تنفيذ الاستعلام مع إعادة المحاولة
 */
export const fetchWithRetry = async <T>(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  retryDelay = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`فشل الطلب مع رمز الحالة: ${response.status}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`فشلت المحاولة ${attempt + 1}/${maxRetries}: ${lastError.message}`);
      
      if (attempt < maxRetries - 1) {
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new Error('فشلت جميع محاولات الاتصال');
};

/**
 * إنشاء خيارات الاستعلام
 */
export const createFetchOptions = (
  method: string = 'GET',
  body: object | null = null,
  timeoutMs: number = 10000
): RequestInit => {
  const signal = createTimeoutSignal(timeoutMs);
  
  const options: RequestInit = {
    method,
    headers: createBaseHeaders(),
    signal
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
};

/**
 * التحقق من الاتصال بخادم الأتمتة
 */
export const checkConnection = async (): Promise<ConnectionStatus> => {
  console.log('محاولة اتصال سريع:', `${getAutomationServerUrl()}/api/ping`);
  
  // تعيين مهلة الاتصال بناءً على خادم الاتصال
  const timeoutMs = getConnectionTimeout();
  const signal = createTimeoutSignal(timeoutMs);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${getAutomationServerUrl()}/api/ping`, {
      method: 'GET',
      headers: createBaseHeaders(),
      signal
    });
    
    if (!response.ok) {
      throw new Error(`فشل الطلب مع رمز الحالة: ${response.status}`);
    }
    
    const pingResult = await response.json();
    console.log('Ping response successful:', pingResult);
    
    // تحديث حالة الاتصال
    const connectionStatus: ConnectionStatus = {
      isConnected: true,
      message: 'تم الاتصال بخادم الأتمتة بنجاح',
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    updateConnectionStatus(connectionStatus);
    return connectionStatus;
  } catch (error) {
    console.error('فشل في الاتصال بخادم الأتمتة:', error);
    
    // زيادة عدد محاولات إعادة الاتصال
    const retryCount = (lastConnectionStatus.retryCount || 0) + 1;
    
    // تحديث حالة الاتصال
    const connectionStatus: ConnectionStatus = {
      isConnected: false,
      message: `تعذر الاتصال بخادم الأتمتة: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
      retryCount
    };
    
    updateConnectionStatus(connectionStatus);
    return connectionStatus;
  }
};

// إضافة دعم لأدوات المطور
export const isConnected = (): boolean => {
  return lastConnectionStatus.isConnected;
};
