
// الواجهات والأنواع المستخدمة في نظام Gemini API

// معلمات استخراج البيانات
export interface GeminiExtractParams {
  apiKey: string;
  imageBase64: string;
  extractionPrompt?: string;
  extractionPromptType?: string; // نوع المطالبة المستخدمة
  temperature?: number;
  modelVersion?: string;
  enhancedExtraction?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

// طلب Gemini API
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

// استجابة Gemini API
export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text?: string;
      }[];
    };
    finishReason?: string;
    safetyRatings?: any[];
  }[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: any[];
  };
}

// بيانات مستخرجة
export interface ParsedData {
  companyName?: string;
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  confidence?: number;
  [key: string]: any;
}

// بيانات مستخرجة مع النص المستخرج
export interface ExtractedData {
  extractedText: string;
  parsedData: ParsedData;
  confidence: number;
}
