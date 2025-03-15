
/**
 * نظام ملء النماذج المحسن مع دعم محاكاة سيلينيوم
 */

import { BookmarkletItem } from "@/types/ImageData";

// الإصدار
const VERSION = "2.0";

/**
 * وظيفة البحث والملء الأساسية
 */
export const enhancedFormFiller = async (data: BookmarkletItem, options = {}): Promise<{success: boolean, message: string}> => {
  console.log("[EnhancedFormFiller] بدء ملء النموذج مع بيانات:", data);
  
  try {
    // استخدام نظام السيلينيوم المحسن للتعبئة التلقائية
    await runQuickAutomation(data, (status, details) => {
      if (status === 'error') {
        console.error(`[EnhancedFormFiller] خطأ: ${details}`);
      } else if (status === 'warning') {
        console.warn(`[EnhancedFormFiller] تحذير: ${details}`);
      } else {
        console.log(`[EnhancedFormFiller] ${details}`);
      }
    });
    
    return {
      success: true,
      message: "تم ملء النموذج بنجاح باستخدام نظام محاكاة السيلينيوم"
    };
  } catch (error) {
    console.error("[EnhancedFormFiller] فشل ملء النموذج:", error);
    return {
      success: false,
      message: `فشل ملء النموذج: ${error}`
    };
  }
};

/**
 * وظيفة ملء النموذج المتقدمة - تتيح للمستخدم برمجة تسلسل مخصص
 */
export const programmableFormFiller = (data: BookmarkletItem): {
  controller: any;
  execute: () => Promise<{success: boolean, message: string}>;
} => {
  // إنشاء متحكم محاكاة السيلينيوم
  const controller = createSeleniumController(data);
  
  // وظيفة التنفيذ
  const execute = async (): Promise<{success: boolean, message: string}> => {
    try {
      await controller.execute();
      return {
        success: true,
        message: "تم تنفيذ الإجراءات المخصصة بنجاح"
      };
    } catch (error) {
      console.error("[ProgrammableFormFiller] فشل تنفيذ الإجراءات:", error);
      return {
        success: false,
        message: `فشل تنفيذ الإجراءات: ${error}`
      };
    }
  };
  
  return {
    controller,
    execute
  };
};

/**
 * إنشاء متحكم لمحاكاة سيلينيوم
 */
