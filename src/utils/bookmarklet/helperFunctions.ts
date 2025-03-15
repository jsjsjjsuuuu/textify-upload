
/**
 * دوال مساعدة للبوكماركلت
 */

// تنسيق رقم الهاتف العراقي
export const formatIraqiPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // إزالة كل شيء ما عدا الأرقام
  const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
  
  // تحقق من أنماط الأرقام العراقية المختلفة وتنسيقها
  if (digitsOnly.length === 10 && digitsOnly.startsWith('7')) {
    return '0' + digitsOnly; // إضافة الصفر في البداية
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('07')) {
    return digitsOnly; // الحفاظ على الرقم كما هو لأنه منسق بشكل صحيح
  } else if (digitsOnly.length === 13 && digitsOnly.startsWith('9647')) {
    return '0' + digitsOnly.substring(3); // تحويل الرقم الدولي إلى محلي
  } else if (digitsOnly.length === 14 && digitsOnly.startsWith('00964')) {
    return '0' + digitsOnly.substring(5); // تحويل الرقم الدولي بصيغة 00 إلى محلي
  }
  
  // للأرقام التي تبدو غير عراقية، حاول إجراء أفضل تخمين
  if (digitsOnly.length > 0 && !digitsOnly.startsWith('0')) {
    return '0' + digitsOnly; // إضافة صفر في البداية
  }
  
  return phoneNumber; // إرجاع الرقم كما هو إذا لم يطابق أي صيغة
};

// تنسيق المبالغ للاستخدام في حقول الإدخال
export const formatPrice = (price: string | number): string => {
  if (!price) return '0';
  
  // تحويل إلى نص إذا كان رقمًا
  const priceStr = typeof price === 'number' ? price.toString() : price;
  
  // التعامل مع القيم النصية الخاصة
  if (typeof priceStr === 'string' && 
      (priceStr.toLowerCase() === 'مجاني' || 
       priceStr.toLowerCase() === 'free' || 
       priceStr.toLowerCase() === 'واصل' || 
       priceStr.toLowerCase() === 'توصيل')) {
    return '0';
  }
  
  // إزالة كل شيء عدا الأرقام والعلامة العشرية
  const numericValue = priceStr.replace(/[^\d.]/g, '');
  
  // التحقق من وجود قيمة صالحة
  if (!numericValue || isNaN(Number(numericValue))) {
    return '0';
  }
  
  return numericValue;
};

// اكتشاف نوع النموذج في الصفحة
export const detectFormType = (): string => {
  console.log("[detectFormType] محاولة تحديد نوع النموذج في الصفحة...");
  
  // قائمة أنماط النماذج المعروفة
  const formPatterns = [
    { type: 'shipment-form', selectors: ['form[action*="shipment"]', 'form[id*="shipment"]', '[class*="shipment-form"]'] },
    { type: 'order-form', selectors: ['form[action*="order"]', 'form[id*="order"]', '[class*="order-form"]'] },
    { type: 'client-form', selectors: ['form[action*="client"]', 'form[id*="client"]', '[class*="client-form"]'] },
    { type: 'delivery-form', selectors: ['form[action*="delivery"]', 'form[id*="delivery"]', '[class*="delivery-form"]'] }
  ];
  
  let detectedType = 'unknown';
  
  for (const pattern of formPatterns) {
    for (const selector of pattern.selectors) {
      if (document.querySelector(selector)) {
        console.log(`[detectFormType] تم اكتشاف نوع النموذج: ${pattern.type}`);
        detectedType = pattern.type;
        break;
      }
    }
    if (detectedType !== 'unknown') break;
  }
  
  // إذا لم يتم اكتشاف النوع، حاول التخمين من عنوان الصفحة
  if (detectedType === 'unknown') {
    const title = document.title.toLowerCase();
    if (title.includes('شحن') || title.includes('shipment')) {
      detectedType = 'shipment-form';
    } else if (title.includes('طلب') || title.includes('order')) {
      detectedType = 'order-form';
    } else if (title.includes('عميل') || title.includes('زبون') || title.includes('client')) {
      detectedType = 'client-form';
    } else if (title.includes('توصيل') || title.includes('delivery')) {
      detectedType = 'delivery-form';
    }
  }
  
  console.log(`[detectFormType] نوع النموذج المكتشف: ${detectedType}`);
  return detectedType;
};

