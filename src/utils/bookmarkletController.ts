// تحديث imports
import { BookmarkletItem, BookmarkletExportData } from "@/types/ImageData";

/**
 * واجهة للتحكم بملء النماذج بشكل مشابه لـ Selenium
 */
export interface SeleniumController {
  setDebugMode(enabled: boolean): SeleniumController;
  setDelay(delay: number): SeleniumController;
  waitForPageLoad(): SeleniumController;
  waitForElement(selector: string, timeout: number): SeleniumController;
  typeText(selector: string, text: string): SeleniumController;
  typeTextByXPath(xpath: string, text: string): SeleniumController;
  selectOption(selector: string, value: string): SeleniumController;
  click(selector: string): SeleniumController;
  clickElementByXPath(xpath: string): SeleniumController;
  execute(): Promise<void>;
  findAndFillField(fieldKey: string, fieldValue: any): SeleniumController;
  clickSaveButton(): SeleniumController;
}

/**
 * إنشاء وحدة تحكم Selenium
 * @param data البيانات لملء النموذج
 */
export const createSeleniumController = (data: BookmarkletItem): SeleniumController => {
  let debugMode = false;
  let delay = 100; // تأخير افتراضي
  const actions: (() => Promise<void>)[] = [];

  const log = (message: string) => {
    if (debugMode) {
      console.log(`[SeleniumController] ${message}`);
    }
  };

  const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const waitForPageLoad = (): SeleniumController => {
    actions.push(async () => {
      log("انتظار تحميل الصفحة...");
      if (document.readyState !== 'complete') {
        await new Promise<void>(resolve => {
          window.addEventListener('load', () => {
            log("تم تحميل الصفحة.");
            resolve();
          });
        });
      } else {
        log("الصفحة محملة بالفعل.");
      }
      await waitFor(delay);
    });
    return api;
  };

  const waitForElement = (selector: string, timeout: number): SeleniumController => {
    actions.push(async () => {
      log(`انتظار ظهور العنصر "${selector}" (المهلة: ${timeout}ms)...`);
      await new Promise<void>((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
          if (document.querySelector(selector)) {
            log(`العنصر "${selector}" موجود.`);
            clearInterval(interval);
            resolve();
          } else if (Date.now() - startTime > timeout) {
            log(`انتهت المهلة أثناء انتظار العنصر "${selector}".`);
            clearInterval(interval);
            reject(`انتهت المهلة أثناء انتظار العنصر "${selector}".`);
          }
        }, 100);
      });
      await waitFor(delay);
    });
    return api;
  };

  const typeText = (selector: string, text: string): SeleniumController => {
    actions.push(async () => {
      log(`كتابة النص "${text}" في العنصر "${selector}"...`);
      const element = document.querySelector(selector) as HTMLInputElement;
      if (element) {
        element.focus();
        for (const char of text) {
          element.value += char;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          await waitFor(delay);
        }
        element.blur();
        log(`تمت كتابة النص "${text}" في العنصر "${selector}".`);
      } else {
        console.warn(`العنصر "${selector}" غير موجود. تم تخطي الكتابة.`);
      }
      await waitFor(delay);
    });
    return api;
  };

  const typeTextByXPath = (xpath: string, text: string): SeleniumController => {
    actions.push(async () => {
      log(`كتابة النص "${text}" في العنصر المحدد بواسطة XPath "${xpath}"...`);
      const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue as HTMLInputElement;

      if (element) {
        element.focus();
        for (const char of text) {
          element.value += char;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          await waitFor(delay);
        }
        element.blur();
        log(`تمت كتابة النص "${text}" في العنصر المحدد بواسطة XPath "${xpath}".`);
      } else {
        console.warn(`العنصر المحدد بواسطة XPath "${xpath}" غير موجود. تم تخطي الكتابة.`);
      }
      await waitFor(delay);
    });
    return api;
  };

  const selectOption = (selector: string, value: string): SeleniumController => {
    actions.push(async () => {
      log(`تحديد الخيار "${value}" في العنصر "${selector}"...`);
      const element = document.querySelector(selector) as HTMLSelectElement;
      if (element) {
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        log(`تم تحديد الخيار "${value}" في العنصر "${selector}".`);
      } else {
        console.warn(`العنصر "${selector}" غير موجود. تم تخطي التحديد.`);
      }
      await waitFor(delay);
    });
    return api;
  };

  const click = (selector: string): SeleniumController => {
    actions.push(async () => {
      log(`النقر على العنصر "${selector}"...`);
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.click();
        log(`تم النقر على العنصر "${selector}".`);
      } else {
        console.warn(`العنصر "${selector}" غير موجود. تم تخطي النقر.`);
      }
      await waitFor(delay);
    });
    return api;
  };

  const clickElementByXPath = (xpath: string): SeleniumController => {
    actions.push(async () => {
      log(`النقر على العنصر المحدد بواسطة XPath "${xpath}"...`);
      const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue as HTMLElement;

      if (element) {
        element.click();
        log(`تم النقر على العنصر المحدد بواسطة XPath "${xpath}".`);
      } else {
        console.warn(`العنصر المحدد بواسطة XPath "${xpath}" غير موجود. تم تخطي النقر.`);
      }
      await waitFor(delay);
    });
    return api;
  };

  const execute = async (): Promise<void> => {
    log("بدء تنفيذ سلسلة الإجراءات...");
    for (const action of actions) {
      try {
        await action();
      } catch (error) {
        console.error("حدث خطأ أثناء تنفيذ الإجراء:", error);
        throw error; // إعادة رمي الخطأ لإيقاف التنفيذ
      }
    }
    log("تم تنفيذ سلسلة الإجراءات بنجاح.");
  };

  // وظائف إضافية لتسهيل الاستخدام
  const findAndFillField = (fieldKey: string, fieldValue: any): SeleniumController => {
    actions.push(async () => {
      log(`البحث عن الحقل "${fieldKey}" وملئه بالقيمة "${fieldValue}"...`);
      const selectors = [
        `[name*="${fieldKey}" i]`,
        `[id*="${fieldKey}" i]`,
        `[placeholder*="${fieldKey}" i]`,
        `[aria-label*="${fieldKey}" i]`,
      ];

      let found = false;
      for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.value = fieldValue || '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          log(`تم العثور على الحقل "${fieldKey}" باستخدام المحدد "${selector}" وملئه بنجاح.`);
          found = true;
          break;
        }
      }

      if (!found) {
        console.warn(`لم يتم العثور على الحقل "${fieldKey}" باستخدام أي من المحددات.`);
      }
      await waitFor(delay);
    });
    return api;
  };

  const clickSaveButton = (): SeleniumController => {
    actions.push(async () => {
      log("محاولة النقر على زر الحفظ...");
      const selectors = [
        'button[type="submit" i]',
        'button:contains("حفظ" i)',
        'button:contains("إرسال" i)',
        'input[type="submit" i]',
        'input[type="button" i][value*="حفظ" i]',
        'input[type="button" i][value*="إرسال" i]',
      ];

      let clicked = false;
      for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          element.click();
          log(`تم النقر على زر الحفظ باستخدام المحدد "${selector}".`);
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        console.warn("لم يتم العثور على زر الحفظ باستخدام أي من المحددات.");
      }
      await waitFor(delay);
    });
    return api;
  };

  const api: SeleniumController = {
    setDebugMode: (enabled: boolean) => {
      debugMode = enabled;
      return api;
    },
    setDelay: (newDelay: number) => {
      delay = newDelay;
      return api;
    },
    waitForPageLoad,
    waitForElement,
    typeText,
    typeTextByXPath,
    selectOption,
    click,
    clickElementByXPath,
    execute,
    findAndFillField,
    clickSaveButton,
  };

  return api;
};
