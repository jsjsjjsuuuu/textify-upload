
// قم بتصحيح الخطأ بتحديث قيمة selector للتوافق مع finder

import { AutomationConfig, AutomationAction, AutomationActionResult } from "./types";

// استخدام AutomationActionResult بدلاً من ActionResult
export const runAutomation = async (config: AutomationConfig): Promise<AutomationActionResult[]> => {
  const results: AutomationActionResult[] = [];
  
  // تنفيذ كل إجراء بالتسلسل
  for (let i = 0; i < config.actions.length; i++) {
    const action = config.actions[i];
    
    // تأكد من وجود قيمة finder أو selector
    const finder = action.finder || action.selector || '';
    
    // إضافة قيمة selector إذا كانت finder فقط موجودة
    if (action.finder && !action.selector) {
      action.selector = action.finder;
    }
    
    // اختبار - نفترض أن جميع الإجراءات ناجحة
    const result: AutomationActionResult = {
      success: true,
      action: action,
      message: `تم تنفيذ الإجراء: ${action.name}`,
      timestamp: new Date().toISOString()
    };
    
    results.push(result);
  }
  
  return results;
};
