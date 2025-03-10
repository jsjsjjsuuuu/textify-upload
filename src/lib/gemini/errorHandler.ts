
import { ApiResult } from "../apiService";
import { handleRateLimiting } from "./networkUtils";
import { MAX_RETRIES } from "./config";

/**
 * العالات المحتملة لأخطاء API Gemini
 */
export enum GeminiErrorType {
  RATE_LIMIT = "RATE_LIMIT",
  SERVER_ERROR = "SERVER_ERROR",
  AUTHORIZATION = "AUTHORIZATION",
  BLOCKED_CONTENT = "BLOCKED_CONTENT",
  VALIDATION = "VALIDATION",
  EMPTY_RESPONSE = "EMPTY_RESPONSE",
  NETWORK = "NETWORK",
  PARSING = "PARSING",
  UNKNOWN = "UNKNOWN"
}

/**
 * واجهة الخطأ الموحدة لأخطاء Gemini
 */
export interface GeminiError {
  type: GeminiErrorType;
  message: string;
  originalError?: any;
  statusCode?: number;
  isRetryable: boolean;
  recommendedAction?: string;
}

/**
 * تحديد نوع الخطأ من استجابة Gemini API
 */
export function determineErrorType(
  response: Response | null, 
  error: any
): GeminiErrorType {
  if (response) {
    const status = response.status;
    
    if (status === 429) return GeminiErrorType.RATE_LIMIT;
    if (status === 401 || status === 403) return GeminiErrorType.AUTHORIZATION;
    if (status >= 500) return GeminiErrorType.SERVER_ERROR;
    if (status === 400) {
      // محاولة التمييز بين أخطاء التحقق وأخطاء المحتوى المحظور
      if (error?.error?.message?.includes("block")) return GeminiErrorType.BLOCKED_CONTENT;
      return GeminiErrorType.VALIDATION;
    }
  }
  
  if (!error) return GeminiErrorType.UNKNOWN;
  
  if (error.promptFeedback?.blockReason) return GeminiErrorType.BLOCKED_CONTENT;
  if (error.message?.includes("network") || error.name === "TypeError") return GeminiErrorType.NETWORK;
  if (error.message?.includes("JSON") || error.name === "SyntaxError") return GeminiErrorType.PARSING;
  if (error.message?.includes("empty") || !error.candidates?.length) return GeminiErrorType.EMPTY_RESPONSE;
  
  return GeminiErrorType.UNKNOWN;
}

/**
 * إنشاء كائن خطأ مُنظم مع معلومات مفيدة
 */
export function createGeminiError(
  response: Response | null, 
  errorData: any
): GeminiError {
  const errorType = determineErrorType(response, errorData);
  const statusCode = response?.status;
  
  let message: string;
  let isRetryable: boolean;
  let recommendedAction: string;
  
  switch (errorType) {
    case GeminiErrorType.RATE_LIMIT:
      message = "تم تجاوز حد معدل الطلبات";
      isRetryable = true;
      recommendedAction = "انتظر قبل إرسال المزيد من الطلبات";
      break;
      
    case GeminiErrorType.SERVER_ERROR:
      message = "خطأ في خادم Gemini API";
      isRetryable = true;
      recommendedAction = "أعد المحاولة لاحقًا";
      break;
      
    case GeminiErrorType.AUTHORIZATION:
      message = "خطأ في مفتاح API أو الصلاحيات";
      isRetryable = false;
      recommendedAction = "تحقق من مفتاح API وصلاحياته";
      break;
      
    case GeminiErrorType.BLOCKED_CONTENT:
      message = "تم حظر المحتوى من قبل سياسات Gemini";
      isRetryable = false;
      recommendedAction = "تغيير محتوى الطلب أو الصورة";
      break;
      
    case GeminiErrorType.VALIDATION:
      message = "طلب غير صالح";
      isRetryable = false;
      recommendedAction = "تحقق من بنية طلب API";
      break;
      
    case GeminiErrorType.EMPTY_RESPONSE:
      message = "استجابة فارغة من Gemini";
      isRetryable = true;
      recommendedAction = "أعد المحاولة بإعدادات مختلفة";
      break;
      
    case GeminiErrorType.NETWORK:
      message = "خطأ في الاتصال بالشبكة";
      isRetryable = true;
      recommendedAction = "تحقق من الاتصال بالإنترنت";
      break;
      
    case GeminiErrorType.PARSING:
      message = "خطأ في تحليل استجابة Gemini";
      isRetryable = true;
      recommendedAction = "أعد المحاولة";
      break;
      
    default:
      message = "خطأ غير معروف";
      isRetryable = true;
      recommendedAction = "أعد المحاولة بطريقة مختلفة";
  }
  
  // تضمين رسالة الخطأ الأصلية إذا كانت متاحة
  if (errorData?.error?.message) {
    message = `${message}: ${errorData.error.message}`;
  }
  
  return {
    type: errorType,
    message,
    originalError: errorData,
    statusCode,
    isRetryable,
    recommendedAction
  };
}

/**
 * معالجة أخطاء Gemini API واتخاذ الإجراء المناسب
 */
export async function handleGeminiError(
  error: GeminiError, 
  retryCount: number
): Promise<{ shouldRetry: boolean; newRetryCount: number; apiResult?: ApiResult }> {
  console.error("خطأ في Gemini API:", {
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    isRetryable: error.isRetryable
  });
  
  // الأخطاء التي يمكن إعادة محاولتها
  if (error.isRetryable && retryCount < MAX_RETRIES) {
    // خطأ تجاوز معدل الطلبات يحتاج إلى معالجة خاصة
    if (error.type === GeminiErrorType.RATE_LIMIT) {
      const newRetryCount = await handleRateLimiting(retryCount);
      return { 
        shouldRetry: newRetryCount !== -1, 
        newRetryCount: newRetryCount !== -1 ? newRetryCount : retryCount + 1 
      };
    }
    
    // الإنتظار قبل إعادة المحاولة للأخطاء الأخرى
    const delayMultiplier = error.type === GeminiErrorType.SERVER_ERROR ? 2 : 1;
    const delay = 1000 * retryCount * delayMultiplier;
    
    console.log(`الانتظار ${delay}ms قبل إعادة المحاولة (${retryCount + 1}/${MAX_RETRIES})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return { shouldRetry: true, newRetryCount: retryCount + 1 };
  }
  
  // ترجمة الخطأ إلى نتيجة API
  const apiResult: ApiResult = {
    success: false,
    message: `${error.message}. ${error.recommendedAction}`
  };
  
  return { shouldRetry: false, newRetryCount: retryCount, apiResult };
}

/**
 * تحديث إعدادات الطلب بناءً على نوع الخطأ ومرات إعادة المحاولة
 */
export function getRetryConfiguration(error: GeminiError, retryCount: number, currentConfig: any): any {
  const newConfig = { ...currentConfig };
  
  // زيادة درجة الحرارة تدريجياً مع كل محاولة للحصول على نتائج مختلفة
  if (error.type === GeminiErrorType.EMPTY_RESPONSE || error.type === GeminiErrorType.PARSING) {
    const baseTemperature = currentConfig.temperature || 0.2;
    newConfig.temperature = Math.min(0.9, baseTemperature + (retryCount * 0.15));
  }
  
  // تعديل maxOutputTokens إذا كانت هناك قيود على حجم الاستجابة
  if (error.type === GeminiErrorType.VALIDATION && error.message.includes("token")) {
    const currentTokens = currentConfig.maxOutputTokens || 1024;
    newConfig.maxOutputTokens = Math.min(currentTokens, 512);
  }
  
  return newConfig;
}
