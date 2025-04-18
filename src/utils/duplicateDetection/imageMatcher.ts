
/**
 * مقارنة هاشات الصور لتحديد ما إذا كانت متطابقة
 * @param hash1 هاش الصورة الأولى
 * @param hash2 هاش الصورة الثانية
 * @returns true إذا كانت الصور متطابقة، false خلاف ذلك
 */
export const compareImageHashes = (hash1: string, hash2: string): boolean => {
  if (!hash1 || !hash2) return false;
  
  // مقارنة مباشرة للهاشات
  return hash1 === hash2;
};

/**
 * حساب درجة التشابه بين صورتين بناءً على هاشاتهم
 * @param hash1 هاش الصورة الأولى
 * @param hash2 هاش الصورة الثانية
 * @returns درجة التشابه (0.0 - 1.0)
 */
export const calculateSimilarity = (hash1: string, hash2: string): number => {
  if (!hash1 || !hash2) return 0;
  
  if (hash1 === hash2) return 1.0; // متطابقة تماماً
  
  // تقسيم الهاش إلى أجزاء
  const parts1 = hash1.split('|');
  const parts2 = hash2.split('|');
  
  // مقارنة أجزاء الهاش واحتساب درجة التشابه
  let matchCount = 0;
  let totalParts = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i]) {
      matchCount++;
    }
  }
  
  return matchCount / totalParts;
};
