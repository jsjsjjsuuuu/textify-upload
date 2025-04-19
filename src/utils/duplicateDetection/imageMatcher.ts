
// ملف مقارنة بصمات الصور
export const compareHashes = (hash1: string, hash2: string): number => {
  // مقارنة بسيطة
  return hash1 === hash2 ? 1 : 0;
};
