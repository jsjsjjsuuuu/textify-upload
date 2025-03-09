
/**
 * وظائف لتحليل استجابات Gemini API
 */

import { enhanceExtractedData, calculateConfidenceScore } from "./utils";

/**
 * استخراج JSON من نص الاستجابة ومعالجته
 */
export function parseGeminiResponse(extractedText: string): {
  parsedData: Record<string, string>;
  confidenceScore: number;
} {
  // محاولة استخراج JSON من النص
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
    
    // تحسين استخراج البيانات بعد الحصول على JSON
    const enhancedData = enhanceExtractedData(parsedData, extractedText);
    
    // تحويل البيانات العربية إلى مفاتيح إنجليزية
    const mappedData: Record<string, string> = {};
    
    // تحقق من وجود أي من الحقول في parsedData وتعيينها للمفاتيح الإنجليزية
    if (enhancedData.code || enhancedData["الكود"] || enhancedData["كود"]) {
      mappedData.code = enhancedData.code || enhancedData["الكود"] || enhancedData["كود"];
    }
    
    if (enhancedData.senderName || enhancedData["اسم المرسل"] || enhancedData["الاسم"]) {
      mappedData.senderName = enhancedData.senderName || enhancedData["اسم المرسل"] || enhancedData["الاسم"];
    }
    
    if (enhancedData.phoneNumber || enhancedData["رقم الهاتف"] || enhancedData["الهاتف"]) {
      mappedData.phoneNumber = enhancedData.phoneNumber || enhancedData["رقم الهاتف"] || enhancedData["الهاتف"];
    }
    
    if (enhancedData.province || enhancedData["المحافظة"] || enhancedData["محافظة"]) {
      mappedData.province = enhancedData.province || enhancedData["المحافظة"] || enhancedData["محافظة"];
    }
    
    if (enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"]) {
      mappedData.price = enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"];
    }
    
    // إذا لم نتمكن من استخراج البيانات من JSON، نحاول استخراجها من النص مباشرة
    if (Object.keys(mappedData).length === 0) {
      console.log("No JSON data found, parsing text manually");
      const lines = extractedText.split('\n');
      const dataFields: Record<string, string> = {
        "الكود": "code",
        "كود": "code",
        "اسم المرسل": "senderName",
        "الاسم": "senderName", 
        "رقم الهاتف": "phoneNumber",
        "الهاتف": "phoneNumber",
        "المحافظة": "province",
        "محافظة": "province",
        "السعر": "price",
        "سعر": "price"
      };
      
      lines.forEach(line => {
        for (const [arabicKey, englishKey] of Object.entries(dataFields)) {
          if (line.includes(arabicKey)) {
            const value = line.split(':')[1]?.trim() || line.split('،')[1]?.trim() || "";
            mappedData[englishKey] = value;
          }
        }
      });
    }
    
    console.log("Final mapped data:", mappedData);
    
    // تقييم جودة البيانات المستخرجة
    const confidenceScore = calculateConfidenceScore(mappedData);
    
    return {
      parsedData: mappedData,
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
