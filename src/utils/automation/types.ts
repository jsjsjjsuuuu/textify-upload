
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

export type ErrorType = 'ConnectionError' | 'ExecutionError' | 'ServerError' | 'TimeoutError' | 'ValidationError' | 'ConfigurationError' | string;

export interface AutomationError {
  type: ErrorType;
  message: string;
  stack?: string;
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
