
/**
 * حساب مدى التشابه بين سلسلتين نصيتين باستخدام مسافة ليفنشتاين
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const m = str1.length;
  const n = str2.length;
  
  // مصفوفة لحساب المسافة
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // حذف
          dp[i][j - 1],     // إدراج
          dp[i - 1][j - 1]  // استبدال
        );
      }
    }
  }
  
  // حساب معامل التشابه
  const maxLength = Math.max(m, n);
  if (maxLength === 0) return 1; // إذا كانت السلسلتان فارغتين
  
  return 1 - dp[m][n] / maxLength;
}
