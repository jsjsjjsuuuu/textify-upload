
export interface AutomationConfig {
  projectUrl: string;
  projectName?: string;
  actions: Action[] | AutomationAction[];
  useBrowserData: boolean;
  automationType: 'server' | 'client';
  forceRealExecution: boolean;
  timeout?: number;
  retries?: number;
}

export interface Action {
  type?: string;
  name?: string;
  selector?: string;
  finder?: string;
  value?: string;
  delay?: number;
  description?: string;
}

export interface AutomationAction {
  name: string;
  finder: string;
  value: string;
  delay: number;
  description?: string;
}

export interface ServerStatusResponse {
  status: string;
  message?: string;
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
