
/**
 * Extract JSON content from text responses
 */

/**
 * Try to extract JSON object from text that might contain a JSON block
 */
export function extractJsonFromText(text: string): Record<string, string> {
  try {
    // نبحث عن أي نص JSON في الاستجابة
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                     text.match(/{[\s\S]*?}/);
    
    if (jsonMatch) {
      const jsonText = jsonMatch[0].replace(/```json|```/g, '').trim();
      console.log("Found JSON in response:", jsonText);
      try {
        return JSON.parse(jsonText);
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        // إذا فشل تحليل JSON، نحاول إصلاحه
        const cleanJsonText = jsonText.replace(/[\u0600-\u06FF]+\s*:\s*/g, (match) => {
          return `"${match.trim().slice(0, -1)}": `;
        }).replace(/'/g, '"');
        try {
          return JSON.parse(cleanJsonText);
        } catch (cleanJsonError) {
          console.error("Error parsing cleaned JSON:", cleanJsonError);
          return {};
        }
      }
    }
    
    return {};
  } catch (error) {
    console.error("Error extracting JSON from text:", error);
    return {};
  }
}
