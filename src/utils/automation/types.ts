
export interface AutomationAction {
  name: string;
  finder?: string;
  value?: string;
  delay?: number;
  type?: string;
  selector?: string;
  timeout?: number;
}

export interface AutomationConfig {
  projectName?: string;
  projectUrl: string;
  actions: AutomationAction[];
  automationType: "server" | "client";
  useBrowserData?: boolean;
  forceRealExecution?: boolean; // إضافة حقل forceRealExecution
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
  screenshots?: string[];
}

export interface AutomationResponse {
  success: boolean;
  message: string;
  automationType: string;
  details?: string[];
  results?: ActionResult[];
  executionTime?: number;
  timestamp?: string;
  error?: {
    message: string;
    type?: string;
    stack?: string;
  };
}

export interface ServerStatusResponse {
  status: string;
  message: string;
  time: string;
  uptime: number;
  environment?: string;
}
