
/**
 * استخراج وتحليل JSON من النص
 */

/**
 * محاولة استخراج JSON من نص الاستجابة
 */
export function extractJsonFromText(extractedText: string): Record<string, string> {
  let parsedData: Record<string, string> = {};
  
  try {
    // نبحث عن أي نص JSON في الاستجابة
    const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                      extractedText.match(/{[\s\S]*?}/);
    
    if (jsonMatch) {
      const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
      console.log("Found JSON in response:", jsonText);
      try {
        parsedData = JSON.parse(jsonText);
        console.log("Successfully parsed JSON:", parsedData);
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        // إذا فشل تحليل JSON، نحاول إصلاحه
        const cleanJsonText = jsonText.replace(/[\u0600-\u06FF]+\s*:\s*/g, (match) => {
          return `"${match.trim().slice(0, -1)}": `;
        }).replace(/'/g, '"');
        try {
          parsedData = JSON.parse(cleanJsonText);
          console.log("Successfully parsed cleaned JSON:", parsedData);
        } catch (cleanJsonError) {
          console.error("Error parsing cleaned JSON:", cleanJsonError);
        }
      }
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error in extractJsonFromText:", error);
    return {};
  }
}
