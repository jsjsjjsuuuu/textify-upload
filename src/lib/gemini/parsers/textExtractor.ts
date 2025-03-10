
/**
 * Extract field data from plain text when JSON parsing fails
 */
import { correctProvinceName, IRAQ_PROVINCES } from "@/utils/provinces";

/**
 * Extract structured data from unstructured text
 */
export function extractFieldsFromText(extractedText: string): Record<string, string> {
  const extractedData: Record<string, string> = {};
  
  // استخراج اسم الشركة (يكون عادة في أعلى اليسار بخط كبير)
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
      extractedData.companyName = match[1].trim();
      break;
    }
  }
  
  // محاولة استخراج الكود من النص إذا لم يتم العثور عليه
  const codeMatch = extractedText.match(/كود[:\s]+([0-9]+)/i) || 
                    extractedText.match(/code[:\s]+([0-9]+)/i) || 
                    extractedText.match(/رقم[:\s]+([0-9]+)/i) ||
                    extractedText.match(/رمز[:\s]+([0-9]+)/i) ||
                    extractedText.match(/\b\d{6,9}\b/g); // البحث عن أي رقم من 6 إلى 9 أرقام
                    
  if (codeMatch && codeMatch[1]) {
    extractedData.code = codeMatch[1].trim();
  } else if (codeMatch && Array.isArray(codeMatch)) {
    extractedData.code = codeMatch[0].trim();
  }
  
  // محاولة استخراج رقم الهاتف من النص
  const phoneMatch = extractedText.match(/هاتف[:\s]+([0-9\-\+\s]+)/i) || 
                     extractedText.match(/phone[:\s]+([0-9\-\+\s]+)/i) || 
                     extractedText.match(/جوال[:\s]+([0-9\-\+\s]+)/i) || 
                     extractedText.match(/رقم الهاتف[:\s]+([0-9\-\+\s]+)/i) ||
                     extractedText.match(/\b(07\d{8,9}|\+964\d{8,9})\b/g);
                     
  if (phoneMatch && phoneMatch[1]) {
    extractedData.phoneNumber = phoneMatch[1].trim();
  } else if (phoneMatch && Array.isArray(phoneMatch)) {
    extractedData.phoneNumber = phoneMatch[0].trim();
  }
  
  // البحث في النص كاملاً عن أي اسم محافظة عراقية
  for (const province of IRAQ_PROVINCES) {
    if (extractedText.includes(province)) {
      extractedData.province = correctProvinceName(province);
      break;
    }
  }
  
  // Extract data from text lines
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
        extractedData[englishKey] = value;
      }
    }
  });
  
  // البحث عن أسماء المدن الرئيسية العراقية في النص إذا لم نجد المحافظة بعد
  if (!extractedData.province) {
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
        extractedData.province = province;
        break;
      }
    }
  }
  
  return extractedData;
}
