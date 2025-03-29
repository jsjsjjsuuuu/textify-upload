
// تصدير الوظائف والأنواع من كافة الملفات الفرعية

// المفتاح الرئيسي المستخدم في جميع أنحاء التطبيق
export const DEFAULT_GEMINI_API_KEY = "AIzaSyBUwu7p61Rk1BHYJb5sa-CUMuN_6ImuQOc";

// Export main API functions
export { extractDataWithGemini, testGeminiConnection } from "./api";
export { testGeminiModels } from "./models";
export { fileToBase64, formatPrice } from "./utils";

// Export types
export type { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";
