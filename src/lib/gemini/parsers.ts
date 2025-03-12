
/**
 * وظائف لتحليل استجابات Gemini API
 */

import { enhanceExtractedData } from "./utils";
import { extractJsonFromText } from "./parsers/jsonExtractor";
import { extractDataFromPlainText } from "./parsers/textAnalyzer";
import { mapDataToEnglishKeys } from "./parsers/dataMapper";

/**
 * استخراج JSON من نص الاستجابة ومعالجته
 */
export function parseGeminiResponse(extractedText: string): {
  parsedData: Record<string, string>;
  confidenceScore: number;
} {
  try {
    // محاولة استخراج JSON من النص
    let parsedData = extractJsonFromText(extractedText);
    
    // تحسين استخراج البيانات بعد الحصول على JSON
    const enhancedData = enhanceExtractedData(parsedData, extractedText);
    
    // تحويل البيانات العربية إلى مفاتيح إنجليزية
    let result = mapDataToEnglishKeys(enhancedData, extractedText);
    
    // إذا لم نتمكن من استخراج البيانات من JSON، نحاول استخراجها من النص مباشرة
    if (Object.keys(result.parsedData).length === 0) {
      console.log("No JSON data found, parsing text manually");
      const plainTextData = extractDataFromPlainText(extractedText);
      result = mapDataToEnglishKeys(plainTextData, extractedText);
    }
    
    console.log("Final mapped data:", result.parsedData);
    
    return result;
  } catch (error) {
    console.error("Error in parseGeminiResponse:", error);
    return {
      parsedData: {},
      confidenceScore: 0
    };
  }
}
