
/**
 * وحدة محاكاة Selenium - توفر واجهة مشابهة لـ Selenium للتحكم في عمليات إدخال البيانات
 * هذه الوحدة تعمل داخل البوكماركلت وتوفر واجهة برمجية مشابهة للسيلينيوم
 */

import { BookmarkletItem } from "@/types/ImageData";
import { guessFieldType, fillField, findFormFields, findBestSelectOption } from "../bookmarkletController";

// الوضع التصحيحي - لتسجيل التفاصيل
let DEBUG_MODE = false;

// معدل التأخير الافتراضي بين العمليات (بالمللي ثانية)
const DEFAULT_DELAY = 100;

// إعدادات ضبط الانتظار
const WAIT_SETTINGS = {
  timeout: 10000,      // المهلة القصوى للانتظار (10 ثوانٍ)
  pollInterval: 250,   // فترة استطلاع DOM
};

// الفئة الرئيسية للتحكم بالصفحة - مشابهة لـ WebDriver في Selenium
export class PageController {
  private data: BookmarkletItem;
  private executionDelay: number;
  private actionQueue: Array<() => Promise<void>>;
  private executionStatus: 'idle' | 'running' | 'completed' | 'error';
  private statusCallback: (status: string, details?: string) => void;

  constructor(data: BookmarkletItem, statusCallback?: (status: string, details?: string) => void) {
    this.data = data;
    this.executionDelay = DEFAULT_DELAY;
    this.actionQueue = [];
    this.executionStatus = 'idle';
    this.statusCallback = statusCallback || ((status, details) => {
      console.log(`[Selenium-Like] ${status}${details ? ': ' + details : ''}`);
    });
  }

  /**
   * ضبط وضع التصحيح
   */
  public setDebugMode(enabled: boolean): PageController {
    DEBUG_MODE = enabled;
    this.log('تم ضبط وضع التصحيح: ' + (enabled ? 'مفعل' : 'معطل'));
    return this;
  }

  /**
   * ضبط تأخير التنفيذ بين العمليات
   */
  public setDelay(milliseconds: number): PageController {
    this.executionDelay = milliseconds;
    this.log(`تم ضبط تأخير التنفيذ: ${milliseconds}ms`);
    return this;
  }

