
// تحديث interface لأنواع HTML المختلفة للحقول
interface ElementWithValue extends HTMLElement {
  value?: string;
  checked?: boolean;
  type?: string;
  name?: string;
  placeholder?: string;
}

// النتائج المُرجعة من محاولة ملء النموذج
interface FormFillerResults {
  filled: string[];
  failed: string[];
  message: string;
  success: boolean;
  attempted: number;
}

// تعبئة الحقول في الصفحة المستهدفة
export const fillFormFields = (item: any): FormFillerResults => {
  if (!item) return { filled: [], failed: [], message: 'لا توجد بيانات', success: false, attempted: 0 };
  
  console.log("بدء ملء النموذج بالبيانات:", item);
  
  // تعريف خريطة الحقول مع تحسين المحددات
  const fieldMappings = [
    {
      key: 'code',
      label: 'رقم الوصل',
      value: item.code || '',
      selectors: [
        'input[name*="code"]',
        'input[id*="code"]',
        'input[placeholder*="رقم الوصل"]',
        'input[placeholder*="رقم البوليصة"]',
        'input[placeholder*="رقم الشحنة"]',
        'input[placeholder*="رقم الطلب"]',
        'input[name*="order"]',
        'input[id*="order"]',
        'input[name*="tracking"]',
        'input[id*="tracking"]',
        'input[name*="reference"]',
        'input[id*="reference"]'
      ]
    },
    {
      key: 'phoneNumber',
      label: 'رقم الهاتف',
      value: item.phoneNumber ? item.phoneNumber.replace(/\D/g, '') : '',
      selectors: [
        'input[name*="phone"]',
        'input[id*="phone"]',
        'input[type="tel"]',
        'input[placeholder*="رقم الهاتف"]',
        'input[placeholder*="موبايل"]',
        'input[placeholder*="جوال"]',
        'input[name*="mobile"]',
        'input[id*="mobile"]',
        'input[placeholder*="تليفون"]',
        'input[name*="tel"]',
        'input[id*="tel"]'
      ]
    },
    {
      key: 'senderName',
      label: 'اسم المرسل',
      value: item.senderName || item.customerName || '',
      selectors: [
        'input[name*="sender"]',
        'input[name*="customer"]',
        'input[id*="sender"]',
        'input[id*="customer"]',
        'input[placeholder*="اسم المرسل"]',
        'input[placeholder*="اسم العميل"]',
        'input[placeholder*="الزبون"]',
        'input[placeholder*="المرسل"]',
        'input[name*="client"]',
        'input[id*="client"]',
        'input[name="name"]'
      ]
    },
    {
      key: 'recipientName',
      label: 'اسم المستلم',
      value: item.recipientName || '',
      selectors: [
        'input[name*="recipient"]',
        'input[name*="receiver"]',
        'input[id*="recipient"]',
        'input[id*="receiver"]',
        'input[placeholder*="اسم المستلم"]',
        'input[placeholder*="المستلم"]',
        'input[name*="consignee"]',
        'input[id*="consignee"]'
      ]
    },
    {
      key: 'province',
      label: 'المحافظة',
      value: item.province || item.area || '',
      selectors: [
        'select[name*="province"]',
        'select[id*="province"]',
        'select[name*="city"]',
        'select[id*="city"]',
        'select[placeholder*="المحافظة"]',
        'select[placeholder*="المدينة"]',
        'select[name*="governorate"]',
        'select[id*="governorate"]',
        'select[name*="area"]',
        'select[id*="area"]',
        'select[placeholder*="منطقة"]',
        'input[name*="province"]',
        'input[id*="province"]',
        'input[placeholder*="المحافظة"]'
      ]
    },
    {
      key: 'price',
      label: 'المبلغ',
      value: item.price ? item.price.replace(/[^\d.]/g, '') : '',
      selectors: [
        'input[name*="price"]',
        'input[name*="amount"]',
        'input[id*="price"]',
        'input[id*="amount"]',
        'input[placeholder*="المبلغ"]',
        'input[placeholder*="السعر"]',
        'input[type="number"]',
        'input[name*="total"]',
        'input[id*="total"]',
        'input[name*="cost"]',
        'input[id*="cost"]',
        'input[placeholder*="التكلفة"]'
      ]
    },
    {
      key: 'notes',
      label: 'ملاحظات',
      value: item.notes || '',
      selectors: [
        'textarea[name*="note"]',
        'textarea[id*="note"]',
        'textarea[placeholder*="ملاحظات"]',
        'textarea[name*="comment"]',
        'textarea[id*="comment"]',
        'textarea[placeholder*="تعليق"]',
        'input[name*="note"]',
        'input[id*="note"]',
        'input[placeholder*="ملاحظات"]'
      ]
    },
    {
      key: 'packageType',
      label: 'نوع البضاعة',
      value: item.packageType || 'بضائع متنوعة',
      selectors: [
        'select[name*="type"]',
        'select[id*="type"]',
        'select[name*="product"]',
        'select[id*="product"]',
        'select[placeholder*="نوع البضاعة"]',
        'input[name*="type"]',
        'input[id*="type"]',
        'input[placeholder*="نوع البضاعة"]',
        'textarea[name*="product"]',
        'textarea[id*="product"]',
        'textarea[placeholder*="نوع البضاعة"]'
      ]
    }
  ];
  
  // تتبع الحقول المملوءة والفاشلة
  const results: FormFillerResults = {
    filled: [],
    failed: [],
    message: '',
    success: false,
    attempted: 0
  };
  
  // أولاً، محاولة تحديد نوع النموذج والحقول المطلوبة
  const hostName = window.location.hostname;
  console.log(`موقع الويب الحالي: ${hostName}`);
  
  // محاولة تحديد الإطارات وتجريب العمل داخلها أيضًا
  const frames = document.querySelectorAll('iframe');
  let documents = [document];
  
  try {
    // إضافة وثائق الإطارات إذا كان يمكن الوصول إليها
    frames.forEach(frame => {
      try {
        if (frame.contentDocument) {
          documents.push(frame.contentDocument);
        }
      } catch (e) {
        console.warn("لا يمكن الوصول إلى إطار بسبب سياسة CORS:", e);
      }
    });
  } catch (e) {
    console.warn("خطأ في محاولة الوصول إلى الإطارات:", e);
  }
  
  // البحث في عناصر الصفحة ومحاولة ملئها
  fieldMappings.forEach(mapping => {
    results.attempted++;
    
    try {
      // تجربة البحث في كل وثيقة متاحة (الصفحة الرئيسية والإطارات)
      let filled = false;
      
      for (const doc of documents) {
        if (filled) break;
        
        for (const selector of mapping.selectors) {
          const elements = doc.querySelectorAll(selector);
          
          if (elements.length > 0) {
            // اختر أول عنصر مناسب
            const firstElement = elements[0] as ElementWithValue;
            console.log(`وجدت عنصر للحقل ${mapping.key} باستخدام المحدد ${selector}`);
            
            // محاولة ملء الحقل
            const filledStatus = fillSingleField(firstElement, mapping, results);
            
            if (filledStatus) {
              filled = true;
              break;
            }
          }
        }
      }
      
      // إذا لم يتم العثور على حقل أو ملئه بنجاح
      if (!filled) {
        results.failed.push(mapping.key);
        console.log(`فشل في العثور على أو ملء الحقل: ${mapping.key}`);
      }
    } catch (error) {
      console.error(`خطأ عام في معالجة الحقل ${mapping.key}:`, error);
      results.failed.push(mapping.key);
    }
  });
  
  // إذا لم يتم العثور على حقول كافية، حاول البحث بشكل أكثر ذكاءً
  if (results.filled.length < 3) {
    console.log("عدد قليل من الحقول تم ملؤها، محاولة استراتيجية متقدمة للاكتشاف...");
    
    // البحث عن جميع الحقول المحتملة في الصفحة
    for (const doc of documents) {
      const allInputs = doc.querySelectorAll('input, select, textarea');
      
      allInputs.forEach((input: ElementWithValue) => {
        try {
          // لكل حقل، حاول تخمين نوعه بناء على سماته
          const fieldType = guessFieldType(input);
          
          if (fieldType !== 'unknown') {
            // العثور على البيانات المقابلة من العنصر
            const mapping = fieldMappings.find(m => 
              m.key === fieldType || 
              (fieldType === 'senderName' && m.key === 'customerName') ||
              (fieldType === 'customerPhone' && m.key === 'phoneNumber') ||
              (fieldType === 'area' && m.key === 'province') ||
              (fieldType === 'totalAmount' && m.key === 'price')
            );
            
            if (mapping && !results.filled.includes(mapping.key)) {
              console.log(`محاولة اكتشاف متقدمة: محاولة ملء الحقل ${fieldType} بقيمة ${mapping.value}`);
              fillSingleField(input, mapping, results);
            }
          }
        } catch (e) {
          console.warn("خطأ في تخمين وملء حقل:", e);
        }
      });
    }
  }
  
  // بعد ملء الحقول، محاولة الضغط على زر الحفظ تلقائيًا
  try {
    const saveButtonClicked = findAndClickSaveButton();
    if (saveButtonClicked) {
      console.log("تم العثور على زر الحفظ والضغط عليه تلقائيًا");
    } else {
      console.log("لم يتم العثور على زر الحفظ، يرجى الضغط عليه يدويًا");
    }
  } catch (e) {
    console.warn("خطأ أثناء محاولة الضغط على زر الحفظ:", e);
  }
  
  // تحديث حالة النتائج
  if (results.filled.length > 0) {
    results.success = true;
    results.message = `تم ملء ${results.filled.length} حقول بنجاح`;
  } else {
    results.success = false;
    results.message = "لم يتم العثور على حقول مطابقة أو ملؤها";
  }
  
  return results;
};