// اكتشاف متقدم للحقول
export const advancedFieldDetection = (documents: Document[], fieldMappings: any[], results: any): number => {
  console.log("[advancedFieldDetection] بدء البحث المتقدم عن الحقول...");
  let foundFields = 0;
  
  // البحث عن الحقول بناءً على النص القريب
  const searchByLabelText = (doc: Document, labelText: string[], inputTypes: string[]): HTMLElement | null => {
    // البحث عن عناصر التسمية التي تحتوي على النص المطلوب
    for (const text of labelText) {
      const labels = Array.from(doc.querySelectorAll('label, span, div, th, p, h1, h2, h3, h4, h5, h6'));
      for (const label of labels) {
        if (label.textContent && label.textContent.includes(text)) {
          // البحث عن حقل الإدخال القريب
          const forAttribute = (label as HTMLLabelElement).htmlFor;
          if (forAttribute) {
            const input = doc.getElementById(forAttribute) as HTMLElement;
            if (input && inputTypes.includes(input.tagName.toLowerCase())) {
              return input;
            }
          }
          
          // البحث في العناصر الأشقاء أو الأبناء
          const parent = label.parentElement;
          if (parent) {
            for (const type of inputTypes) {
              const inputs = Array.from(parent.querySelectorAll(type));
              if (inputs.length > 0) {
                return inputs[0] as HTMLElement;
              }
            }
          }
        }
      }
    }
    return null;
  };
  
  // الحقول المعروفة مع أنماط التسمية
  const fieldPatterns = [
    { key: 'code', labelTexts: ['رقم الوصل', 'رقم الشحنة', 'رقم الطلب', 'كود', 'الرقم'], inputTypes: ['input', 'select'] },
    { key: 'phoneNumber', labelTexts: ['رقم الهاتف', 'جوال', 'موبايل', 'تليفون', 'هاتف العميل'], inputTypes: ['input'] },
    { key: 'senderName', labelTexts: ['اسم المرسل', 'اسم العميل', 'المرسل', 'العميل', 'الزبون'], inputTypes: ['input', 'select'] },
    { key: 'province', labelTexts: ['المحافظة', 'المدينة', 'المنطقة', 'المكان', 'إلى'], inputTypes: ['select', 'input'] },
    { key: 'price', labelTexts: ['المبلغ', 'السعر', 'التكلفة', 'قيمة الطلب', 'المبلغ الكلي'], inputTypes: ['input'] },
    { key: 'delegateName', labelTexts: ['المندوب', 'السائق', 'الموظف', 'عامل التوصيل', 'المسؤول'], inputTypes: ['select', 'input'] }
  ];
  
  // البحث في كل وثيقة
  for (const doc of documents) {
    for (const pattern of fieldPatterns) {
      // التحقق مما إذا كان هذا الحقل قد تم ملؤه بالفعل
      const mapping = fieldMappings.find(m => m.key === pattern.key);
      if (!mapping) continue;
      
      // البحث عن حقل باستخدام أنماط التسمية
      const element = searchByLabelText(doc, pattern.labelTexts, pattern.inputTypes);
      if (element) {
        console.log(`[advancedFieldDetection] تم العثور على حقل ${pattern.key} باستخدام البحث المتقدم`);
        
        // محاولة ملء الحقل
        const filledStatus = fillSingleField(element, mapping, results);
        if (filledStatus) {
          foundFields++;
        }
      }
    }
  }
  
  console.log(`[advancedFieldDetection] تم العثور على ${foundFields} حقول باستخدام البحث المتقدم`);
  return foundFields;
};

