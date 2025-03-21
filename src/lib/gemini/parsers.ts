
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
    }
    
    // إذا لم يتم العثور على JSON أو كان فارغًا، فنبحث في النص عن أنماط محددة
    if (Object.keys(parsedData).length === 0) {
      console.log("No JSON format found in response or JSON was empty. Extracting data from text directly.");
      
      // استخراج رقم الكود
      const codeMatches = extractedText.match(/رقم الوصل[:\s]+([0-9]+)/i) ||
                          extractedText.match(/كود[:\s]+([0-9]+)/i) ||
                          extractedText.match(/الكود[:\s]+([0-9]+)/i) ||
                          extractedText.match(/code[:\s]+([0-9]+)/i) ||
                          extractedText.match(/رقم[:\s]+([0-9]+)/i);
      
      if (codeMatches && codeMatches[1]) {
        parsedData.code = codeMatches[1].trim();
        console.log("Extracted code:", parsedData.code);
      }
      
      // استخراج اسم المرسل
      const senderNameMatches = extractedText.match(/اسم المرسل[:\s]+([^\n]+)/i) ||
                               extractedText.match(/المرسل[:\s]+([^\n]+)/i) ||
                               extractedText.match(/اسم الزبون[:\s]+([^\n]+)/i) ||
                               extractedText.match(/الزبون[:\s]+([^\n]+)/i);
      
      if (senderNameMatches && senderNameMatches[1]) {
        parsedData.senderName = senderNameMatches[1].trim();
        console.log("Extracted sender name:", parsedData.senderName);
      }
      
      // استخراج رقم الهاتف
      const phoneNumberMatches = extractedText.match(/هاتف[:\s]+([0-9\s\-]+)/i) ||
                                extractedText.match(/رقم الهاتف[:\s]+([0-9\s\-]+)/i) ||
                                // البحث عن رقم هاتف عراقي نموذجي (يبدأ بـ 07)
                                extractedText.match(/\b(07\d{2}[0-9\s\-]{7,8})\b/);
      
      if (phoneNumberMatches && phoneNumberMatches[1]) {
        // تنظيف رقم الهاتف (إزالة المسافات والشرطات)
        parsedData.phoneNumber = phoneNumberMatches[1].replace(/\D/g, '');
        console.log("Extracted phone number:", parsedData.phoneNumber);
      }
      
      // استخراج المحافظة
      const provinceMatches = extractedText.match(/المحافظة[:\s]+([^\n]+)/i) ||
                             extractedText.match(/محافظة[:\s]+([^\n]+)/i) ||
                             extractedText.match(/عنوان الزبون[^:\n]*[:\s]+([^\n]+)/i);
      
      if (provinceMatches && provinceMatches[1]) {
        // استخراج اسم المحافظة من النص وتصحيحه
        const provinceText = provinceMatches[1].trim();
        
        // البحث عن اسم محافظة في النص
        for (const province of IRAQ_PROVINCES) {
          if (provinceText.includes(province)) {
            parsedData.province = province;
            break;
          }
        }
        
        // إذا لم يتم العثور على اسم محافظة، استخدم النص كما هو
        if (!parsedData.province) {
          parsedData.province = correctProvinceName(provinceText);
        }
        
        console.log("Extracted province:", parsedData.province);
      }
      
      // استخراج السعر
      const priceMatches = extractedText.match(/السعر[:\s]+([0-9\s\-,\.]+)/i) ||
                          extractedText.match(/المبلغ[:\s]+([0-9\s\-,\.]+)/i) ||
                          extractedText.match(/سعر[:\s]+([0-9\s\-,\.]+)/i) ||
                          extractedText.match(/قيمة[:\s]+([0-9\s\-,\.]+)/i);
      
      if (priceMatches && priceMatches[1]) {
        parsedData.price = priceMatches[1].trim();
        console.log("Extracted price:", parsedData.price);
      }
      
      // استخراج اسم الشركة
      const companyNameMatches = extractedText.match(/شركة\s+([^\n]+)/i) ||
                                extractedText.match(/مؤسسة\s+([^\n]+)/i) ||
                                extractedText.match(/اسم الشركة[:\s]+([^\n]+)/i);
      
      if (companyNameMatches && companyNameMatches[1]) {
        parsedData.companyName = companyNameMatches[1].trim();
        console.log("Extracted company name:", parsedData.companyName);
      } else {
        // إذا لم يتم العثور على اسم الشركة، فحاول استخدام السطر الأول من النص
        const firstLine = extractedText.split('\n')[0].trim();
        if (firstLine && firstLine.length > 3 && firstLine.length < 50) {
          parsedData.companyName = firstLine;
          console.log("Using first line as company name:", parsedData.companyName);
        }
      }
    }
    
    // البحث عن رقم هاتف عراقي في النص بشكل مباشر إذا لم يتم العثور عليه سابقًا
    if (!parsedData.phoneNumber) {
      const iraqiPhoneRegex = /\b(07[0-9]{2}[0-9\s\-]{7,8})\b/;
      const phoneMatchDirect = extractedText.match(iraqiPhoneRegex);
      if (phoneMatchDirect && phoneMatchDirect[1]) {
        parsedData.phoneNumber = phoneMatchDirect[1].replace(/\D/g, '');
        console.log("Found Iraqi phone number directly:", parsedData.phoneNumber);
      }
    }
    
    // البحث عن أرقام بصيغ مختلفة قد تكون كود الشحنة
    if (!parsedData.code) {
      const possibleCodes = extractedText.match(/\b\d{5,10}\b/g);
      if (possibleCodes && possibleCodes.length > 0) {
        // استخدام أول رقم طويل (5-10 أرقام) كرمز محتمل
        parsedData.code = possibleCodes[0];
        console.log("Using first numeric sequence as code:", parsedData.code);
      }
    }
    
    // معالجة وتحسين البيانات المستخرجة
    const enhancedData = enhanceExtractedData(parsedData, extractedText);
    console.log("Enhanced extracted data:", enhancedData);
    
    // تصحيح اسم المحافظة إذا وجد
    if (enhancedData.province) {
      enhancedData.province = correctProvinceName(enhancedData.province);
      console.log("Corrected province name:", enhancedData.province);
    } else {
      // البحث في النص كاملاً عن أي اسم محافظة عراقية
      for (const province of IRAQ_PROVINCES) {
        if (extractedText.includes(province)) {
          enhancedData.province = province;
          console.log("Found province name in text:", enhancedData.province);
          break;
        }
      }
    }
    
    // تنسيق السعر وفقًا لقواعد العمل
    if (enhancedData.price) {
      enhancedData.price = formatPrice(enhancedData.price);
      console.log("Formatted price:", enhancedData.price);
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
