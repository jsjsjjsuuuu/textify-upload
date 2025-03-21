export interface AutomationConfig {
  projectUrl: string;
  actions: Action[];
  useBrowserData: boolean;
  automationType: 'server' | 'client';
}

export interface Action {
  type: string;
  selector?: string;
  value?: string;
}

export interface ServerStatusResponse {
  status: string;
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