// دالة مساعدة لملء حقل واحد
const fillSingleField = (element: ElementWithValue, mapping: any, results: FormFillerResults): boolean => {
  // البحث عن العنصر في الصفحة - لم نعد بحاجة للبحث لأن العنصر تم العثور عليه بالفعل
  try {
    // إذا وجدنا عنصرًا وكان لدينا قيمة، نحاول ملئه
    if (element && mapping.value) {
      // تحديد نوع العنصر وملئه بالطريقة المناسبة
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'select') {
        return fillSelectField(element as HTMLSelectElement, mapping, results);
      } else if (tagName === 'input' || tagName === 'textarea') {
        return fillInputField(element, mapping, results);
      } else {
        // لأنواع الحقول الأخرى
        console.log(`نوع حقل غير معروف: ${tagName}`);
        return false;
      }
    } else {
      // إذا لم نجد العنصر أو لم تكن هناك قيمة
      if (!element) {
        console.log(`لم يتم العثور على عنصر للحقل: ${mapping.key}`);
      } else {
        console.log(`لا توجد قيمة للحقل: ${mapping.key}`);
      }
      return false;
    }
  } catch (error) {
    console.error(`خطأ في ملء الحقل ${mapping.key}:`, error);
    return false;
  }
};

// دالة مساعدة لملء حقول القائمة المنسدلة
const fillSelectField = (element: HTMLSelectElement, mapping: any, results: FormFillerResults): boolean => {
  // تحسين آلية تحديد الخيار المناسب في القائمة المنسدلة
  const options = Array.from(element.options);
  const value = mapping.value.toString().trim().toLowerCase();
  
  // 1. البحث عن تطابق دقيق للنص
  let matchedOption = options.find(opt => 
    opt.text.trim().toLowerCase() === value || 
    opt.value.toLowerCase() === value
  );
  
  // 2. إذا لم يكن هناك تطابق دقيق، ابحث عن تطابق جزئي
  if (!matchedOption) {
    matchedOption = options.find(opt => 
      opt.text.trim().toLowerCase().includes(value) || 
      value.includes(opt.text.trim().toLowerCase())
    );
  }
  
  // 3. محاولة مطابقة خاصة للمحافظات العراقية
  if (!matchedOption && mapping.key === 'province') {
    // خريطة المحافظات العراقية وبداائلها
    const provinceMap: {[key: string]: string[]} = {
      'بغداد': ['baghdad', 'بقداد', 'بغدات'],
      'البصرة': ['basra', 'basrah', 'البصره'],
      'نينوى': ['nineveh', 'mosul', 'الموصل', 'موصل', 'نينوه'],
      'أربيل': ['erbil', 'arbil', 'اربيل', 'اربل'],
      'النجف': ['najaf', 'نجف'],
      'كربلاء': ['karbala', 'كربلا'],
      'ذي قار': ['dhi qar', 'thi qar', 'ذيقار', 'ذى قار', 'الناصرية'],
      'الأنبار': ['anbar', 'الانبار', 'انبار', 'الرمادي'],
      'ديالى': ['diyala', 'ديالا', 'بعقوبة'],
      'كركوك': ['kirkuk', 'كرگوک'],
      'صلاح الدين': ['salah al-din', 'saladin', 'صلاحدين', 'صلاح دين', 'تكريت'],
      'بابل': ['babylon', 'babil', 'الحلة', 'hillah'],
      'المثنى': ['muthanna', 'مثنى', 'السماوة'],
      'القادسية': ['qadisiyyah', 'قادسية', 'الديوانية', 'diwaniyah'],
      'واسط': ['wasit', 'kut', 'الكوت'],
      'ميسان': ['maysan', 'missan', 'العمارة'],
      'دهوك': ['dhok', 'dohuk'],
      'السليمانية': ['sulaymaniyah', 'سليمانية', 'سلیمانیة']
    };
    
    // محاولة العثور على المحافظة بقائمة البدائل
    for (const [province, aliases] of Object.entries(provinceMap)) {
      if (value === province.toLowerCase() || aliases.some(alias => value.includes(alias.toLowerCase()))) {
        matchedOption = options.find(opt => 
          opt.text.toLowerCase().includes(province.toLowerCase()) || 
          aliases.some(alias => opt.text.toLowerCase().includes(alias.toLowerCase()))
        );
        
        if (matchedOption) break;
      }
    }
  }
  
  // إذا وجدنا خيارًا مناسبًا
  if (matchedOption) {
    // تعيين القيمة للخيار المحدد
    element.value = matchedOption.value;
    console.log(`تم ملء القائمة المنسدلة ${mapping.key} بالقيمة: ${matchedOption.text} (${matchedOption.value})`);
    results.filled.push(mapping.key);
    
    // إطلاق أحداث التغيير
    triggerEvents(element);
    return true;
  }
  
  // إذا لم نجد خيارًا مناسبًا، نحاول استخدام أول خيار غير فارغ
  if (options.length > 0) {
    for (const option of options) {
      if (option.value && option.value !== '' && option.text.trim() !== '') {
        element.value = option.value;
        console.log(`استخدام الخيار الأول لـ ${mapping.key}: ${option.text}`);
        results.filled.push(mapping.key);
        
        // إطلاق أحداث التغيير
        triggerEvents(element);
        return true;
      }
    }
  }
  
  console.log(`لم يتم العثور على خيار مناسب للقائمة المنسدلة: ${mapping.key}`);
  return false;
};

