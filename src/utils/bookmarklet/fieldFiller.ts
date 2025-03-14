
import { BookmarkletItem } from "./types";
import { getFieldMappingsForSite } from "./fieldMappings";
import { prepareItemForSiteInput } from "./converter";

/**
 * إيجاد عنصر واجهة المستخدم باستخدام مجموعة من المحددات
 */
export const findElement = (selectors: string[], frameWindow = window): HTMLElement | null => {
  for (const selector of selectors) {
    try {
      // محاولة العثور على العنصر باستخدام المحدد الحالي
      const element = frameWindow.document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log(`تم العثور على عنصر باستخدام المحدد: ${selector}`, element);
        return element;
      }
    } catch (error) {
      console.warn(`فشل في العثور على عنصر باستخدام المحدد: ${selector}`, error);
    }
  }
  
  // البحث في جميع الإطارات الفرعية
  try {
    const frames = frameWindow.document.querySelectorAll('iframe');
    for (const frame of frames) {
      try {
        const frameContentWindow = (frame as HTMLIFrameElement).contentWindow;
        if (frameContentWindow) {
          const element = findElement(selectors, frameContentWindow);
          if (element) return element;
        }
      } catch (frameError) {
        console.warn("خطأ في الوصول إلى إطار فرعي:", frameError);
      }
    }
  } catch (framesError) {
    console.warn("خطأ في البحث عن الإطارات الفرعية:", framesError);
  }
  
  return null;
};

/**
 * البحث عن كافة عناصر واجهة المستخدم المطابقة لمحددات متعددة
 */
export const findAllElements = (selectors: string[], frameWindow = window): HTMLElement[] => {
  const elements: HTMLElement[] = [];
  
  for (const selector of selectors) {
    try {
      // محاولة العثور على جميع العناصر باستخدام المحدد الحالي
      const foundElements = Array.from(frameWindow.document.querySelectorAll(selector)) as HTMLElement[];
      elements.push(...foundElements);
    } catch (error) {
      console.warn(`فشل في العثور على عناصر باستخدام المحدد: ${selector}`, error);
    }
  }
  
  // البحث في جميع الإطارات الفرعية
  try {
    const frames = frameWindow.document.querySelectorAll('iframe');
    for (const frame of frames) {
      try {
        const frameContentWindow = (frame as HTMLIFrameElement).contentWindow;
        if (frameContentWindow) {
          const frameElements = findAllElements(selectors, frameContentWindow);
          elements.push(...frameElements);
        }
      } catch (frameError) {
        console.warn("خطأ في الوصول إلى إطار فرعي:", frameError);
      }
    }
  } catch (framesError) {
    console.warn("خطأ في البحث عن الإطارات الفرعية:", framesError);
  }
  
  return elements;
};

/**
 * التحقق من نوع عنصر الإدخال وملائمته للقيمة
 */
const checkInputTypeCompatibility = (element: HTMLElement, value: string): boolean => {
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    
    // تحقق من توافق نوع الإدخال مع القيمة
    if (type === 'number' && isNaN(Number(value))) {
      console.warn(`القيمة "${value}" ليست رقمًا صالحًا لحقل رقمي`);
      return false;
    }
    
    if (type === 'tel' && !/^[\d\s+\-()]+$/.test(value)) {
      console.warn(`القيمة "${value}" ليست رقم هاتف صالحًا لحقل هاتف`);
      return false;
    }
    
    if (type === 'email' && !value.includes('@')) {
      console.warn(`القيمة "${value}" ليست بريدًا إلكترونيًا صالحًا لحقل البريد الإلكتروني`);
      return false;
    }
    
    if (type === 'date' && isNaN(Date.parse(value))) {
      console.warn(`القيمة "${value}" ليست تاريخًا صالحًا لحقل التاريخ`);
      return false;
    }
  }
  
  return true;
};

/**
 * محاولة إدخال قيمة في عنصر واجهة المستخدم
 */
