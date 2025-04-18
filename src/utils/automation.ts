
/**
 * وظائف مساعدة للأتمتة
 */

/**
 * التحقق مما إذا كان يجب استخدام بيانات المتصفح للأتمتة
 */
export const shouldUseBrowserData = (): boolean => {
  const useBrowserDataStr = localStorage.getItem('use_browser_data');
  return useBrowserDataStr === null ? true : useBrowserDataStr === 'true';
};

/**
 * تعيين استخدام بيانات المتصفح للأتمتة
 */
export const setUseBrowserData = (value: boolean): void => {
  localStorage.setItem('use_browser_data', value ? 'true' : 'false');
};

/**
 * التحقق مما إذا كان وضع التنفيذ الفعلي مفعل
 */
export const isRealExecutionEnabled = (): boolean => {
  const realExecutionStr = localStorage.getItem('automation_real_execution');
  return realExecutionStr === null ? false : realExecutionStr === 'true';
};

/**
 * تنظيف إجراءات الأتمتة من القيم الفارغة
 */
export const cleanupAutomationActions = (actions: any[]): any[] => {
  return actions.filter(action => action.selector && action.selector.trim() !== '');
};
