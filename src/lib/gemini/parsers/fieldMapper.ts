
/**
 * Map Arabic data fields to English field names
 */
import { correctProvinceName } from "@/utils/provinces";

/**
 * Map extracted data from Arabic field names to standardized English field names
 */
export function mapArabicToEnglishFields(enhancedData: Record<string, string>): Record<string, string> {
  const mappedData: Record<string, string> = {};
  
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
  }
  
  if (enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"]) {
    mappedData.price = enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"];
  }
  
  // تصحيح اسم المحافظة في النهاية
  if (mappedData.province) {
    mappedData.province = correctProvinceName(mappedData.province);
  }
  
  return mappedData;
}