// ملء حقل واحد
export const fillSingleField = (element: HTMLElement, mapping: any, results: any): boolean => {
  console.log(`[fillSingleField] محاولة ملء حقل ${mapping.key} بالقيمة ${mapping.value}`);
  
  try {
    if (!element || !mapping.value) {
      return false;
    }
    
    // التعامل مع أنواع مختلفة من عناصر الإدخال
    if (element.tagName === 'SELECT') {
      const selectElement = element as HTMLSelectElement;
      const options = Array.from(selectElement.options);
      
      // البحث عن الخيار المطابق للقيمة أو النص
      let found = false;
      const value = mapping.value.toString().trim();
      
      // أولاً، البحث عن تطابق دقيق
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.value === value || option.text === value) {
          selectElement.selectedIndex = i;
          found = true;
          break;
        }
      }
      
      // إذا لم يتم العثور على تطابق دقيق، البحث عن تطابق جزئي
      if (!found) {
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          if (option.value.includes(value) || option.text.includes(value) || 
              value.includes(option.value) || value.includes(option.text)) {
            selectElement.selectedIndex = i;
            found = true;
            break;
          }
        }
      }
      
      if (found) {
        // تشغيل حدث التغيير
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        results.filled.push(mapping.key);
        console.log(`[fillSingleField] تم ملء حقل ${mapping.key} بالقيمة ${mapping.value} بنجاح`);
        return true;
      }
    } else if (element.tagName === 'INPUT') {
      const inputElement = element as HTMLInputElement;
      inputElement.value = mapping.value.toString();
      
      // تشغيل أحداث لتحديث الواجهة
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      
      results.filled.push(mapping.key);
      console.log(`[fillSingleField] تم ملء حقل ${mapping.key} بالقيمة ${mapping.value} بنجاح`);
      return true;
    } else if (element.tagName === 'TEXTAREA') {
      const textareaElement = element as HTMLTextAreaElement;
      textareaElement.value = mapping.value.toString();
      
      // تشغيل أحداث لتحديث الواجهة
      textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
      textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
      
      results.filled.push(mapping.key);
      console.log(`[fillSingleField] تم ملء حقل ${mapping.key} بالقيمة ${mapping.value} بنجاح`);
      return true;
    }
  } catch (error) {
    console.error(`[fillSingleField] خطأ في ملء الحقل ${mapping.key}:`, error);
  }
  
  return false;
};

// البحث عن زر الحفظ والضغط عليه تلقائيًا
export const findAndClickIraqiSaveButton = (): boolean => {
  console.log("[findAndClickIraqiSaveButton] البحث عن زر الحفظ...");
  
  // قائمة المحددات المحتملة لزر الحفظ
  const saveButtonSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:contains("حفظ")',
    'button:contains("تأكيد")',
    'button:contains("إرسال")',
    'button:contains("تحديث")',
    'button:contains("save")',
    'button:contains("submit")',
    'button:contains("confirm")',
    'button:contains("update")',
    'button.btn-primary',
    'button.btn-success',
    'button.save-btn',
    'button.submit-btn',
    'button.confirm-btn',
    'button.update-btn',
    // محددات إضافية للمواقع العراقية
    'button:contains("احفظ")',
    'button:contains("تثبيت")',
    'button:contains("تم")',
    'button.btn-save',
    'button.btn-confirm',
    'button.save'
  ];
  
  // تعريف دالة جديدة لمحاكاة :contains في jQuery
  const getElementByText = (tagName: string, text: string): HTMLElement | null => {
    const elements = document.querySelectorAll(tagName);
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].textContent && elements[i].textContent.includes(text)) {
        return elements[i] as HTMLElement;
      }
    }
    return null;
  };
  
  // البحث عن زر الحفظ
  let saveButton: HTMLElement | null = null;
  
  for (const selector of saveButtonSelectors) {
    // إذا كان المحدد يستخدم :contains
    if (selector.includes(':contains(')) {
      const match = selector.match(/(\w+):contains\("(.+)"\)/);
      if (match) {
        const [_, tagName, text] = match;
        saveButton = getElementByText(tagName, text);
      }
    } else {
      // استخدام querySelector العادي
      saveButton = document.querySelector(selector) as HTMLElement;
    }
    
    if (saveButton) {
      console.log(`[findAndClickIraqiSaveButton] تم العثور على زر الحفظ باستخدام المحدد: ${selector}`);
      break;
    }
  }
  
  // إذا تم العثور على زر الحفظ، اضغط عليه
  if (saveButton) {
    try {
      // التحقق مما إذا كان الزر مرئيًا وممكّنًا
      const style = window.getComputedStyle(saveButton);
      if (style.display !== 'none' && style.visibility !== 'hidden' && !(saveButton as HTMLButtonElement).disabled) {
        // لا تضغط على الزر حقًا في الوقت الحالي، فقط سجل أنه تم العثور عليه
        console.log("[findAndClickIraqiSaveButton] تم العثور على زر الحفظ. لا يتم الضغط عليه تلقائيًا لتجنب الإرسال غير المقصود.");
        // saveButton.click(); // تم تعطيله لتجنب الإرسال غير المقصود
        return true;
      } else {
        console.log("[findAndClickIraqiSaveButton] تم العثور على زر الحفظ ولكنه غير مرئي أو معطل");
      }
    } catch (e) {
      console.error("[findAndClickIraqiSaveButton] خطأ أثناء محاولة الضغط على زر الحفظ:", e);
    }
  } else {
    console.log("[findAndClickIraqiSaveButton] لم يتم العثور على زر الحفظ");
  }
  
  return false;
};
