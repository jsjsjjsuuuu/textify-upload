
// قائمة بعناوين IP المسموح بها لخادم Render
export const RENDER_ALLOWED_IPS = [
  "34.106.88.0",
  "34.94.46.128",
  "34.82.138.64",
  "34.106.239.128",
  "34.106.102.192",
  "34.106.40.64",
  "34.82.189.128",
  "35.188.224.192"
];

// متغير مؤقت لتسجيل آخر عنوان IP تم استخدامه
let lastUsedIpIndex = 0;

// دالة للحصول على عنوان IP التالي في القائمة (للتناوب)
export function getNextIp(): string {
  const ip = RENDER_ALLOWED_IPS[lastUsedIpIndex];
  lastUsedIpIndex = (lastUsedIpIndex + 1) % RENDER_ALLOWED_IPS.length;
  return ip;
}

// وقت مهلة الاتصال الافتراضي بالثواني
const DEFAULT_CONNECTION_TIMEOUT = 15000; // 15 ثانية
let connectionTimeout = DEFAULT_CONNECTION_TIMEOUT;

// دالة لضبط وقت مهلة الاتصال
export function setConnectionTimeout(timeout: number): void {
  connectionTimeout = timeout;
}

// دالة للحصول على وقت مهلة الاتصال الحالي
export function getConnectionTimeout(): number {
  return connectionTimeout;
}

// دالة للتحقق من صحة عنوان URL
export function isValidServerUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// دالة جديدة لتعيين عنوان URL لخادم الأتمتة
export function setAutomationServerUrl(url: string): void {
  if (!isValidServerUrl(url)) {
    throw new Error("عنوان URL غير صالح");
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('automationServerUrl', url);
  }
  
  console.log("تم تعيين عنوان URL لخادم الأتمتة:", url);
}

// كشف وتعيين URL الخادم بترتيب أولوية معين
export function getAutomationServerUrl(): string {
  // تحقق أولاً من متغير البيئة في المتصفح
  if (typeof window !== 'undefined') {
    // 1. البحث في import.meta.env (أعلى أولوية)
    if (typeof import.meta !== 'undefined' && 
        import.meta.env && 
        import.meta.env.VITE_AUTOMATION_SERVER_URL) {
      console.log("استخدام VITE_AUTOMATION_SERVER_URL من import.meta.env:", import.meta.env.VITE_AUTOMATION_SERVER_URL);
      return import.meta.env.VITE_AUTOMATION_SERVER_URL;
    }
    
    // 2. البحث في process.env
    if (typeof process !== 'undefined' && process.env) {
      // تحقق من متغيرات البيئة المختلفة بترتيب الأولوية
      const envVars = [
        'VITE_AUTOMATION_SERVER_URL',
        'AUTOMATION_SERVER_URL',
        'RENDER_EXTERNAL_URL',
        'RAILWAY_PUBLIC_DOMAIN'
      ];
      
      for (const varName of envVars) {
        if (process.env[varName]) {
          console.log(`استخدام متغير البيئة ${varName} من process.env:`, process.env[varName]);
          return process.env[varName];
        }
      }
    }
    
    // 3. محاولة استرجاع القيمة المخزنة محليًا
    const savedUrl = localStorage.getItem('automationServerUrl');
    if (savedUrl) {
      console.log("استخدام عنوان URL المخزن محليًا:", savedUrl);
      return savedUrl;
    }
    
    // 4. عودة إلى أصل الموقع الحالي
    const origin = window.location.origin;
    console.log("استخدام أصل الموقع الحالي:", origin);
    return origin;
  }
  
  // في بيئة Node.js
  if (typeof process !== 'undefined' && process.env) {
    // تحقق من متغيرات البيئة المختلفة بترتيب الأولوية
    const envVars = [
      'VITE_AUTOMATION_SERVER_URL',
      'AUTOMATION_SERVER_URL',
      'RENDER_EXTERNAL_URL',
      'RAILWAY_PUBLIC_DOMAIN'
    ];
    
    for (const varName of envVars) {
      if (process.env[varName]) {
        console.log(`[Node.js] استخدام متغير البيئة ${varName}:`, process.env[varName]);
        return process.env[varName];
      }
    }
  }
  
  // القيمة الافتراضية
  return 'https://textify-upload.onrender.com';
}

// دالة لإعادة تعيين عنوان URL لخادم الأتمتة إلى القيمة الافتراضية
export function resetAutomationServerUrl(): void {
  localStorage.removeItem('automationServerUrl');
}

// دالة للتحقق من حالة الاتصال بالخادم
export async function isConnected(showToasts: boolean = false): Promise<boolean> {
  const url = getAutomationServerUrl();
  try {
    // طباعة تفاصيل الاتصال للتصحيح
    console.log("استخدام عنوان URL للاتصال:", url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), getConnectionTimeout());
    
    const response = await fetch(`${url}/api/status`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`فشل الاتصال بالخادم: ${response.status} ${response.statusText}`);
      return false;
    }
    const data = await response.json();
    console.log("حالة الخادم:", data);
    return true;
  } catch (error) {
    console.error("خطأ في الاتصال بالخادم:", error);
    return false;
  }
}

