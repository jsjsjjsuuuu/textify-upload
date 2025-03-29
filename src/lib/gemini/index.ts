
// تصدير الوظائف والأنواع من كافة الملفات الفرعية

// المفتاح الرئيسي المستخدم في جميع أنحاء التطبيق
export const DEFAULT_GEMINI_API_KEY = "AIzaSyCzHmpOdtuRu07jP0P4GNlCMeQB_InKT7E";

// Export main API functions
export { extractDataWithGemini, testGeminiConnection } from "./api";
export { testGeminiModels } from "./models";
export { fileToBase64, formatPrice } from "./utils";

// Export types
export type { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";
