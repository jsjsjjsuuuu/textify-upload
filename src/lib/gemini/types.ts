
import { ApiResult } from "../apiService";

export interface GeminiRequest {
  contents: {
    parts: {
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      }
    }[];
    role?: string;
  }[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
      role: string;
    };
    finishReason: string;
    index: number;
  }[];
  promptFeedback: {
    blockReason?: string;
  };
}

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
