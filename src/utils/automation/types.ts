
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
}

/**
 * إجراء الأتمتة
 */
export interface AutomationAction {
  name: string;
  finder: string;
  value: string;
  delay: number;
}

/**
 * استجابة حالة الخادم
 */
export interface ServerStatusResponse {
  status: string;
  message: string;
  time: string;
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
}
