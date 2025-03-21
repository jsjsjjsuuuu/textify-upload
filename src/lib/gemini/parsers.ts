
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
    console.log("Parsing Gemini response text:", extractedText.substring(0, 100) + "...");
    
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
            const matches = [...extractedText.matchAll(keyValuePattern)];
            
            matches.forEach(match => {
              const key = match[1].trim();
              const value = match[2].trim();
              if (key && value) {
                parsedData[key] = value;
              }
            });
            
            console.log("Extracted key-value pairs:", parsedData);
          } catch (extractionError) {
            console.error("Error extracting key-value pairs:", extractionError);
          }
        }
      }
    } else {
      console.log("No JSON format found in response, trying to extract data from text");
      
      // تحسين: البحث عن أنماط أكثر دقة في النص
      const companyMatch = extractedText.match(/الشركة[:\s]+([^\n]+)/i) || 
                         extractedText.match(/شركة[:\s]+([^\n]+)/i);
      
      if (companyMatch && companyMatch[1]) {
        parsedData.companyName = companyMatch[1].trim();
      }
      
      const codeMatch = extractedText.match(/الكود[:\s]+([0-9]+)/i) ||
                       extractedText.match(/كود[:\s]+([0-9]+)/i) ||
                       extractedText.match(/رقم الشحنة[:\s]+([0-9]+)/i) ||
                       extractedText.match(/رقم[:\s]+([0-9]+)/i);
      
      if (codeMatch && codeMatch[1]) {
        parsedData.code = codeMatch[1].trim();
      }
      
      const senderMatch = extractedText.match(/اسم المرسل[:\s]+([^\n]+)/i) ||
                         extractedText.match(/المرسل[:\s]+([^\n]+)/i);
      
      if (senderMatch && senderMatch[1]) {
        parsedData.senderName = senderMatch[1].trim();
      }
      
      const phoneMatch = extractedText.match(/الهاتف[:\s]+([0-9\s\-]+)/i) ||
                        extractedText.match(/هاتف[:\s]+([0-9\s\-]+)/i) ||
                        extractedText.match(/رقم الهاتف[:\s]+([0-9\s\-]+)/i) ||
                        extractedText.match(/\b(07[0-9]{2}[0-9\s\-]{7,8})\b/);
      
      if (phoneMatch && phoneMatch[1]) {
        parsedData.phoneNumber = phoneMatch[1].replace(/\D/g, '');
      }
      
      const provinceMatch = extractedText.match(/المحافظة[:\s]+([^\n]+)/i) ||
                           extractedText.match(/محافظة[:\s]+([^\n]+)/i);
      
      if (provinceMatch && provinceMatch[1]) {
        parsedData.province = provinceMatch[1].trim();
      }
      
      const priceMatch = extractedText.match(/السعر[:\s]+([0-9\s\-]+)/i) ||
                        extractedText.match(/سعر[:\s]+([0-9\s\-]+)/i) ||
                        extractedText.match(/المبلغ[:\s]+([0-9\s\-]+)/i);
      
      if (priceMatch && priceMatch[1]) {
        parsedData.price = priceMatch[1].trim();
      }
    }
    
    // محاولة البحث عن رقم هاتف عراقي في النص بشكل مباشر
    if (!parsedData.phoneNumber) {
      const iraqiPhoneRegex = /\b(07[0-9]{2}[0-9\s\-]{7,8})\b/;
      const phoneMatchDirect = extractedText.match(iraqiPhoneRegex);
      if (phoneMatchDirect && phoneMatchDirect[1]) {
        parsedData.phoneNumber = phoneMatchDirect[1].replace(/\D/g, '');
      }
    }
    
    // البحث عن أرقام بصيغ مختلفة قد تكون كود الشحنة
    if (!parsedData.code) {
      const possibleCodes = extractedText.match(/\b\d{5,10}\b/g);
      if (possibleCodes && possibleCodes.length > 0) {
        // استخدام أول رقم طويل (5-10 أرقام) كرمز محتمل
        parsedData.code = possibleCodes[0];
      }
    }
    
    // معالجة وتحسين البيانات المستخرجة
    const enhancedData = enhanceExtractedData(parsedData, extractedText);
    console.log("Enhanced extracted data:", enhancedData);
    
    // تصحيح اسم المحافظة إذا وجد
    if (enhancedData.province) {
      enhancedData.province = correctProvinceName(enhancedData.province);
    } else {
      // البحث في النص كاملاً عن أي اسم محافظة عراقية
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
    console.log("Calculated confidence score:", confidenceScore);
    
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
