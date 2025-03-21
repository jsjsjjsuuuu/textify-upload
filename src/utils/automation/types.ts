
export interface AutomationConfig {
  projectUrl: string;
  projectName?: string;
  actions: Action[] | AutomationAction[];
  useBrowserData: boolean;
  automationType: 'server' | 'client';
  forceRealExecution: boolean;
  timeout?: number; // إضافة حقل مهلة اختياري
  retries?: number; // إضافة حقل محاولات اختياري
}

export interface Action {
  type: string;
  selector?: string;
  value?: string;
  name?: string;
  finder?: string;
  delay?: number;
  description?: string; // إضافة حقل الوصف
}

// إضافة واجهة AutomationAction لدعم المكونات الحالية
export interface AutomationAction {
  name: string;
  finder: string;
  value: string;
  delay: number;
  description?: string; // إضافة حقل الوصف
}

export interface ServerStatusResponse {
  status: string;
  message?: string; // إضافة حقل الرسالة
  time: string;
  uptime: number;
  environment: string;
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

export interface AutomationResponse {
  success: boolean;
  message: string;
  automationType: 'server' | 'client';
  details?: string[];
  results?: ActionResult[];
  executionTime?: number;
  timestamp?: string;
  error?: {
    message: string;
    stack?: string;
    type: string; // تحديد نوع الخطأ لتوفير معلومات محددة للمستخدم
  };
}

// إضافة أنواع الأخطاء الشائعة للتعامل معها بشكل أفضل
export enum ErrorType {
  NetworkError = 'NetworkError',
  TimeoutError = 'TimeoutError',
  CORSError = 'CORSError',
  StreamReadError = 'StreamReadError',
  ExecutionError = 'ExecutionError',
  ResponseFormatError = 'ResponseFormatError',
  EndpointNotFoundError = 'EndpointNotFoundError',
  AuthorizationError = 'AuthorizationError',
  ServerError = 'ServerError',
  URLError = 'URLError'
}

// إضافة واجهة للتعامل مع أخطاء عنوان URL
export interface URLValidationResult {
  isValid: boolean;
  correctedUrl?: string;
  error?: string;
}
