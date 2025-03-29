
import { GeminiExtractParams } from "./types";
import { ApiResult } from "../apiService";
import { extractDataWithGemini } from "./api";

// المفتاح الرئيسي الجديد
const DEFAULT_GEMINI_API_KEY = "AIzaSyBUwu7p61Rk1BHYJb5sa-CUMuN_6ImuQOc";

/**
 * وظيفة لاختبار نماذج Gemini المختلفة ومقارنة النتائج
 */
export async function testGeminiModels(
  apiKey: string = DEFAULT_GEMINI_API_KEY, 
  imageBase64: string, 
  models: string[] = ['gemini-1.5-pro', 'gemini-1.5-flash']
): Promise<{
  results: Array<{
    model: string;
    success: boolean;
    data?: any;
    confidence?: number;
    error?: string;
  }>;
  bestModel: string;
}> {
  const results = [];
  
  for (const model of models) {
    try {
      console.log(`Testing Gemini model: ${model}`);
      const result = await extractDataWithGemini({
        apiKey,
        imageBase64,
        modelVersion: model,
        enhancedExtraction: true
      });
      
      results.push({
        model,
        success: result.success,
        data: result.data,
        confidence: result.data?.confidence || 0,
        error: result.success ? undefined : result.message
      });
    } catch (error) {
      console.error(`Error testing model ${model}:`, error);
      results.push({
        model,
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      });
    }
  }
  
  // ترتيب النتائج حسب نسبة الثقة
  results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  
  // اختيار أفضل نموذج (النموذج بأعلى نسبة ثقة)
  const bestModel = results.length > 0 && results[0].success ? results[0].model : models[0];
  
  return {
    results,
    bestModel
  };
}
