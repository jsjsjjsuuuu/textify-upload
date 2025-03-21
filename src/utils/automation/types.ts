
export interface AutomationConfig {
  projectUrl: string;
  projectName?: string; // إضافة اسم المشروع كحقل اختياري
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
    type: string;
  };
}
