
// أنواع خاصة بـ Gemini API

// معلمات استخراج البيانات
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

// نوع طلب Gemini
export interface GeminiRequest {
  contents: {
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topK: number;
    topP: number;
  };
}

// نوع استجابة Gemini
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: any[];
  }>;
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: any[];
  };
}

// نوع استخراج البيانات
export interface GeminiExtractedData {
  extractedText: string;
  parsedData: any;
  confidence?: number;
}

// نوع نتيجة الاستخراج لإضافة معلومات حول أخطاء المفتاح
export interface ApiResult {
  success: boolean;
  message: string;
  data?: GeminiExtractedData | Record<string, any>;
  apiKeyError?: boolean; // إضافة حقل لتحديد ما إذا كان الخطأ متعلقًا بمفتاح API
}
