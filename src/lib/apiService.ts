export interface ApiResult {
  success: boolean;
  message: string;
  data?: any;
  extractedText?: string;
  confidence?: number;
}