export const createSeleniumController = (data: BookmarkletItem) => {
  let actions: Array<() => Promise<void>> = [];
  let debugMode = false;
  let defaultDelay = 100;
  
  const controller = {
    // إعداد وضع التصحيح
    setDebugMode: (enabled: boolean) => {
      debugMode = enabled;
      if (debugMode) console.log("[SeleniumController] تم تفعيل وضع التصحيح");
      return controller;
    },
    
    // ضبط التأخير الافتراضي بين الإجراءات
    setDelay: (delay: number) => {
      defaultDelay = delay;
      return controller;
    },
    
    // انتظار تحميل الصفحة
    waitForPageLoad: () => {
      actions.push(async () => {
        if (debugMode) console.log("[SeleniumController] انتظار تحميل الصفحة...");
        return new Promise<void>((resolve) => {
          if (document.readyState === 'complete') {
            if (debugMode) console.log("[SeleniumController] الصفحة محملة بالفعل");
            resolve();
          } else {
            window.addEventListener('load', () => {
              if (debugMode) console.log("[SeleniumController] اكتمل تحميل الصفحة");
              resolve();
            });
          }
        });
      });
      return controller;
    },
    
    // انتظار ظهور عنصر
    waitForElement: (selector: string, timeout = 5000) => {
      actions.push(async () => {
        if (debugMode) console.log(`[SeleniumController] انتظار العنصر: ${selector}...`);
        return new Promise<void>((resolve, reject) => {
          // التحقق أولاً إذا كان العنصر موجوداً بالفعل
          if (document.querySelector(selector)) {
            if (debugMode) console.log(`[SeleniumController] العنصر موجود بالفعل: ${selector}`);
            resolve();
            return;
          }
          
          // تعيين مهلة زمنية
          const timeoutId = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`انتهت المهلة أثناء انتظار العنصر: ${selector}`));
          }, timeout);
          
          // إعداد مراقب DOM
          const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
              if (debugMode) console.log(`[SeleniumController] تم العثور على العنصر: ${selector}`);
              observer.disconnect();
              clearTimeout(timeoutId);
              resolve();
            }
          });
          
          // بدء المراقبة
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
          });
        });
      });
      return controller;
    },
    
    // كتابة نص في حقل
    typeText: (selector: string, text: string | undefined | null) => {
      if (text === undefined || text === null) {
        if (debugMode) console.log(`[SeleniumController] النص فارغ لـ ${selector}، تخطي`);
        return controller;
      }
      
      actions.push(async () => {
        if (debugMode) console.log(`[SeleniumController] كتابة النص في ${selector}: ${text}`);
        const element = document.querySelector(selector) as HTMLInputElement;
        if (!element) {
          throw new Error(`لم يتم العثور على العنصر: ${selector}`);
        }
        
        // التأكد من أن العنصر مرئي ويمكن التفاعل معه
        if (element.style.display === 'none' || element.style.visibility === 'hidden') {
          throw new Error(`العنصر غير مرئي: ${selector}`);
        }
        
        // تنشيط الحقل أولاً
        element.focus();
        
        // محاكاة الكتابة البشرية حرفًا بحرفًا
        for (let i = 0; i < text.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          element.value = text.substring(0, i + 1);
          // تشغيل حدث input لتحديث الواجهة
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // تشغيل حدث التغيير
        element.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, defaultDelay));
      });
      return controller;
    },
    
    // اختيار خيار من قائمة منسدلة
    selectOption: (selector: string, value: string) => {
      actions.push(async () => {
        if (debugMode) console.log(`[SeleniumController] اختيار القيمة ${value} من ${selector}`);
        const select = document.querySelector(selector) as HTMLSelectElement;
        if (!select) {
          throw new Error(`لم يتم العثور على قائمة الاختيار: ${selector}`);
        }
        
        // البحث عن الخيار المطابق للقيمة أو النص
        let found = false;
        for (let i = 0; i < select.options.length; i++) {
          const option = select.options[i];
          
          if (option.value === value || option.text === value) {
            select.selectedIndex = i;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            found = true;
            break;
          }
        }
        
        if (!found) {
          throw new Error(`لم يتم العثور على الخيار: ${value} في القائمة ${selector}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, defaultDelay));
      });
      return controller;
    },
    
    // النقر على عنصر
    click: (selector: string) => {
      actions.push(async () => {
        if (debugMode) console.log(`[SeleniumController] النقر على العنصر: ${selector}`);
        const element = document.querySelector(selector) as HTMLElement;
        if (!element) {
          throw new Error(`لم يتم العثور على العنصر: ${selector}`);
        }
        
        // محاكاة النقر البشري
        element.focus();
        await new Promise(resolve => setTimeout(resolve, 50));
        element.click();
        await new Promise(resolve => setTimeout(resolve, defaultDelay));
      });
      return controller;
    },
    
    // إضافة تأخير
    delay: (ms: number) => {
      actions.push(async () => {
        if (debugMode) console.log(`[SeleniumController] تأخير ${ms} مللي ثانية`);
        await new Promise(resolve => setTimeout(resolve, ms));
      });
      return controller;
    },
    
    // إضافة إجراء مخصص
    customAction: (fn: () => Promise<void>) => {
      actions.push(async () => {
        if (debugMode) console.log("[SeleniumController] تنفيذ إجراء مخصص");
        await fn();
      });
      return controller;
    },
    
    // تنفيذ جميع الإجراءات
    execute: async () => {
      if (debugMode) console.log("[SeleniumController] بدء تنفيذ سلسلة الإجراءات");
      
      for (let i = 0; i < actions.length; i++) {
        try {
          await actions[i]();
        } catch (error) {
          console.error(`[SeleniumController] فشل الإجراء #${i+1}:`, error);
          throw error;
        }
      }
      
      if (debugMode) console.log("[SeleniumController] اكتمل تنفيذ جميع الإجراءات بنجاح");
    }
  };
  
  return controller;
};

