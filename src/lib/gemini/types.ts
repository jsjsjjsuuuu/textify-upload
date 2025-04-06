
export interface ApiOptions {
  apiKey: string;
  imageBase64?: string;
  text?: string;
  prompt?: string;
  modelVersion?: string;
  temperature?: number;
  enhancedExtraction?: boolean;
}

export interface ApiResult {
  success: boolean;
  data?: any;
  message?: string;
  apiKeyError?: boolean;
}

export interface ExtractedTextResult {
  extractedText?: string;
  confidence?: number;
  parsedData?: {
    [key: string]: string;
  }
}

export interface GeminiApiResponse {
  error?: {
    message?: string;
    code?: number;
  };
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export interface DataExtractorOptions {
  apiKey: string;
  imageBase64: string;
  modelVersion?: string;
  temperature?: number;
  enhancedExtraction?: boolean;
}

export interface ApiKeyStatus {
  total: number;
  active: number;
  blocked: number;
  rateLimited: number;
  lastReset: number;
}

// إضافة انواع للتصدير للتوافق مع index.ts
export type GeminiExtractParams = ApiOptions;
export type GeminiRequest = ExtractedTextResult;
export type GeminiResponse = GeminiApiResponse;