// واجهة لحالة الاتصال الأخيرة
export interface ConnectionStatus {
  isConnected: boolean;
  lastAttempt: number;
  retryCount: number;
  lastChecked: number;
  lastUsedIp?: string;
}

// دالة لتحديث حالة الاتصال
export function updateConnectionStatus(isConnected: boolean, lastUsedIp?: string): void {
  const currentStatus = getLastConnectionStatus();
  const updatedStatus: ConnectionStatus = {
    isConnected,
    lastAttempt: currentStatus.lastAttempt,
    retryCount: isConnected ? 0 : currentStatus.retryCount + 1,
    lastChecked: Date.now(),
    lastUsedIp: lastUsedIp || currentStatus.lastUsedIp
  };
  
  setLastConnectionStatus(updatedStatus);
}

// دالة جديدة للتحقق من الاتصال وإرجاع رسالة مفصلة
export async function checkConnection(): Promise<{ isConnected: boolean; message: string }> {
  const url = getAutomationServerUrl();
  try {
    console.log("استخدام عنوان URL للتحقق:", url);
    
    // استخدام رؤوس طلب أكثر تحديدًا
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-Source': 'textify-app'
    };
    
    // طباعة الرؤوس المستخدمة للتصحيح
    console.log("الرؤوس المستخدمة:", headers);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), getConnectionTimeout());
    
    const response = await fetch(`${url}/api/status`, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        isConnected: false,
        message: `فشل الاتصال بالخادم: ${response.status} ${response.statusText}`
      };
    }
    const data = await response.json();
    if (!data.status || data.status !== 'ok') {
      return {
        isConnected: false,
        message: `الخادم غير مستجيب: ${JSON.stringify(data)}`
      };
    }
    return {
      isConnected: true,
      message: 'الخادم متصل ومستجيب'
    };
  } catch (error) {
    // تحسين رسائل الخطأ
    let errorMessage = 'خطأ في الاتصال بالخادم';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'انتهت مهلة الاتصال: تأكد من أن الخادم يعمل وأن العنوان صحيح';
      } else {
        errorMessage = `خطأ في الاتصال بالخادم: ${error.message}`;
      }
    }
    
    return {
      isConnected: false,
      message: errorMessage
    };
  }
}

// دالة لتخزين حالة الاتصال الأخيرة
export function setLastConnectionStatus(status: ConnectionStatus): void {
  localStorage.setItem('lastConnectionStatus', JSON.stringify(status));
}

// دالة لاسترجاع حالة الاتصال الأخيرة
export function getLastConnectionStatus(): ConnectionStatus {
  const storedStatus = localStorage.getItem('lastConnectionStatus');
  if (storedStatus) {
    try {
      return JSON.parse(storedStatus) as ConnectionStatus;
    } catch (e) {
      console.error("خطأ في تحليل بيانات حالة الاتصال:", e);
    }
  }
  return { 
    isConnected: false, 
    lastAttempt: 0, 
    retryCount: 0, 
    lastChecked: 0 
  };
}

// دالة لإنشاء رؤوس الطلب الأساسية
export function createBaseHeaders(clientIp?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Request-Source': 'textify-app'
  };
  
  // إضافة رؤوس IP إذا كانت متوفرة
  if (clientIp) {
    headers['X-Forwarded-For'] = clientIp;
    headers['X-Render-Client-IP'] = clientIp;
  }
  
  // إضافة رؤوس أخرى مهمة
  const serverUrl = getAutomationServerUrl();
  headers['Origin'] = serverUrl;
  headers['Referer'] = serverUrl;
  
  return headers;
}

// دالة لإنشاء خيارات الطلب (fetch options)
export function createFetchOptions(
  method: string,
  body?: any,
  additionalHeaders?: Record<string, string>,
  timeout: number = getConnectionTimeout()
): RequestInit {
  const headers = {
    ...createBaseHeaders(getNextIp()),
    ...additionalHeaders
  };
  
  const options: RequestInit = {
    method,
    headers,
    mode: 'cors',
    credentials: 'omit',
  };
  
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  return options;
}

// دالة لتنفيذ طلب مع محاولات إعادة تلقائية
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Response> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      // إضافة رقم المحاولة إلى الرؤوس لتتبع المحاولات
      if (retries > 0 && options.headers) {
        const headers = options.headers as Record<string, string>;
        headers['X-Retry-Count'] = retries.toString();
        
        // استخدام عنوان IP مختلف في كل محاولة
        const newIp = getNextIp();
        headers['X-Forwarded-For'] = newIp;
        headers['X-Render-Client-IP'] = newIp;
      }
      
      // تحديد وقت المهلة
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), getConnectionTimeout());
      
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`فشل في المحاولة ${retries + 1}/${maxRetries}:`, error);
      retries++;
      
      if (retries < maxRetries) {
        // انتظار قبل إعادة المحاولة مع زيادة الوقت بشكل تصاعدي
        const delay = initialDelay * Math.pow(2, retries - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
  throw lastError || new Error("فشلت جميع محاولات الاتصال");
}
