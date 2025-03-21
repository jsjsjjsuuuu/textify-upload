
/**
 * وظائف مساعدة للتحقق من بيئة التطبيق
 */

/**
 * التحقق مما إذا كان التطبيق يعمل في بيئة المعاينة (Lovable)
 * @returns {boolean} صحيح إذا كانت بيئة معاينة
 */
export const isPreview = (): boolean => {
  // التحقق من وجود hostname محدد لبيئة المعاينة
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    return hostname.includes('lovable.ai') || 
           hostname.includes('localhost') || 
           hostname.includes('127.0.0.1');
  }
  return false;
};

/**
 * التحقق مما إذا كان التطبيق يعمل في بيئة الإنتاج
 * @returns {boolean} صحيح إذا كانت بيئة إنتاج
 */
export const isProduction = (): boolean => {
  return !isPreview();
};
