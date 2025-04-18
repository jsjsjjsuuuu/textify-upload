
/**
 * مقارنة هاشات الصور وحساب نسبة التشابه
 * @param hashA الهاش الأول
 * @param hashB الهاش الثاني
 * @returns قيمة التشابه بين 0 و 1
 */
export const compareImageHashes = (hashA: string, hashB: string): number => {
  if (hashA === hashB) return 1;
  
  // حساب التشابه البسيط على أساس طول الهاش المشترك
  const minLength = Math.min(hashA.length, hashB.length);
  let matchCount = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (hashA[i] === hashB[i]) {
      matchCount++;
    }
  }
  
  return matchCount / minLength;
};

/**
 * حساب نسبة التشابه بين هاشين
 * (غطاء لوظيفة compareImageHashes)
 */
export const calculateSimilarity = (hashA: string, hashB: string): number => {
  return compareImageHashes(hashA, hashB);
};