/**
 * تنفيذ أتمتة سريعة باستخدام القيم النموذجية
 */
export const runQuickAutomation = async (
  data: BookmarkletItem, 
  logger?: (status: 'info' | 'warning' | 'error', message: string) => void
) => {
  const log = (status: 'info' | 'warning' | 'error', message: string) => {
    if (logger) {
      logger(status, message);
    } else {
      console.log(`[QuickAutomation] [${status}] ${message}`);
    }
  };
  
  log('info', 'بدء الأتمتة السريعة...');
  
  try {
    // إنشاء متحكم السيلينيوم
    const controller = createSeleniumController(data);
    
    // بناء سلسلة الإجراءات الافتراضية
    controller
      .setDebugMode(true)
      .waitForPageLoad()
      .delay(500);
    
    // إضافة إجراءات بناءً على البيانات المتاحة
    if (data.code) {
      // محاولة العثور على حقل الكود في الصفحة
      controller.customAction(async () => {
        const possibleSelectors = [
          '#code', '#shipmentCode', '#customerCode', '#orderCode', 
          '[name="code"]', '[name="shipmentCode"]', '[name="customerCode"]',
          '[placeholder*="كود"]', '[placeholder*="رقم الشحنة"]', '[placeholder*="رمز"]'
        ];
        
        for (const selector of possibleSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            log('info', `تم العثور على حقل الكود: ${selector}`);
            controller.typeText(selector, data.code);
            return;
          }
        }
        
        log('warning', 'لم يتم العثور على حقل الكود، حاول البحث بطريقة أخرى');
      });
    }
    
    // حقل اسم المرسل
    if (data.senderName) {
      controller.customAction(async () => {
        const possibleSelectors = [
          '#senderName', '#name', '#customerName', '#sender',
          '[name="senderName"]', '[name="name"]', '[name="customerName"]',
          '[placeholder*="اسم المرسل"]', '[placeholder*="الاسم"]'
        ];
        
        for (const selector of possibleSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            log('info', `تم العثور على حقل الاسم: ${selector}`);
            controller.typeText(selector, data.senderName);
            return;
          }
        }
        
        log('warning', 'لم يتم العثور على حقل اسم المرسل');
      });
    }
    
    // حقل رقم الهاتف
    if (data.phoneNumber) {
      controller.customAction(async () => {
        const possibleSelectors = [
          '#phone', '#phoneNumber', '#mobile', '#customerPhone',
          '[name="phone"]', '[name="phoneNumber"]', '[name="mobile"]',
          '[placeholder*="رقم الهاتف"]', '[placeholder*="الجوال"]', '[placeholder*="الموبايل"]'
        ];
        
        for (const selector of possibleSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            log('info', `تم العثور على حقل الهاتف: ${selector}`);
            controller.typeText(selector, data.phoneNumber);
            return;
          }
        }
        
        log('warning', 'لم يتم العثور على حقل رقم الهاتف');
      });
    }
    
    // المحافظة
    if (data.province) {
      controller.customAction(async () => {
        const possibleSelectors = [
          '#province', '#city', '#governorate', '#region',
          'select[name="province"]', 'select[name="city"]', 'select[name="governorate"]',
          'select[placeholder*="المحافظة"]', 'select[placeholder*="المدينة"]'
        ];
        
        for (const selector of possibleSelectors) {
          const element = document.querySelector(selector);
          if (element && element.tagName === 'SELECT') {
            log('info', `تم العثور على قائمة المحافظة: ${selector}`);
            controller.selectOption(selector, data.province);
            return;
          }
        }
        
        log('warning', 'لم يتم العثور على قائمة المحافظة');
      });
    }
    
    // إضافة المزيد من الحقول المحتملة...
    
    // تنفيذ سلسلة الإجراءات
    await controller.execute();
    log('info', 'تم تنفيذ الأتمتة السريعة بنجاح');
    
  } catch (error) {
    log('error', `فشل الأتمتة السريعة: ${error}`);
    throw error;
  }
};

// تصدير الواجهة العامة
export default {
  VERSION,
  enhancedFormFiller,
  programmableFormFiller,
  createSeleniumController,
  runQuickAutomation
};
