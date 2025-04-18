
/**
 * مقارنة تجزئات الصور لتحديد التشابه
 * @param hash1 التجزئة الأولى
 * @param hash2 التجزئة الثانية
 * @returns قيمة التشابه بين 0 و 1
 */
export function compareImageHashes(hash1: string, hash2: string): number {
  if (hash1 === hash2) {
    return 1; // تطابق تام
  }
  
  // حساب مسافة ليفنشتاين المعيارية
  const distance = levenshteinDistance(hash1, hash2);
  const maxLength = Math.max(hash1.length, hash2.length);
  
  // تحويل المسافة إلى قيمة تشابه (1 = تطابق تام، 0 = لا تشابه)
  return 1 - (distance / maxLength);
}

/**
 * حساب مسافة ليفنشتاين بين سلسلتين
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // حذف
        track[j - 1][i] + 1, // إضافة
        track[j - 1][i - 1] + indicator, // استبدال
      );
    }
  }
  
  return track[str2.length][str1.length];
}
