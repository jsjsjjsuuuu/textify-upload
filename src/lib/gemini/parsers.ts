
/**
 * وظائف لتحليل استجابات Gemini API
 */

import { enhanceExtractedData, calculateConfidenceScore, formatPrice } from "./utils";
import { correctProvinceName, IRAQ_PROVINCES } from "@/utils/provinces";

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
        try {
          // تنظيف النص وإضافة علامات اقتباس للمفاتيح والقيم
          const cleanedText = jsonText
            .replace(/([{,]\s*)([^"}\s][^":,}]*?)(\s*:)/g, '$1"$2"$3')
            .replace(/(:(?:\s*)(?!true|false|null|{|\[|"|')([^,}\s]+))/g, ':"$2"')
            .replace(/'/g, '"');
          
          console.log("Cleaned JSON text:", cleanedText);
          parsedData = JSON.parse(cleanedText);
          console.log("Successfully parsed cleaned JSON:", parsedData);
        } catch (cleanJsonError) {
          console.error("Error parsing cleaned JSON:", cleanJsonError);
          
          // إذا فشل تنظيف JSON، نحاول استخراج أزواج المفاتيح والقيم
          try {
            const keyValuePattern = /"?([^":,}\s]+)"?\s*:\s*"?([^",}]+)"?/g;
            const matches = [...jsonText.matchAll(keyValuePattern)];
            
            matches.forEach(match => {
              const key = match[1].trim();
              const value = match[2].trim();
              parsedData[key] = value;
            });
            
            console.log("Extracted key-value pairs:", parsedData);
          } catch (extractionError) {
            console.error("Error extracting key-value pairs:", extractionError);
          }
        }
      }
    } else {
      console.log("No JSON format found in response, trying to extract data from text");
    }
    
    // إذا لم نستطع استخراج JSON أو كان فارغًا، نحاول استخراج البيانات من النص
    if (Object.keys(parsedData).length === 0) {
      // البحث عن أنماط نصية محددة في النص
      const patterns = {
        companyName: [
          /شركة\s+(.+?)(?:\n|$)/i,
          /company\s*:\s*(.+?)(?:\n|$)/i,
          /اسم الشركة\s*:\s*(.+?)(?:\n|$)/i
        ],
        code: [
          /كود\s*:\s*([0-9]+)/i,
          /code\s*:\s*([0-9]+)/i,
          /رقم\s*:\s*([0-9]+)/i,
          /رمز\s*:\s*([0-9]+)/i
        ],
        senderName: [
          /اسم المرسل\s*:\s*(.+?)(?:\n|$)/i,
          /sender\s*:\s*(.+?)(?:\n|$)/i,
          /المرسل\s*:\s*(.+?)(?:\n|$)/i
        ],
        phoneNumber: [
          /هاتف\s*:\s*([0-9\s\-]+)/i,
          /phone\s*:\s*([0-9\s\-]+)/i,
          /رقم الهاتف\s*:\s*([0-9\s\-]+)/i
        ],
        province: [
          /محافظة\s*:\s*(.+?)(?:\n|$)/i,
          /province\s*:\s*(.+?)(?:\n|$)/i,
          /المدينة\s*:\s*(.+?)(?:\n|$)/i
        ],
        price: [
          /سعر\s*:\s*(.+?)(?:\n|$)/i,
          /price\s*:\s*(.+?)(?:\n|$)/i,
          /المبلغ\s*:\s*(.+?)(?:\n|$)/i
        ]
      };
      
      // محاولة استخراج كل حقل باستخدام الأنماط
      for (const [field, fieldPatterns] of Object.entries(patterns)) {
        for (const pattern of fieldPatterns) {
          const match = extractedText.match(pattern);
          if (match && match[1]) {
            parsedData[field] = match[1].trim();
            break;
          }
        }
      }
      
      console.log("Extracted data from text patterns:", parsedData);
    }
    
    // معالجة وتحسين البيانات المستخرجة
    const enhancedData = enhanceExtractedData(parsedData, extractedText);
    console.log("Enhanced extracted data:", enhancedData);
    
    // تصحيح اسم المحافظة إذا وجد
    if (enhancedData.province) {
      enhancedData.province = correctProvinceName(enhancedData.province);
    }
    
    // البحث في النص كاملاً عن أي اسم محافظة عراقية إذا لم نجد المحافظة
    if (!enhancedData.province) {
      for (const province of IRAQ_PROVINCES) {
        if (extractedText.includes(province)) {
          enhancedData.province = province;
          break;
        }
      }
    }
    
    // تنسيق السعر وفقًا لقواعد العمل
    if (enhancedData.price) {
      enhancedData.price = formatPrice(enhancedData.price);
    }
    
    // تقييم جودة البيانات المستخرجة
    const confidenceScore = calculateConfidenceScore(enhancedData);
    
    return {
      parsedData: enhancedData,
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