// دالة مساعدة لملء حقول الإدخال النصية
const fillInputField = (element: ElementWithValue, mapping: any, results: FormFillerResults): boolean => {
  try {
    if (element.type === 'checkbox' || element.type === 'radio') {
      // للمربعات أو أزرار الاختيار
      const shouldCheck = mapping.value === 'true' || mapping.value === '1' || mapping.value.toLowerCase() === 'نعم';
      (element as HTMLInputElement).checked = shouldCheck;
      console.log(`تم ضبط خانة الاختيار: ${mapping.key} = ${shouldCheck}`);
    } else {
      // تحسين معالجة القيم للحقول المختلفة
      let finalValue = mapping.value;
      
      if (element.type === 'tel' || mapping.key === 'phoneNumber') {
        // تنظيف رقم الهاتف
        finalValue = mapping.value.replace(/\D/g, '');
      } else if (element.type === 'number' || mapping.key === 'price') {
        // تنظيف المبالغ من الأحرف غير الرقمية
        finalValue = mapping.value.replace(/[^\d.]/g, '');
      }
      
      // تعيين القيمة مباشرة وكذلك defaultValue للتغلب على بعض الحماية
      (element as HTMLInputElement).value = finalValue;
      
      if ('defaultValue' in element) {
        (element as HTMLInputElement).defaultValue = finalValue;
      }
    }
    
    // إطلاق سلسلة من أحداث DOM للتغلب على آليات الحماية
    triggerEvents(element);
    
    console.log(`تم ملء الحقل: ${mapping.key} بالقيمة: ${mapping.value}`);
    results.filled.push(mapping.key);
    return true;
  } catch (e) {
    console.error(`خطأ في ملء الحقل ${mapping.key}:`, e);
    return false;
  }
};

