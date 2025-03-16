
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
  time: string;
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
