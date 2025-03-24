
// الأنواع المستخدمة في التطبيق للأتمتة

export interface Action {
  name: string;
  finder: string;
  value?: string;
  delay?: number;
  description?: string;
  type?: string;  // جعل type اختياري في Action الأساسي
  selector?: string;
}

export interface AutomationAction extends Action {
  type: string;  // مطلوب في AutomationAction
  selector?: string;
}

export interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  screenSize: string;
}

export interface ServerOptions {
  timeout: number;
  maxRetries: number;
  useHeadlessMode: boolean;
  puppeteerOptions: {
    args: string[];
  };
  supportXPath?: boolean; // إضافة خاصية دعم XPath
}

export interface AutomationConfig {
  projectUrl: string;
  projectName?: string;
  actions: Action[] | AutomationAction[];
  useBrowserData: boolean;
  automationType: 'server' | 'client';
  forceRealExecution?: boolean;
  timeout?: number;
  retries?: number;
  browserInfo?: BrowserInfo;
  serverOptions?: ServerOptions;
}

export interface ActionResult {
  index: number;
  action: string;
  selector: string;
  value: string;
  success: boolean;
  error: string | null;
  timestamp: string;
  duration: number;
  screenshots: string[];
}

// تحسين تعريف أنواع الأخطاء مع إضافة المزيد من التفاصيل
export type ErrorType = 
  | 'ConnectionError'    // خطأ في الاتصال بالخادم
  | 'ExecutionError'     // خطأ في تنفيذ الإجراءات
  | 'ServerError'        // خطأ في الخادم
  | 'TimeoutError'       // تجاوز وقت العملية
  | 'ValidationError'    // خطأ في التحقق من صحة البيانات
  | 'ConfigurationError' // خطأ في الإعدادات
  | 'BrowserError'       // خطأ متعلق بالمتصفح
  | 'ElementNotFoundError' // لم يتم العثور على العنصر
  | 'PuppeteerError'     // خطأ في محرك Puppeteer
  | 'NetworkError'       // خطأ في الشبكة
  | 'ClientError'        // خطأ في جانب العميل
  | 'RequireError'       // خطأ في استخدام require
  | 'ModuleError'        // خطأ في تحميل الوحدات
  | 'XPathError'         // خطأ في محدد XPath
  | string;              // أي نوع آخر من الأخطاء

export interface AutomationError {
  type: ErrorType;
  message: string;
  stack?: string;
  code?: number;
  details?: string[];
}

export interface AutomationResponse {
  success: boolean;
  message: string;
  automationType: string;
  results?: ActionResult[];
  executionTime?: number;
  timestamp: string;
  details?: string[];
  error?: AutomationError;
}

export interface ServerStatusResponse {
  status: string;
  message: string;
  time: string;
  uptime: number;
  environment: string;
}

// إضافة واجهة نتيجة التحقق من الاتصال
export interface ConnectionCheckResult {
  isConnected: boolean;
  message: string;
  details?: any;
}