// دالة مساعدة لإطلاق أحداث DOM على العنصر
const triggerEvents = (element: ElementWithValue): void => {
  // قائمة بالأحداث المهمة التي يجب إطلاقها
  const events = ['input', 'change', 'blur', 'focus'];
  
  for (const eventType of events) {
    try {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
    } catch (e) {
      console.warn(`خطأ في إطلاق حدث ${eventType}:`, e);
      
      // خطة بديلة باستخدام الواجهة البرمجية القديمة للأحداث
      try {
        const legacyEvent = document.createEvent('HTMLEvents');
        legacyEvent.initEvent(eventType, true, true);
        element.dispatchEvent(legacyEvent);
      } catch (legacyError) {
        console.warn(`فشل أيضًا في إطلاق الحدث بالطريقة القديمة:`, legacyError);
      }
    }
  }
  
  // إضافة محاكاة النقر لبعض الحقول
  if (element.type === 'checkbox' || element.type === 'radio') {
    try {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      element.dispatchEvent(clickEvent);
    } catch (e) {
      console.warn(`خطأ في إطلاق حدث النقر:`, e);
    }
  }
};

// دالة مساعدة لتخمين نوع الحقل من اسمه وسماته
const guessFieldType = (element: ElementWithValue): string => {
  // استخراج معلومات مفيدة من العنصر
  const tagName = element.tagName.toLowerCase();
  const name = element.name?.toLowerCase() || '';
  const id = element.id?.toLowerCase() || '';
  const type = element.type?.toLowerCase() || '';
  const placeholder = element.placeholder?.toLowerCase() || '';
  
  // محاولة العثور على تسمية مرتبطة بالحقل
  let labelText = '';
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
      labelText = label.textContent?.toLowerCase() || '';
    }
  }
  
  // جمع كل المعلومات في نص واحد للبحث
  const allText = `${name} ${id} ${type} ${placeholder} ${labelText}`;
  
  // البحث عن كلمات مفتاحية للحقول المختلفة
  if (allText.match(/كود|code|رقم.*وصل|رقم.*طلب|رقم.*شحنة|reference|ref|order/)) {
    return 'code';
  }
  
  if (allText.match(/هاتف|phone|موبايل|جوال|tel|mobile|اتصال/) || type === 'tel') {
    return 'phoneNumber';
  }
  
  if (allText.match(/اسم.*مرسل|اسم.*عميل|sender|customer|client|name/) && !allText.match(/مستلم|receiver/)) {
    return 'senderName';
  }
  
  if (allText.match(/اسم.*مستلم|recipient|receiver|consignee/)) {
    return 'recipientName';
  }
  
  if (allText.match(/محافظة|province|مدينة|city|منطقة|area/)) {
    return 'province';
  }
  
  if (allText.match(/سعر|مبلغ|price|amount|cost|total/) || type === 'number') {
    return 'price';
  }
  
  if (allText.match(/ملاحظات|notes|comments|تعليق/)) {
    return 'notes';
  }
  
  if (allText.match(/نوع.*بضاعة|type|product|package/)) {
    return 'packageType';
  }
  
  return 'unknown';
};

