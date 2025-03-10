
/**
 * Main parser for Gemini API responses
 */
import { enhanceExtractedData, calculateConfidenceScore } from "../utils";
import { extractJsonFromText } from "./jsonExtractor";
import { extractFieldsFromText } from "./textExtractor";
import { mapArabicToEnglishFields } from "./fieldMapper";

/**
 * Parse the full Gemini API response into structured data
 */
export function parseGeminiResponse(extractedText: string): {
  parsedData: Record<string, string>;
  confidenceScore: number;
} {
  try {
    // محاولة استخراج JSON من النص
    let parsedData: Record<string, string> = {};
    
    // Step 1: Try to extract JSON from the response
    const jsonData = extractJsonFromText(extractedText);
    
    // Step 2: Extract any additional data from text
    const textData = extractFieldsFromText(extractedText);
    
    // Step 3: Combine JSON and text data
    const combinedData = { ...textData, ...jsonData };
    
    // Step 4: Enhance extracted data by cleaning and processing values
    const enhancedData = enhanceExtractedData(combinedData, extractedText);
    
    // Step 5: Map Arabic field names to English field names
    parsedData = mapArabicToEnglishFields(enhancedData);
    
    // Step 6: If we still have empty results, try direct text extraction as fallback
    if (Object.keys(parsedData).length === 0) {
      console.log("No JSON data found, parsing text manually");
      const manuallyExtractedData = extractFieldsFromText(extractedText);
      parsedData = mapArabicToEnglishFields(manuallyExtractedData);
    }
    
    console.log("Final parsed data:", parsedData);
    
    // Step 7: Calculate confidence score for the extracted data
    const confidenceScore = calculateConfidenceScore(parsedData);
    
    return {
      parsedData,
      confidenceScore
    };
  } catch (error) {
    console.error("Error in parseGeminiResponse:", error);
    return {
      parsedData: {},
      confidenceScore: 0
    };
  }
}
