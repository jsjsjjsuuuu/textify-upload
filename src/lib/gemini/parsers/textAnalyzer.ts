
/**
 * وظائف تحليل النص واستخراج بيانات محددة
 */
import { IRAQ_PROVINCES } from "@/utils/provinces";

/**
 * استخراج اسم الشركة من النص
 */
export function extractCompanyName(extractedText: string): string | null {
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
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * استخراج المحافظة بناءً على المدن المذكورة في النص
 */
export function extractProvinceFromCities(extractedText: string): string | null {
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
      return province;
    }
  }
  
  return null;
}

/**
 * محاولة استخراج محافظة من النص الكامل
 */
export function findProvinceInText(extractedText: string): string | null {
  // البحث في النص كاملاً عن أي اسم محافظة عراقية
  for (const province of IRAQ_PROVINCES) {
    if (extractedText.includes(province)) {
      return province;
    }
  }
  
  return null;
}

/**
 * استخراج البيانات من النص مباشرة عندما لا نتمكن من استخراجها من JSON
 */
export function extractDataFromPlainText(extractedText: string): Record<string, string> {
  const mappedData: Record<string, string> = {};
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
  
  return mappedData;
}