// دالة للبحث عن زر الحفظ والضغط عليه
const findAndClickSaveButton = (): boolean => {
  console.log("البحث عن زر الحفظ...");
  
  // محددات محتملة لزر الحفظ
  const saveButtonSelectors = [
    // أزرار مع نص متعلق بالحفظ
    'button:contains("حفظ")', 
    'button:contains("احفظ")',
    'button:contains("إضافة")',
    'button:contains("تأكيد")',
    'button:contains("إرسال")',
    'input[type="submit"][value*="حفظ"]',
    'input[type="submit"][value*="إرسال"]',
    'input[type="button"][value*="حفظ"]',
    // أزرار بناء على أنماط CSS
    'button[type="submit"]',
    '.save-button', 
    '.btn-save',
    '.btn-primary',
    '.btn-success',
    // أزرار أخرى
    'form button:last-child',
    'form input[type="submit"]:last-child'
  ];
  
  // وظيفة مساعدة للبحث عن أزرار تحتوي على نص محدد
  const findButtonsWithText = (text: string): HTMLElement[] => {
    const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
    return Array.from(allButtons).filter(btn => {
      const buttonText = btn.textContent?.trim().toLowerCase() || '';
      const buttonValue = (btn as HTMLInputElement).value?.toLowerCase() || '';
      return buttonText.includes(text) || buttonValue.includes(text);
    }) as HTMLElement[];
  };
  
  // محاولة العثور على زر
  for (const selector of saveButtonSelectors) {
    if (selector.includes(':contains("')) {
      // استخراج النص المطلوب البحث عنه من المحدد
      const match = selector.match(/:contains\("([^"]+)"\)/);
      if (match && match[1]) {
        const searchText = match[1].toLowerCase();
        const buttons = findButtonsWithText(searchText);
        
        if (buttons.length > 0) {
          try {
            console.log(`وجدت زر مع النص "${searchText}"، محاولة النقر عليه...`);
            buttons[0].click();
            return true;
          } catch (e) {
            console.warn(`خطأ أثناء النقر على زر "${searchText}":`, e);
          }
        }
      }
    } else {
      // استخدام المحدد مباشرة
      try {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > 0) {
          console.log(`وجدت زر باستخدام المحدد "${selector}"، محاولة النقر عليه...`);
          (buttons[0] as HTMLElement).click();
          return true;
        }
      } catch (e) {
        console.warn(`خطأ في العثور على أو النقر على الزر باستخدام المحدد "${selector}":`, e);
      }
    }
  }
  
  // البحث في جميع الأزرار في الصفحة
  const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
  console.log(`وجدت ${allButtons.length} زر في الصفحة، محاولة تحديد زر الحفظ...`);
  
  // تصنيف الأزرار حسب احتمالية كونها زر حفظ
  const buttonScores: {element: HTMLElement, score: number}[] = [];
  
  for (const button of Array.from(allButtons)) {
    const buttonElement = button as HTMLElement;
    let score = 0;
    
    // النص في الزر
    const buttonText = buttonElement.textContent?.trim().toLowerCase() || '';
    const buttonValue = (buttonElement as HTMLInputElement).value?.toLowerCase() || '';
    const buttonClasses = buttonElement.className.toLowerCase();
    const buttonId = buttonElement.id.toLowerCase();
    const buttonType = (buttonElement as HTMLInputElement).type?.toLowerCase() || '';
    
    // زيادة النقاط بناء على النص
    if (buttonText.includes('حفظ') || buttonText.includes('save')) score += 10;
    if (buttonText.includes('إرسال') || buttonText.includes('submit')) score += 8;
    if (buttonText.includes('تأكيد') || buttonText.includes('confirm')) score += 7;
    if (buttonText.includes('إضافة') || buttonText.includes('add')) score += 6;
    if (buttonValue.includes('حفظ') || buttonValue.includes('save')) score += 10;
    
    // زيادة النقاط بناء على السمات
    if (buttonClasses.includes('save') || buttonId.includes('save')) score += 5;
    if (buttonClasses.includes('submit') || buttonId.includes('submit')) score += 5;
    if (buttonClasses.includes('primary') || buttonClasses.includes('success')) score += 3;
    if (buttonType === 'submit') score += 4;
    
    // موقع الزر في النموذج
    const isInForm = buttonElement.closest('form') !== null;
    if (isInForm) score += 2;
    
    // موقع الزر في الصفحة (الأزرار في أسفل الصفحة غالبًا ما تكون أزرار حفظ)
    const rect = buttonElement.getBoundingClientRect();
    const isInBottomHalf = rect.top > window.innerHeight / 2;
    if (isInBottomHalf) score += 1;
    
    // إضافة إلى القائمة مع النتيجة
    buttonScores.push({element: buttonElement, score});
  }
  
  // ترتيب الأزرار حسب النتيجة من الأعلى إلى الأدنى
  buttonScores.sort((a, b) => b.score - a.score);
  
  // محاولة النقر على الزر ذي أعلى نتيجة
  if (buttonScores.length > 0 && buttonScores[0].score > 0) {
    try {
      const bestButton = buttonScores[0].element;
      console.log(`محاولة النقر على أفضل زر محتمل (النتيجة: ${buttonScores[0].score})...`);
      bestButton.click();
      return true;
    } catch (e) {
      console.warn("خطأ أثناء النقر على أفضل زر محتمل:", e);
    }
  }
  
  console.log("لم يتم العثور على زر حفظ مناسب");
  return false;
};

