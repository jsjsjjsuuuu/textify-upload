
/**
 * وظائف لتحليل استجابات Gemini API
 */

import { enhanceExtractedData, calculateConfidenceScore } from "./utils";
import { correctProvinceName, IRAQ_PROVINCES } from "@/utils/provinceCorrection";

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
    
    // استخراج اسم الشركة (يكون عادة في أعلى اليسار بخط كبير)
    if (!enhancedData.companyName) {
      const companyNamePatterns = [
        // البحث عن نص في بداية النص المستخرج (يكون غالبًا في الأعلى)
        /^([^:\n\r]+?)(?:\n|\r|$)/i,
        // البحث عن "شركة" أو "مؤسسة" أو "مجموعة"
        /شركة\s+(.+?)(?:\n|\r|$)/i,
        /مؤسسة\s+(.+?)(?:\n|\r|$)/i,
        /مجموعة\s+(.+?)(?:\n|\r|$)/i,
        // البحث عن "company" باللغة الإنجليزية
        /company[:\s]+(.+?)(?:\n|\r|$)/i
      ];
      
      for (const pattern of companyNamePatterns) {
        const match = extractedText.match(pattern);
        if (match && match[1]) {
          enhancedData.companyName = match[1].trim();
          break;
        }
      }
    }
    
    // تحقق من وجود أي من الحقول في parsedData وتعيينها للمفاتيح الإنجليزية
    if (enhancedData.companyName || enhancedData["اسم الشركة"] || enhancedData["الشركة"]) {
      mappedData.companyName = enhancedData.companyName || enhancedData["اسم الشركة"] || enhancedData["الشركة"];
    }
    
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
      let province = enhancedData.province || enhancedData["المحافظة"] || enhancedData["محافظة"];
      // تصحيح اسم المحافظة
      mappedData.province = correctProvinceName(province);
    } else {
      // البحث في النص كاملاً عن أي اسم محافظة عراقية
      for (const province of IRAQ_PROVINCES) {
        if (extractedText.includes(province)) {
          mappedData.province = province;
          break;
        }
      }
    }
    
    if (enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"]) {
      mappedData.price = enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"];
    }
    
    // إذا لم نتمكن من استخراج البيانات من JSON، نحاول استخراجها من النص مباشرة
    if (Object.keys(mappedData).length === 0) {
      console.log("No JSON data found, parsing text manually");
      const lines = extractedText.split('\n');
      const dataFields: Record<string, string> = {
        "اسم الشركة": "companyName",
        "الشركة": "companyName",
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
    
    // تصحيح اسم المحافظة في النهاية
    if (mappedData.province) {
      mappedData.province = correctProvinceName(mappedData.province);
    }
    
    // البحث عن أسماء المدن الرئيسية العراقية في النص إذا لم نجد المحافظة بعد
    if (!mappedData.province) {
      const cityProvinceMap: Record<string, string> = {
        'بغداد': 'بغداد',
        'البصرة': 'البصرة',
        'الموصل': 'نينوى',
        'أربيل': 'أربيل',
        'النجف': 'النجف',
        'الناصرية': 'ذي قار',
        'كركوك': 'كركوك',
        'الرمادي': 'الأنبار',
        'بعقوبة': 'ديالى',
        'السماوة': 'المثنى',
        'الديوانية': 'القادسية',
        'العمارة': 'ميسان',
        'الكوت': 'واسط',
        'تكريت': 'صلاح الدين',
        'الحلة': 'بابل',
        'كربلاء': 'كربلاء',
        'دهوك': 'دهوك',
        'السليمانية': 'السليمانية'
      };
      
      for (const [city, province] of Object.entries(cityProvinceMap)) {
        if (extractedText.includes(city)) {
          mappedData.province = province;
          break;
        }
      }
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
