
import { correctProvinceName } from "./provinceCorrection";

/**
 * Attempts to extract a field from text based on various patterns
 */
export const tryExtractField = (text: string, patterns: RegExp[]): string => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
};

/**
 * Auto-extracts data from extracted text using various patterns
 */
export const autoExtractData = (extractedText: string) => {
  if (!extractedText) return {};
  
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
  
  const extractedData = {
    companyName: tryExtractField(extractedText, companyNamePatterns),
    code: tryExtractField(extractedText, [
      /كود[:\s]+([0-9]+)/i, 
      /code[:\s]+([0-9]+)/i, 
      /رقم[:\s]+([0-9]+)/i,
      /رمز[:\s]+([0-9]+)/i
    ]),
    senderName: tryExtractField(extractedText, [
      /اسم المرسل[:\s]+(.+?)(?:\n|\r|$)/i, 
      /sender[:\s]+(.+?)(?:\n|\r|$)/i, 
      /الاسم[:\s]+(.+?)(?:\n|\r|$)/i,
      /الراسل[:\s]+(.+?)(?:\n|\r|$)/i
    ]),
    phoneNumber: tryExtractField(extractedText, [
      /هاتف[:\s]+([0-9\-\s]+)/i, 
      /phone[:\s]+([0-9\-\s]+)/i, 
      /جوال[:\s]+([0-9\-\s]+)/i, 
      /رقم الهاتف[:\s]+([0-9\-\s]+)/i,
      /رقم[:\s]+([0-9\-\s]+)/i
    ]),
    province: tryExtractField(extractedText, [
      /محافظة[:\s]+(.+?)(?:\n|\r|$)/i, 
      /province[:\s]+(.+?)(?:\n|\r|$)/i, 
      /المدينة[:\s]+(.+?)(?:\n|\r|$)/i,
      /المنطقة[:\s]+(.+?)(?:\n|\r|$)/i
    ]),
    price: tryExtractField(extractedText, [
      /سعر[:\s]+(.+?)(?:\n|\r|$)/i, 
      /price[:\s]+(.+?)(?:\n|\r|$)/i, 
      /المبلغ[:\s]+(.+?)(?:\n|\r|$)/i,
      /قيمة[:\s]+(.+?)(?:\n|\r|$)/i
    ])
  };

  // تصحيح اسم المحافظة
  if (extractedData.province) {
    extractedData.province = correctProvinceName(extractedData.province);
  }

  return extractedData;
};
