
/**
 * أنواع البيانات المستخدمة في وظائف Gemini
 */

export interface GeminiExtractParams {
  apiKey: string;
  imageBase64: string;
  extractionPrompt?: string;
  temperature?: number;
  modelVersion?: string;
  enhancedExtraction?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface GeminiRequest {
  contents: {
    parts: {
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }[];
  }[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topK: number;
    topP: number;
  };
}

export interface GeminiResponse {
  candidates?: {
    content: {
      parts: {
        text?: string;
      }[];
    };
    finishReason?: string;
  }[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: {
      category: string;
      probability: string;
    }[];
  };
}

// أنواع البيانات المستخرجة
export interface ExtractedData {
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  [key: string]: string | undefined;
}

// إعدادات نماذج Gemini
export interface GeminiModelSettings {
  maxTokens: number;
  temperature: number;
  topK: number;
  topP: number;
}