export const fillInputField = (element: HTMLElement, value: string): boolean => {
  if (!element || !value) return false;
  
  console.log(`محاولة ملء الحقل:`, element, `بالقيمة: "${value}"`);
  
  try {
    // التحقق من توافق نوع الإدخال مع القيمة
    if (!checkInputTypeCompatibility(element, value)) {
      return false;
    }
    
    // محاولة ملء الحقل باستخدام طرق مختلفة
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      // طريقة 1: تعيين القيمة مباشرة
      element.value = value;
      
      // طريقة 2: محاكاة كتابة المستخدم
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, "value"
      )?.set;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
      }
      
      // طريقة 3: إطلاق أحداث مختلفة
      const events = ['input', 'change', 'blur'];
      events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true });
        element.dispatchEvent(event);
      });
      
      // التحقق من نجاح العملية
      console.log(`تم ملء الحقل بنجاح: "${value}" في `, element);
      return true;
    } 
    else if (element instanceof HTMLSelectElement) {
      // البحث عن الخيار المناسب في القائمة المنسدلة
      let matched = false;
      
      // البحث عن تطابق دقيق
      for (let i = 0; i < element.options.length; i++) {
        const option = element.options[i];
        const optionText = option.text.trim().toLowerCase();
        const optionValue = option.value.trim().toLowerCase();
        const searchValue = value.trim().toLowerCase();
        
        if (optionText === searchValue || optionValue === searchValue) {
          element.selectedIndex = i;
          matched = true;
          break;
        }
      }
      
      // إذا لم يتم العثور على تطابق دقيق، ابحث عن تطابق جزئي
      if (!matched) {
        for (let i = 0; i < element.options.length; i++) {
          const option = element.options[i];
          const optionText = option.text.trim().toLowerCase();
          const searchValue = value.trim().toLowerCase();
          
          if (optionText.includes(searchValue) || searchValue.includes(optionText)) {
            element.selectedIndex = i;
            matched = true;
            break;
          }
        }
      }
      
      // إطلاق حدث التغيير
      if (matched) {
        const event = new Event('change', { bubbles: true });
        element.dispatchEvent(event);
        console.log(`تم اختيار "${element.options[element.selectedIndex].text}" من القائمة المنسدلة`);
        return true;
      } else {
        console.warn(`لم يتم العثور على خيار مطابق لـ "${value}" في القائمة المنسدلة`);
        return false;
      }
    } 
    else {
      console.warn(`نوع العنصر غير مدعوم:`, element);
      return false;
    }
  } catch (error) {
    console.error(`خطأ أثناء محاولة ملء الحقل:`, error);
    return false;
  }
};

/**
 * ملء جميع الحقول المطابقة للبيانات المحددة
 */
export const fillFormFields = (item: BookmarkletItem): {
  success: boolean;
  filled: string[];
  failed: string[];
  message: string;
} => {
  // تحضير البيانات للإدخال
  const inputValues = prepareItemForSiteInput(item);
  console.log("القيم المعدة للإدخال:", inputValues);
  
  // الحصول على تعريفات الحقول المناسبة للموقع الحالي
  const fieldMappings = getFieldMappingsForSite(window.location.hostname);
  console.log("تعريفات الحقول المستخدمة:", fieldMappings);
  
  // تتبع نجاح/فشل عمليات الإدخال
  const filledFields: string[] = [];
  const failedFields: string[] = [];
  
  // محاولة ملء كل حقل
  for (const mapping of fieldMappings) {
    const { key, selectors, required, transform } = mapping;
    
    if (!inputValues[key]) {
      if (required) {
        console.warn(`القيمة مفقودة للحقل المطلوب: ${key}`);
        failedFields.push(key);
      }
      continue;
    }
    
    // تطبيق أي تحويل مطلوب على القيمة
    const valueToFill = transform ? transform(inputValues[key]) : inputValues[key];
    
    // البحث عن العنصر المناسب
    const element = findElement(selectors);
    
    if (element) {
      const success = fillInputField(element, valueToFill);
      if (success) {
        filledFields.push(key);
        console.log(`تم ملء الحقل بنجاح: ${key} = "${valueToFill}"`);
      } else {
        failedFields.push(key);
        console.warn(`فشل في ملء الحقل: ${key} = "${valueToFill}"`);
      }
    } else {
      console.warn(`لم يتم العثور على عنصر للحقل: ${key}`);
      failedFields.push(key);
    }
  }
  
  // التعامل مع الحالات الخاصة لبعض المواقع
  handleSpecialCases(item, inputValues);
  
  // إنشاء رسالة النتيجة
  const totalFields = fieldMappings.length;
  const requiredFields = fieldMappings.filter(f => f.required).length;
  const filledRequired = fieldMappings
    .filter(f => f.required && filledFields.includes(f.key))
    .length;
  
  let message;
  let success;
  
  if (filledFields.length === 0) {
    message = "لم يتم العثور على أي حقول مطابقة أو ملؤها";
    success = false;
  } else if (filledRequired < requiredFields) {
    message = `تم ملء ${filledFields.length} من ${totalFields} حقول، لكن تم فقدان بعض الحقول المطلوبة`;
    success = false;
  } else {
    message = `تم ملء ${filledFields.length} من ${totalFields} حقول بنجاح`;
    success = true;
  }
  
  console.log(message);
  console.log("الحقول التي تم ملؤها:", filledFields);
  console.log("الحقول التي فشل ملؤها:", failedFields);
  
  return {
    success,
    filled: filledFields,
    failed: failedFields,
    message
  };
};

