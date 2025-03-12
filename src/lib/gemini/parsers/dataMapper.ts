
/**
 * تعيين البيانات المستخرجة بالمفاتيح الإنجليزية
 */
import { correctProvinceName } from "@/utils/provinces";
import { formatPrice } from "@/utils/parsing/formatters";
import { enhanceExtractedData, calculateConfidenceScore } from "../utils";
import { extractCompanyName, extractProvinceFromCities, findProvinceInText } from "./textAnalyzer";

/**
 * تحويل البيانات العربية إلى مفاتيح إنجليزية
 */
export function mapDataToEnglishKeys(
  enhancedData: Record<string, string>, 
  extractedText: string
): { parsedData: Record<string, string>, confidenceScore: number } {
  const mappedData: Record<string, string> = {};
  
  // استخراج اسم الشركة إذا لم يكن موجودًا
  if (!enhancedData.companyName) {
    const companyName = extractCompanyName(extractedText);
    if (companyName) {
      enhancedData.companyName = companyName;
    }
  }
  
  // تعيين اسم الشركة
  if (enhancedData.companyName || enhancedData["اسم الشركة"] || enhancedData["الشركة"]) {
    mappedData.companyName = enhancedData.companyName || enhancedData["اسم الشركة"] || enhancedData["الشركة"];
  }
  
  // تعيين الكود
  if (enhancedData.code || enhancedData["الكود"] || enhancedData["كود"]) {
    mappedData.code = enhancedData.code || enhancedData["الكود"] || enhancedData["كود"];
  }
  
  // تعيين اسم المرسل
  if (enhancedData.senderName || enhancedData["اسم المرسل"] || enhancedData["الاسم"]) {
    mappedData.senderName = enhancedData.senderName || enhancedData["اسم المرسل"] || enhancedData["الاسم"];
  }
  
  // تعيين رقم الهاتف
  if (enhancedData.phoneNumber || enhancedData["رقم الهاتف"] || enhancedData["الهاتف"]) {
    mappedData.phoneNumber = enhancedData.phoneNumber || enhancedData["رقم الهاتف"] || enhancedData["الهاتف"];
  }
  
  // تعيين المحافظة
  if (enhancedData.province || enhancedData["المحافظة"] || enhancedData["محافظة"]) {
    let province = enhancedData.province || enhancedData["المحافظة"] || enhancedData["محافظة"];
    // تصحيح اسم المحافظة
    mappedData.province = correctProvinceName(province);
  } else {
    // البحث في النص عن محافظة
    const province = findProvinceInText(extractedText);
    if (province) {
      mappedData.province = province;
    }
  }
  
  // تعيين السعر
  if (enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"]) {
    let price = enhancedData.price || enhancedData["السعر"] || enhancedData["سعر"];
    // تنسيق السعر وفقًا لقواعد العمل
    mappedData.price = formatPrice(price);
  }
  
  // إذا لم نجد المحافظة بعد، نحاول استخراجها من المدن
  if (!mappedData.province) {
    const provinceFromCity = extractProvinceFromCities(extractedText);
    if (provinceFromCity) {
      mappedData.province = provinceFromCity;
    }
  }
  
  // تنسيق السعر النهائي مرة أخرى للتأكد من صحته
  if (mappedData.price) {
    mappedData.price = formatPrice(mappedData.price);
  }
  
  // تصحيح اسم المحافظة في النهاية
  if (mappedData.province) {
    mappedData.province = correctProvinceName(mappedData.province);
  }
  
  // تقييم جودة البيانات المستخرجة
  const confidenceScore = calculateConfidenceScore(mappedData);
  
  return {
    parsedData: mappedData,
    confidenceScore
  };
}
