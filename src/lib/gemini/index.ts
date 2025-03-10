
// تصدير الوظائف والأنواع من كافة الملفات الفرعية

// Export main API functions
export { 
  extractDataWithGemini, 
  testGeminiConnection,
  GeminiErrorType,
  createGeminiError,
  handleGeminiError,
  getRetryConfiguration
} from "./api";
export type { GeminiError } from "./api";
export { testGeminiModels } from "./models";
export { fileToBase64 } from "./utils";

// Export parser functions
export { parseGeminiResponse } from "./parsers";
export { 
  extractJsonFromText,
  extractFieldsFromText,
  mapArabicToEnglishFields
} from "./parsers/index";

// Export types
export type { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";

// Export configuration
export { DEFAULT_MODEL_VERSION, DEFAULT_TEMPERATURE } from "./config";
