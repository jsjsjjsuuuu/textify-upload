
/**
 * أنواع البيانات لواجهة Gemini API
 */

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

// طلب Gemini API
export interface GeminiRequest {
  contents: {
    parts: (
      | { text: string }
      | {
          inline_data: {
            mime_type: string;
            data: string;
          };
        }
    )[];
  }[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topK: number;
    topP: number;
  };
}

// نوع استجابة Gemini API
export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text?: string;
      }[];
    };
    finishReason: string;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: {
      category: string;
      probability: string;
    }[];
  };
}

// نوع البيانات المستخرجة
export interface ExtractedData {
  extractedText: string;
  parsedData: Record<string, string>;
  confidence: number;
}