/**
 * معالجة الحالات الخاصة لبعض المواقع
 */
const handleSpecialCases = (item: BookmarkletItem, inputValues: Record<string, string>): void => {
  const hostname = window.location.hostname;
  
  // معالجة موقع الريان للتوصيل
  if (hostname.includes('alryanydelivery.com')) {
    try {
      // البحث عن وإدخال قيم في حقول خاصة
      const deliveryTypeElement = findElement(["select#deliveryType"]);
      if (deliveryTypeElement && deliveryTypeElement instanceof HTMLSelectElement) {
        // اختيار التوصيل إلى المنزل بشكل افتراضي
        for (let i = 0; i < deliveryTypeElement.options.length; i++) {
          const option = deliveryTypeElement.options[i];
          if (option.text.includes('توصيل') || option.text.includes('المنزل')) {
            deliveryTypeElement.selectedIndex = i;
            deliveryTypeElement.dispatchEvent(new Event('change', { bubbles: true }));
            console.log("تم اختيار نوع التوصيل تلقائيًا:", option.text);
            break;
          }
        }
      }
    } catch (error) {
      console.error("خطأ في معالجة الحالة الخاصة لموقع الريان:", error);
    }
  }
  
  // معالجة موقع express-box
  if (hostname.includes('express-box.net')) {
    try {
      // تأخير الضغط على زر الإرسال للتأكد من ملء جميع الحقول
      setTimeout(() => {
        const submitButton = findElement([
          "button.submit", 
          "button[type='submit']",
          "input[type='submit']"
        ]);
        if (submitButton) {
          console.log("تم العثور على زر الإرسال، سيتم الضغط عليه بعد 2 ثانية...");
          setTimeout(() => {
            (submitButton as HTMLElement).click();
            console.log("تم الضغط على زر الإرسال تلقائيًا");
          }, 2000);
        }
      }, 1000);
    } catch (error) {
      console.error("خطأ في معالجة الحالة الخاصة لموقع express-box:", error);
    }
  }
  
  // معالجة حقول الاختيار (الراديو والتشيكبوكس)
  try {
    // معالجة حقل الاستبدال
    if (inputValues.exchangeStatus) {
      const radioSelectors = [
        `input[type='radio'][value='${inputValues.exchangeStatus === 'نعم' ? '1' : '0'}']`,
        `input[type='radio'][name*='exchange']`,
        `input[type='radio'][id*='exchange']`
      ];
      
      const radioElement = findElement(radioSelectors);
      if (radioElement && radioElement instanceof HTMLInputElement) {
        radioElement.checked = true;
        radioElement.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("تم تعيين حالة الاستبدال:", inputValues.exchangeStatus);
      }
    }
    
    // معالجة حقل طريقة الدفع
    if (inputValues.paymentStatus) {
      let paymentValue = '0'; // افتراضي: نقدي
      
      if (inputValues.paymentStatus.includes('نقد') || 
          inputValues.paymentStatus.includes('cash')) {
        paymentValue = '0';
      } else if (inputValues.paymentStatus.includes('تحويل') || 
                 inputValues.paymentStatus.includes('transfer')) {
        paymentValue = '1';
      }
      
      const paymentSelectors = [
        `input[type='radio'][value='${paymentValue}']`,
        `input[type='radio'][name*='payment']`,
        `input[type='radio'][id*='payment']`
      ];
      
      const paymentElement = findElement(paymentSelectors);
      if (paymentElement && paymentElement instanceof HTMLInputElement) {
        paymentElement.checked = true;
        paymentElement.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("تم تعيين طريقة الدفع:", inputValues.paymentStatus);
      }
    }
  } catch (error) {
    console.error("خطأ في معالجة حقول الاختيار:", error);
  }
};
