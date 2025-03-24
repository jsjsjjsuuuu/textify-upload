
// الأنواع المستخدمة في الأتمتة
export interface AutomationConfig {
  projectUrl: string;
  projectName?: string;
  actions: any[];
  useBrowserData: boolean;
  automationType: 'server' | 'client';
  forceRealExecution?: boolean;
  timeout?: number;
  browserInfo?: {
    userAgent: string;
    language: string;
    platform: string;
    screenSize: string;
  };
  serverOptions?: {
    timeout: number;
    maxRetries: number;
    useHeadlessMode: boolean;
    puppeteerOptions: {
      args: string[];
    };
    supportXPath?: boolean;
  };
}

export interface AutomationResponse {
  success: boolean;
  message: string;
  automationType: string;
  results?: any[];
  executionTime?: number;
  timestamp: string;
  details?: string[];
  error?: any;
}

export interface Action {
  name: string;
  finder: string;
  value?: string;
  delay?: number;
  description?: string;
}

export interface AutomationAction extends Action {
  type: string;
  finder: string;
  selector?: string;
  isXPath?: boolean;
}

export interface ServerOptions {
  timeout: number;
  maxRetries: number;
  useHeadlessMode: boolean;
  puppeteerOptions: {
    args: string[];
  };
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

export type ErrorType = 
  | 'ConnectionError'
  | 'ExecutionError'
  | 'ServerError'
  | 'TimeoutError'
  | 'ValidationError'
  | 'ConfigurationError'
  | 'BrowserError'
  | 'ElementNotFoundError'
  | 'PuppeteerError'
  | 'NetworkError'
  | 'ClientError'
  | 'RequireError'
  | 'ModuleError'
  | 'XPathError'
  | string;

export interface ServerStatusResponse {
  status: string;
  message: string;
  time: string;
  uptime: number;
  environment: string;
}

export interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  screenSize: string;
}

export interface ConnectionCheckResult {
  isConnected: boolean;
  message: string;
  details?: any;
}

export interface AutomationError {
  type: ErrorType;
  message: string;
  stack?: string;
  code?: number;
  details?: string[];
}
