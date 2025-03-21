
/**
 * أنواع البيانات المستخدمة في نظام الأتمتة
 */

/**
 * تكوين الأتمتة
 */
export interface AutomationConfig {
  projectName?: string;
  projectUrl: string;
  actions: AutomationAction[];
  ipAddress?: string; // عنوان IP المستخدم للطلب
  retryCount?: number; // عدد محاولات إعادة المحاولة
  automationType?: 'server' | 'client'; // نوع الأتمتة (خادم أو عميل)
  useBrowserData?: boolean; // استخدام بيانات المتصفح (الكوكيز وبيانات التسجيل)
}

/**
 * إجراء الأتمتة
 */
export interface AutomationAction {
  name: string;
  finder: string;
  value: string;
  delay: number;  // يجب أن يكون الفاصل الزمني رقمًا وليس نصًا
}

/**
 * استجابة حالة الخادم
 */
export interface ServerStatusResponse {
  status: string;
  message: string;
  time?: string;
  version?: string;
  uptime?: number;
  environment?: string;
  clientIp?: string; // عنوان IP الذي تم اكتشافه بواسطة الخادم
  systemInfo?: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    env: string;
  };
}

/**
 * استجابة الأتمتة
 */
export interface AutomationResponse {
  success: boolean;
  message: string;
  result?: any;
  error?: string;
  clientIp?: string; // عنوان IP المستخدم
  automationType?: 'server' | 'client'; // نوع الأتمتة المستخدم
  details?: string[];  // إضافة خاصية details لتخزين تفاصيل إضافية عن الأتمتة
}

/**
 * حالة الاتصال
 */
export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: number;
  retryCount: number;
  lastUsedIp: string;
}

/**
 * تكوين إجراءات الأتمتة
 */
export interface AutomationActionConfig {
  id: string;
  name: string;
  description: string;
  finder: string;
  value: string;
  delay: number;
  enabled: boolean;
}

/**
 * نتيجة تنفيذ إجراء أتمتة
 */
export interface AutomationActionResult {
  actionId: string;
  success: boolean;
  value?: string;
  error?: string;
  executionTime: number;
}

/**
 * حالة تنفيذ الأتمتة
 */
export interface AutomationExecutionStatus {
  id: string;
  startTime: number;
  endTime?: number;
  actions: AutomationActionResult[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  url: string;
}
