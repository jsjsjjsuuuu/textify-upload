
// تصدير الوظائف والأنواع من كافة الملفات الفرعية

// تصدير مدير مفاتيح API
export { 
  DEFAULT_GEMINI_API_KEY, 
  getNextApiKey,
  reportApiKeyError,
  resetAllApiKeys,
  getApiKeyStats,
  addApiKey,
  getCurrentApiKey,
  isCustomKeyActive
} from "./apiKeyManager";

// تصدير وظائف API الرئيسية
export { extractTextFromImage, testConnection } from "./api";
export { testGeminiModels } from "./models";
export { fileToBase64, formatPrice } from "./utils";

// تصدير الأنواع
export type { ApiOptions, ApiResult, ExtractedTextResult } from "./types";
