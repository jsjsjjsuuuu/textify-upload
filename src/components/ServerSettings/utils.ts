
/**
 * تنسيق الوقت المنقضي
 */
export const formatElapsedTime = (timestamp: number): string => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds} ثانية`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} دقيقة`;
  return `${Math.floor(seconds / 3600)} ساعة`;
};