  /**
   * انتظار تحميل الصفحة بالكامل
   */
  public waitForPageLoad(): PageController {
    this.addToQueue(async () => {
      this.log('انتظار اكتمال تحميل الصفحة...');
      
      if (document.readyState === 'complete') {
        this.log('الصفحة محملة بالفعل');
        return;
      }

      return new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          window.removeEventListener('load', loadHandler);
          this.log('انتهت مهلة انتظار تحميل الصفحة، المتابعة على أي حال');
          resolve();
        }, WAIT_SETTINGS.timeout);

        const loadHandler = () => {
          clearTimeout(timeoutId);
          this.log('اكتمل تحميل الصفحة');
          resolve();
        };

        window.addEventListener('load', loadHandler);
      });
    });
    
    return this;
  }

  /**
   * انتظار ظهور عنصر في الصفحة
   */
  public waitForElement(selector: string, timeout: number = WAIT_SETTINGS.timeout): PageController {
    this.addToQueue(async () => {
      this.log(`انتظار ظهور العنصر: ${selector}`);
      
      // التحقق أولاً إذا كان العنصر موجوداً بالفعل
      if (document.querySelector(selector)) {
        this.log(`العنصر موجود بالفعل: ${selector}`);
        return;
      }

      return new Promise<void>((resolve, reject) => {
        let elapsed = 0;
        
        const checkInterval = setInterval(() => {
          if (document.querySelector(selector)) {
            clearInterval(checkInterval);
            this.log(`تم العثور على العنصر: ${selector}`);
            resolve();
            return;
          }
          
          elapsed += WAIT_SETTINGS.pollInterval;
          if (elapsed >= timeout) {
            clearInterval(checkInterval);
            const errorMsg = `انتهت مهلة انتظار العنصر: ${selector}`;
            this.log(errorMsg, 'error');
            reject(new Error(errorMsg));
          }
        }, WAIT_SETTINGS.pollInterval);
      });
    });
    
    return this;
  }

  /**
   * النقر على عنصر في الصفحة
   */
  public click(selector: string): PageController {
    this.addToQueue(async () => {
      this.log(`محاولة النقر على: ${selector}`);
      
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        throw new Error(`لم يتم العثور على العنصر للنقر: ${selector}`);
      }
      
      try {
        element.click();
        this.log(`تم النقر على: ${selector}`);
      } catch (e) {
        this.log(`فشل النقر على العنصر: ${e}`, 'error');
        throw e;
      }
    });
    
    return this;
  }

  /**
   * إدخال نص في حقل
   */
  public typeText(selector: string, text: string): PageController {
    this.addToQueue(async () => {
      this.log(`إدخال النص في: ${selector}`);
      
      const element = document.querySelector(selector) as HTMLInputElement;
      if (!element) {
        throw new Error(`لم يتم العثور على العنصر للكتابة: ${selector}`);
      }
      
      try {
        // تنظيف الحقل أولاً
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        // إدخال النص حرفًا بحرفًا لمحاكاة الكتابة البشرية
        for (let i = 0; i < text.length; i++) {
          await this.delay(25); // تأخير بسيط بين الأحرف
          element.value += text[i];
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        element.dispatchEvent(new Event('change', { bubbles: true }));
        this.log(`تم إدخال النص في: ${selector}`);
      } catch (e) {
        this.log(`فشل إدخال النص: ${e}`, 'error');
        throw e;
      }
    });
    
    return this;
  }

  /**
   * اختيار خيار من قائمة منسدلة
   */
  public selectOption(selector: string, optionValue: string): PageController {
    this.addToQueue(async () => {
      this.log(`اختيار الخيار: ${optionValue} من القائمة: ${selector}`);
      
      const selectElement = document.querySelector(selector) as HTMLSelectElement;
      if (!selectElement) {
        throw new Error(`لم يتم العثور على القائمة المنسدلة: ${selector}`);
      }
      
      try {
        const bestOption = findBestSelectOption(selectElement, optionValue);
        if (bestOption) {
          selectElement.value = bestOption.value;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          this.log(`تم اختيار الخيار: ${bestOption.text} (قيمة: ${bestOption.value})`);
        } else {
          throw new Error(`لم يتم العثور على خيار مناسب للقيمة: ${optionValue}`);
        }
      } catch (e) {
        this.log(`فشل اختيار الخيار: ${e}`, 'error');
        throw e;
      }
    });
    
    return this;
  }

  /**
   * تعبئة جميع الحقول المعروفة تلقائيًا
   */
  public autoFillAllFields(): PageController {
    this.addToQueue(async () => {
      this.log('بدء تعبئة جميع الحقول تلقائيًا');
      
      // البحث عن جميع الحقول في الصفحة
      const fields = findFormFields();
      if (fields.length === 0) {
        this.log('لم يتم العثور على حقول للتعبئة', 'warning');
        return;
      }
      
      this.log(`تم العثور على ${fields.length} حقل`);
      let filledCount = 0;
      
      // محاولة تعبئة كل حقل
      for (const field of Array.from(fields)) {
        // تخمين نوع الحقل
        const fieldType = guessFieldType(field as any);
        if (fieldType === 'unknown') continue;
        
        // الحصول على القيمة المناسبة من البيانات
        let value = '';
        switch (fieldType) {
          case 'code':
            value = this.data.code || '';
            break;
          case 'customerName':
            value = this.data.senderName || '';
            break;
          case 'customerPhone':
            value = this.data.phoneNumber || '';
            break;
          case 'province':
            value = this.data.province || '';
            break;
          case 'totalAmount':
            value = this.data.price || '';
            break;
          case 'companyName':
            value = this.data.companyName || '';
            break;
          case 'receiverName':
            value = this.data.recipientName || '';
            break;
          case 'notes1':
          case 'notes2':
            value = this.data.notes || '';
            break;
          case 'area':
            value = this.data.address || '';
            break;
          // يمكن إضافة المزيد من الأنواع حسب الحاجة
        }
        
        // إذا وجدنا قيمة، نحاول ملء الحقل
        if (value) {
          const success = fillField(field as any, value);
          if (success) {
            filledCount++;
            this.log(`تم ملء الحقل "${fieldType}" بالقيمة: ${value}`);
            await this.delay(this.executionDelay / 2); // تأخير بين ملء الحقول
          }
        }
      }
      
      this.log(`اكتملت تعبئة الحقول: تم ملء ${filledCount} من ${fields.length} حقل`);
    });
    
    return this;
  }

  /**
   * تأخير لفترة محددة
   */
  public wait(milliseconds: number): PageController {
    this.addToQueue(async () => {
      this.log(`انتظار ${milliseconds}ms`);
      await this.delay(milliseconds);
    });
    
    return this;
  }

  /**
   * تشغيل سلسلة الإجراءات
   */
  public async execute(): Promise<void> {
    if (this.executionStatus === 'running') {
      this.log('جاري تنفيذ الإجراءات بالفعل، لا يمكن البدء مرة أخرى', 'warning');
      return;
    }
    
    this.executionStatus = 'running';
    this.log(`بدء تنفيذ ${this.actionQueue.length} إجراء`);
    
    try {
      for (let i = 0; i < this.actionQueue.length; i++) {
        const action = this.actionQueue[i];
        
        // تنفيذ الإجراء مع التعامل مع الأخطاء
        try {
          await action();
        } catch (error) {
          this.log(`فشل تنفيذ الإجراء #${i + 1}: ${error}`, 'error');
          // نستمر على الرغم من الخطأ لضمان إمكانية تنفيذ باقي الإجراءات
        }
        
        // تأخير بين الإجراءات
        if (i < this.actionQueue.length - 1) {
          await this.delay(this.executionDelay);
        }
      }
      
      this.executionStatus = 'completed';
      this.log('اكتمل تنفيذ جميع الإجراءات');
    } catch (error) {
      this.executionStatus = 'error';
      this.log(`توقف التنفيذ بسبب خطأ: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * إضافة إجراء إلى قائمة الانتظار
   */
  private addToQueue(action: () => Promise<void>): void {
    this.actionQueue.push(action);
  }

  /**
   * تأخير (وعد)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * تسجيل الأحداث
   */
  private log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (DEBUG_MODE || level !== 'info') {
      const prefix = level === 'error' ? '❌ ' : level === 'warning' ? '⚠️ ' : '✅ ';
      console.log(`[Selenium-Like] ${prefix}${message}`);
    }
    
    if (this.statusCallback) {
      this.statusCallback(level, message);
    }
  }
}

/**
 * وظيفة مساعدة لتشغيل تلقائي سريع لبيانات واحدة
 */
export const runQuickAutomation = async (data: BookmarkletItem, callback?: (status: string, details?: string) => void): Promise<void> => {
  const controller = new PageController(data, callback)
    .setDelay(150)
    .waitForPageLoad()
    .autoFillAllFields()
    .wait(500);

  await controller.execute();
  return Promise.resolve();
};

/**
 * واجهة السيلينيوم لاستخدامها في البوكماركلت
 */
export const createSeleniumController = (data: BookmarkletItem, callback?: (status: string, details?: string) => void): PageController => {
  return new PageController(data, callback);
};
