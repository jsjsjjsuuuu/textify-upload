
/**
 * تعريفات الأنواع لوحدة الأتمتة
 */

/**
 * تكوين الأتمتة المستخدم في طلب الأتمتة
 */
export interface AutomationConfig {
  projectName?: string;
  projectUrl: string;
  actions: AutomationAction[];
  automationType?: 'server' | 'client';
  useBrowserData?: boolean;
  forceRealExecution?: boolean;
  timeout?: number;
  retries?: number;
}

/**
 * تمثيل إجراء الأتمتة الفردي
 */
export interface AutomationAction {
  name: string;
  type?: string;
  finder: string;
  value: string;
  delay: number;
  description?: string;
  isXPath?: boolean; // إضافة دعم لتحديد نوع المحدد
}

/**
 * نتيجة تنفيذ الأتمتة
 */
export interface AutomationResponse {
  success: boolean;
  message: string;
  automationType: 'server' | 'client';
  results?: AutomationActionResult[];
  executionTime?: number;
  error?: AutomationError;
  timestamp: string;
  details?: string[];
}

/**
 * نتيجة تنفيذ إجراء فردي
 */
export interface AutomationActionResult {
  success: boolean;
  action: AutomationAction;
  message?: string;
  error?: AutomationError;
  timestamp?: string;
  screenshot?: string;
}

/**
 * تمثيل خطأ الأتمتة
 */
export interface AutomationError {
  message: string;
  type?: string;
  stack?: string;
  code?: string;
  details?: any;
}

/**
 * خيارات الخادم لتنفيذ الأتمتة
 */
export interface ServerOptions {
  timeout?: number;
  navigationTimeout?: number;
  retries?: number;
  useCache?: boolean;
  disableCors?: boolean;
  supportXPath?: boolean; // إضافة دعم XPath
}

/**
 * استجابة حالة الخادم
 */
export interface ServerStatusResponse {
  status: string;
  message: string;
  time: string;
  uptime?: number;
  environment?: string;
}

/**
 * معلومات حالة الاتصال
 */
export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: string;
  serverUrl?: string;
  error?: string;
}
