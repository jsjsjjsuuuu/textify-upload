
import { BookmarkletItem, BookmarkletExportData } from "@/types/ImageData";
import { getFromLocalStorage, updateItemStatus } from "@/utils/bookmarkletService";

/**
 * متحكم البوكماركلت - مجموعة من الوظائف التي يمكن استخدامها في كود البوكماركلت
 * هذا الملف سيحتوي على المنطق الأساسي لعمل البوكماركلت، منفصلاً عن كود التوليد
 */

/**
 * وظيفة البحث عن العناصر في الصفحة
 */
export const findFormFields = () => {
  // تحسين البحث عن الحقول المختلفة في الصفحة
  const fields = document.querySelectorAll('input, select, textarea, [contenteditable="true"]');
  
  // التعامل مع الأطر الداخلية
  const iframes = document.querySelectorAll('iframe');
  const allFields = Array.from(fields);
  
  // محاولة الوصول إلى الحقول داخل الأطر الداخلية إذا كان ممكنًا
  for (const iframe of Array.from(iframes)) {
    try {
      if (iframe.contentDocument && iframe.contentDocument.querySelectorAll) {
        const iframeFields = iframe.contentDocument.querySelectorAll('input, select, textarea, [contenteditable="true"]');
        allFields.push(...Array.from(iframeFields));
      }
    } catch (e) {
      // تجاهل أخطاء نفس المصدر
      console.log('لا يمكن الوصول إلى iframe بسبب سياسة نفس المصدر');
    }
  }
  
  // تحسين: طباعة عدد الحقول التي تم العثور عليها للتشخيص
  console.log(`[Bookmarklet] تم العثور على ${allFields.length} حقل في الصفحة`);
  
  return allFields;
};

/**
 * وظيفة تخمين نوع الحقل بناء على السمات المختلفة
 */
export const guessFieldType = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement): string => {
  // جمع كل المعرّفات المحتملة للحقل
  let name = '';
  let id = '';
  let className = '';
  let placeholderText = '';
  
  // التحقق من نوع العنصر قبل الوصول إلى الخصائص الخاصة به
  if ('name' in field) {
    name = field.name ? field.name.toLowerCase() : '';
  }
  
  if ('id' in field) {
    id = field.id ? field.id.toLowerCase() : '';
  } else {
    // تحقق أن field هو من نوع HTMLElement
    const elem = field as HTMLElement;
    if (elem && typeof elem.getAttribute === 'function') {
      const idAttr = elem.getAttribute('id');
      if (idAttr) {
        id = idAttr.toLowerCase();
      }
    }
  }
  
  if ('className' in field && typeof field.className === 'string') {
    className = field.className.toLowerCase();
  }
  
  if ('placeholder' in field && field.placeholder) {
    placeholderText = field.placeholder.toLowerCase();
  } else {
    // تحقق أن field هو من نوع HTMLElement
    const elem = field as HTMLElement;
    if (elem && typeof elem.getAttribute === 'function') {
      const placeholderAttr = elem.getAttribute('placeholder');
      if (placeholderAttr) {
        placeholderText = placeholderAttr.toLowerCase();
      }
    }
  }
  
  // البحث عن الـ label المرتبط
  let labelText = '';
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
      labelText = label.textContent ? label.textContent.toLowerCase() : '';
    }
  }
  
  // تحديد تسمية الحقل من العناصر المجاورة
  let surroundingLabelText = '';
  // البحث عن أي div أو span قريب يمكن أن يكون تسمية
  let parent = field.parentElement;
  let siblingText = '';
  
  if (parent) {
    // ابحث عن العناصر النصية المجاورة للحقل
    const siblings = Array.from(parent.childNodes);
    const fieldIndex = siblings.indexOf(field);
    
    // ابحث عن أي نص قبل الحقل
    for (let i = 0; i < fieldIndex; i++) {
      const sibling = siblings[i];
      if (sibling.nodeType === Node.TEXT_NODE) {
        const text = sibling.textContent?.trim();
        if (text && text.length > 0) {
          siblingText += text + ' ';
        }
      } else if (sibling.nodeType === Node.ELEMENT_NODE) {
        const text = sibling.textContent?.trim();
        if (text && text.length > 0 && 
            (sibling as Element).tagName !== 'INPUT' && 
            (sibling as Element).tagName !== 'SELECT' && 
            (sibling as Element).tagName !== 'TEXTAREA') {
          siblingText += text + ' ';
        }
      }
    }
  }
  
  surroundingLabelText = siblingText.trim();
  
  // فحص النص المحيط
  let surroundingText = '';
  for (let i = 0; i < 3 && parent; i++) {
    surroundingText += parent.textContent ? parent.textContent.toLowerCase() : '';
    parent = parent.parentElement;
  }
  
  // تجميع كل النصوص المتاحة للبحث
  const searchText = `${name} ${id} ${className} ${placeholderText} ${labelText} ${surroundingLabelText} ${surroundingText}`.toLowerCase();
  
  // طباعة معلومات الحقل للتشخيص
  const fieldIdentifier = id || ('name' in field ? field.name : '') || 'غير معروف';
  console.log(`[Bookmarklet] تحليل الحقل: ${fieldIdentifier}`);
  console.log(`[Bookmarklet] معلومات الحقل - الاسم: ${name}, المعرف: ${id}, التسمية: ${labelText || surroundingLabelText}`);
  
  // التخمين المحسن للحقول المطابقة للموقع المستهدف
  // الأولوية للمطابقة مع حقول الموقع المستهدف كما في الصورة
  const targetSiteFields = {
    'كود العميل': 'customerCode',
    'رقم العميل': 'customerCode',
    'رقم الوصل': 'orderNumber',
    'هاتف الزبون': 'customerPhone',
    'رقم الزبون': 'customerPhone',
    'رقم هاتف': 'customerPhone',
    'رقم الهاتف': 'customerPhone',
    'المحافظة': 'province',
    'محافظة': 'province',
    'المدينة': 'province',
    'اسم العميل': 'customerName',
    'اسم الزبون': 'customerName',
    'الزبون': 'customerName',
    'العميل': 'customerName',
    'اسم المستلم': 'receiverName',
    'المستلم': 'receiverName',
    'المبلغ الكلي': 'totalAmount',
    'المبلغ': 'totalAmount',
    'السعر': 'totalAmount',
    'المنطقة': 'area',
    'منطقة': 'area',
    'نوع البضاعة': 'packageType',
    'البضاعة': 'packageType',
    'عدد القطع': 'pieceCount',
    'عدد': 'pieceCount',
    'قطع': 'pieceCount',
    'زيادة أجرة العميل': 'customerFee',
    'أجرة العميل': 'customerFee',
    'زيادة أجرة المندوب': 'deliveryAgentFee',
    'أجرة المندوب': 'deliveryAgentFee',
    'ملاحظات': 'notes1',
    'ملاحظة': 'notes1',
    'ملاحظات خاصة': 'notes2',
    'ملاحظة خاصة': 'notes2',
    'الحالة': 'status1',
    'حالة': 'status1',
    'استبدال': 'exchangeStatus',
    'تبديل': 'exchangeStatus',
    'حالة الدفع': 'paymentStatus',
    'الدفع': 'paymentStatus',
    'تاريخ التسليم': 'deliveryDate',
    'التسليم': 'deliveryDate',
    'اسم المندوب': 'delegateName',
    'المندوب': 'delegateName'
  };
  
  // البحث في الحقول المستهدفة أولاً
  for (const [label, fieldType] of Object.entries(targetSiteFields)) {
    if (
      searchText.includes(label) || 
      (label.length > 3 && searchText.includes(label.substring(0, label.length - 1))) || // للتعامل مع الاختلافات البسيطة
      (surroundingLabelText && surroundingLabelText.includes(label))
    ) {
      console.log(`[Bookmarklet] تم تحديد نوع الحقل: ${fieldType} (مطابقة مباشرة مع: ${label})`);
      return fieldType;
    }
  }
  
  // إذا لم نجد مطابقة مباشرة، نستخدم الطريقة العامة
  const patterns = [
    { 
      type: 'code', 
      keywords: ['code', 'كود', 'رمز', 'رقم الوصل', 'رقم الشحنة', 'رقم الطلب', 'order', 'tracking', 'reference', 'ref', 'الوصل', 'الطلب', 'الشحنة']
    },
    { 
      type: 'customerName', 
      keywords: ['sender', 'name', 'customer', 'اسم', 'المرسل', 'الزبون', 'العميل', 'المستلم', 'الاسم', 'اسم المستلم', 'اسم العميل']
    },
    { 
      type: 'customerPhone', 
      keywords: ['phone', 'mobile', 'هاتف', 'موبايل', 'جوال', 'رقم الهاتف', 'تليفون', 'رقم الجوال', 'tel', 'telephone', 'contact']
    },
    { 
      type: 'province', 
      keywords: ['province', 'state', 'city', 'region', 'محافظة', 'المحافظة', 'مدينة', 'منطقة', 'المدينة', 'المنطقة', 'الولاية', 'البلدة']
    },
    { 
      type: 'totalAmount', 
      keywords: ['price', 'amount', 'cost', 'سعر', 'المبلغ', 'التكلفة', 'قيمة', 'دينار', 'المال', 'النقود', 'الثمن', 'الكلفة', 'المبلغ الكلي']
    },
    { 
      type: 'companyName', 
      keywords: ['company', 'business', 'vendor', 'شركة', 'الشركة', 'المتجر', 'البائع', 'اسم الشركة', 'الجهة', 'مؤسسة']
    },
    {
      type: 'area',
      keywords: ['area', 'region', 'منطقة', 'المنطقة', 'الحي', 'القطاع', 'الناحية', 'المكان', 'المدينة']
    },
    {
      type: 'packageType',
      keywords: ['package type', 'نوع البضاعة', 'نوع', 'البضاعة', 'المنتج', 'بضاعة', 'سلعة', 'نوع المنتج', 'طبيعة الشحنة']
    },
    {
      type: 'pieceCount',
      keywords: ['piece count', 'عدد القطع', 'عدد', 'قطع', 'كمية', 'العدد', 'عدد الطرود', 'الكمية']
    },
    {
      type: 'notes1',
      keywords: ['notes', 'comment', 'ملاحظات', 'ملاحظة', 'تعليق', 'شرح', 'توضيح']
    },
    {
      type: 'receiverName',
      keywords: ['recipient name', 'اسم المستلم', 'المستلم', 'receiver', 'receiver name', 'من يستلم']
    },
    {
      type: 'delegateName',
      keywords: ['delegate name', 'اسم المندوب', 'المندوب', 'driver', 'السائق', 'الموصل']
    },
    {
      type: 'status1',
      keywords: ['status', 'الحالة', 'state', 'وضع', 'status1', 'حالة الطلب', 'حالة الشحنة']
    },
    {
      type: 'exchangeStatus',
      keywords: ['exchange', 'استبدال', 'تبديل', 'swap', 'بدل', 'مقابل']
    },
    {
      type: 'customerFee',
      keywords: ['customer fee', 'زيادة أجرة العميل', 'أجرة العميل', 'رسوم العميل', 'أجرة إضافية']
    },
    {
      type: 'deliveryAgentFee',
      keywords: ['delivery agent fee', 'زيادة أجرة المندوب', 'أجرة المندوب', 'أجرة السائق', 'رسوم التوصيل']
    },
    {
      type: 'paymentStatus',
      keywords: ['payment status', 'حالة الدفع', 'payment', 'دفع', 'طريقة الدفع', 'الدفع']
    },
    {
      type: 'deliveryDate',
      keywords: ['delivery date', 'تاريخ التسليم', 'موعد التسليم', 'تاريخ', 'delivery', 'تسليم']
    }
  ];
  
  // البحث عن أفضل تطابق - مع تحسين آلية المطابقة
  const matches = patterns.map(pattern => {
    const matchCount = pattern.keywords.filter(keyword => searchText.includes(keyword)).length;
    return { type: pattern.type, matches: matchCount };
  });
  
  // ترتيب المطابقات حسب العدد الأكبر
  matches.sort((a, b) => b.matches - a.matches);
  
  // إذا وجدنا تطابقًا على الأقل
  if (matches[0].matches > 0) {
    console.log(`[Bookmarklet] تم تحديد نوع الحقل: ${matches[0].type} (${matches[0].matches} تطابق)`);
    return matches[0].type;
  }
  
  // تخمين بناءً على خصائص الحقل
  if ('type' in field) {
    const inputType = field.type?.toLowerCase();
    if (inputType === 'tel' || (name && name.includes('phone')) || (name && name.includes('mobile'))) {
      return 'customerPhone';
    } else if (inputType === 'number' && (name && (name.includes('price') || name.includes('amount')))) {
      return 'totalAmount';
    } else if (inputType === 'number' && (name && (name.includes('count') || name.includes('quantity')))) {
      return 'pieceCount';
    } else if (inputType === 'date' && (name && (name.includes('delivery') || name.includes('date')))) {
      return 'deliveryDate';
    }
  }
  
  console.log(`[Bookmarklet] لم يتم التعرف على نوع الحقل: ${fieldIdentifier}`);
  return 'unknown';
};

/**
 * وظيفة تحسين المطابقة للقوائم المنسدلة
 */
export const findBestSelectOption = (select: HTMLSelectElement, desiredValue: string): HTMLOptionElement | null => {
  if (!desiredValue || desiredValue.trim() === '') {
    return null;
  }
  
  const options = Array.from(select.options);
  const cleanValue = desiredValue.trim().toLowerCase();
  
  // 1. ابحث عن تطابق تام للنص
  const exactTextMatch = options.find(option => 
    option.text.trim().toLowerCase() === cleanValue
  );
  
  if (exactTextMatch) {
    console.log(`[Bookmarklet] تم العثور على تطابق تام للنص: ${exactTextMatch.text}`);
    return exactTextMatch;
  }
  
  // 2. ابحث عن تطابق تام للقيمة
  const exactValueMatch = options.find(option => 
    option.value.trim().toLowerCase() === cleanValue
  );
  
  if (exactValueMatch) {
    console.log(`[Bookmarklet] تم العثور على تطابق تام للقيمة: ${exactValueMatch.value}`);
    return exactValueMatch;
  }
  
  // 3. ابحث عن احتواء النص للقيمة المطلوبة
  const textContainsMatch = options.find(option => 
    option.text.trim().toLowerCase().includes(cleanValue)
  );
  
  if (textContainsMatch) {
    console.log(`[Bookmarklet] تم العثور على تطابق جزئي للنص: ${textContainsMatch.text}`);
    return textContainsMatch;
  }
  
  // 4. ابحث عن احتواء القيمة المطلوبة للنص
  const valueContainsMatch = options.find(option => 
    cleanValue.includes(option.text.trim().toLowerCase())
  );
  
  if (valueContainsMatch) {
    console.log(`[Bookmarklet] القيمة المطلوبة تحتوي على نص الخيار: ${valueContainsMatch.text}`);
    return valueContainsMatch;
  }
  
  // 5. ابحث عن تطابق لأول كلمة
  const firstWord = cleanValue.split(' ')[0];
  if (firstWord && firstWord.length > 2) {
    const firstWordMatch = options.find(option => 
      option.text.trim().toLowerCase().includes(firstWord)
    );
    
    if (firstWordMatch) {
      console.log(`[Bookmarklet] تم العثور على تطابق للكلمة الأولى: ${firstWordMatch.text}`);
      return firstWordMatch;
    }
  }
  
  // 6. ابحث عن حالات خاصة
  // للمحافظات العراقية
  if (select.name.includes('province') || select.id.includes('province') || cleanValue.includes('محافظة')) {
    const provinceMap: Record<string, string[]> = {
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
    
    for (const [province, aliases] of Object.entries(provinceMap)) {
      if (cleanValue === province.toLowerCase() || aliases.some(alias => cleanValue.includes(alias.toLowerCase()))) {
        const provinceMatch = options.find(option => 
          option.text.toLowerCase().includes(province.toLowerCase()) || 
          aliases.some(alias => option.text.toLowerCase().includes(alias.toLowerCase()))
        );
        
        if (provinceMatch) {
          console.log(`[Bookmarklet] تم العثور على تطابق للمحافظة: ${provinceMatch.text}`);
          return provinceMatch;
        }
      }
    }
  }
  
  // للحالات
  if (select.name.includes('status') || select.id.includes('status') || cleanValue.includes('حالة')) {
    const statusMap: Record<string, string[]> = {
      'قيد التنفيذ': ['pending', 'in process', 'processing', 'جاري', 'قيد', 'تنفيذ'],
      'تم التسليم': ['delivered', 'completed', 'done', 'تسليم', 'مكتمل', 'منجز'],
      'ملغي': ['cancelled', 'canceled', 'الغاء', 'إلغاء', 'ملغية'],
      'مؤجل': ['delayed', 'postponed', 'تأجيل', 'مؤجلة'],
      'معلق': ['on hold', 'held', 'تعليق', 'معلقة']
    };
    
    for (const [status, aliases] of Object.entries(statusMap)) {
      if (cleanValue === status.toLowerCase() || aliases.some(alias => cleanValue.includes(alias.toLowerCase()))) {
        const statusMatch = options.find(option => 
          option.text.toLowerCase().includes(status.toLowerCase()) || 
          aliases.some(alias => option.text.toLowerCase().includes(alias.toLowerCase()))
        );
        
        if (statusMatch) {
          console.log(`[Bookmarklet] تم العثور على تطابق للحالة: ${statusMatch.text}`);
          return statusMatch;
        }
      }
    }
  }
  
  // للاستبدال
  if (select.name.includes('exchange') || select.id.includes('exchange') || cleanValue.includes('استبدال')) {
    const yesNoMap: Record<string, string[]> = {
      'نعم': ['yes', 'true', '1', 'مطلوب', 'موافق'],
      'لا': ['no', 'false', '0', 'غير مطلوب', 'غير موافق', 'رفض']
    };
    
    for (const [value, aliases] of Object.entries(yesNoMap)) {
      if (cleanValue === value.toLowerCase() || aliases.some(alias => cleanValue.toLowerCase() === alias.toLowerCase())) {
        const match = options.find(option => 
          option.text.toLowerCase().includes(value.toLowerCase()) || 
          aliases.some(alias => option.text.toLowerCase().includes(alias.toLowerCase()))
        );
        
        if (match) {
          console.log(`[Bookmarklet] تم العثور على تطابق للاستبدال: ${match.text}`);
          return match;
        }
      }
    }
    
    // الافتراضي هو "لا" للاستبدال
    const noOption = options.find(option => 
      option.text.toLowerCase().includes('لا') || 
      option.text.toLowerCase().includes('no') ||
      option.text.toLowerCase() === 'لا' ||
      option.text.toLowerCase() === 'no'
    );
    
    if (noOption) {
      console.log(`[Bookmarklet] استخدام الخيار الافتراضي للاستبدال: ${noOption.text}`);
      return noOption;
    }
  }
  
  // القيمة الافتراضية: استخدم الخيار الأول غير الفارغ
  const firstNonEmptyOption = options.find(opt => opt.value.trim() !== '' && opt.text.trim() !== '');
  if (firstNonEmptyOption) {
    console.log(`[Bookmarklet] استخدام أول خيار غير فارغ: ${firstNonEmptyOption.text}`);
    return firstNonEmptyOption;
  }
  
  // لم يتم العثور على تطابق مناسب
  return null;
};

/**
 * وظيفة ملء الحقل بالقيمة المناسبة وإطلاق أحداث التغيير
 */
export const fillField = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement, value: string): boolean => {
  // إذا كانت القيمة فارغة، لا تملأ الحقل
  if (!value || value.trim() === '') {
    // هنا نحتاج إلى التحقق من الخاصية الصحيحة للعنصر
    let fieldIdentifier = 'غير معروف';
    
    if ('id' in field && field.id) {
      fieldIdentifier = field.id;
    } else if ('name' in field && field.name) {
      fieldIdentifier = field.name;
    }
    
    console.log(`[Bookmarklet] تخطي ملء الحقل لأن القيمة فارغة: ${fieldIdentifier}`);
    return false;
  }
  
  try {
    // محاولة تعديل الحقل بشكل مباشر
    // تحسين العملية: محاولة طرق متعددة لملء الحقل
    
    // تعامل خاص مع القوائم المنسدلة
    if (field instanceof HTMLSelectElement) {
      const select = field as HTMLSelectElement;
      const bestOption = findBestSelectOption(select, value);
      
      if (bestOption) {
        // تحديث القيمة للقائمة المنسدلة
        select.value = bestOption.value;
        console.log(`[Bookmarklet] تم ملء القائمة المنسدلة بالقيمة: ${bestOption.text} (القيمة: ${bestOption.value})`);
        
        // إطلاق حدث التغيير
        try {
          ['input', 'change', 'blur'].forEach(eventType => {
            const event = new Event(eventType, { bubbles: true });
            select.dispatchEvent(event);
          });
        } catch (e) {
          console.warn("[Bookmarklet] خطأ في إطلاق أحداث التغيير:", e);
        }
        
        return true;
      } else {
        console.log(`[Bookmarklet] لم يتم العثور على تطابق في القائمة المنسدلة للقيمة: ${value}`);
        return false;
      }
    } 
    // تعامل مع حقول النصوص والمدخلات
    else if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      let processedValue = value;
      
      // تعديل القيمة حسب نوع الإدخال
      if (field instanceof HTMLInputElement) {
        const inputElement = field as HTMLInputElement;
        
        switch (inputElement.type.toLowerCase()) {
          case 'tel':
            // تنظيف رقم الهاتف من الأحرف غير الرقمية
            processedValue = value.replace(/\D/g, '');
            break;
          case 'number':
            // تنظيف القيمة العددية
            processedValue = value.replace(/[^\d.]/g, '');
            break;
          case 'date':
            // تحويل التاريخ إلى التنسيق المناسب
            try {
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                // تنسيق YYYY-MM-DD
                const formattedDate = dateValue.toISOString().split('T')[0];
                processedValue = formattedDate;
              }
            } catch (e) {
              // الإبقاء على القيمة الأصلية في حالة الخطأ
            }
            break;
          case 'checkbox':
          case 'radio':
            // تعيين حالة الاختيار بناءً على القيمة
            const shouldCheck = value === 'true' || value === '1' || value.toLowerCase() === 'نعم';
            field.checked = shouldCheck;
            console.log(`[Bookmarklet] تم تعيين خانة الاختيار: ${shouldCheck ? 'محدد' : 'غير محدد'}`);
            
            // إطلاق أحداث التغيير والنقر
            try {
              ['input', 'change', 'click'].forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                field.dispatchEvent(event);
              });
            } catch (e) {
              console.warn("[Bookmarklet] خطأ في إطلاق أحداث خانة الاختيار:", e);
            }
            
            return true;
        }
      }
      
      // طريقة 1: تعيين القيمة مباشرة
      field.value = processedValue;
      
      let fieldIdentifier = 'غير معروف';
      if ('name' in field && field.name) {
        fieldIdentifier = field.name;
      } else if ('id' in field && field.id) {
        fieldIdentifier = field.id;
      }
      
      console.log(`[Bookmarklet] تم ملء الحقل: ${fieldIdentifier} بالقيمة: ${processedValue}`);
      
      // طريقة 2: محاكاة الكتابة
      try {
        // إطلاق أحداث متعددة
        ['focus', 'input', 'change', 'blur'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          field.dispatchEvent(event);
        });
      } catch (e) {
        console.warn("[Bookmarklet] خطأ في إطلاق أحداث التغيير:", e);
      }
      
      // طريقة 3: استخدام خاصية defaultValue للتغلب على بعض المشاكل
      if ('defaultValue' in field) {
        field.defaultValue = processedValue;
      }
      
      return true;
    } 
    // تعامل مع العناصر ذات المحتوى القابل للتحرير
    else if ('contentEditable' in field && field.contentEditable === 'true') {
      // ملء العناصر ذات المحتوى القابل للتحرير
      field.textContent = value;
      console.log(`[Bookmarklet] تم ملء عنصر المحتوى القابل للتحرير بالقيمة: ${value}`);
      
      try {
        const event = new Event('input', { bubbles: true });
        field.dispatchEvent(event);
      } catch (e) {
        console.warn("[Bookmarklet] خطأ في إطلاق حدث التغيير:", e);
      }
      
      return true;
    } else {
      console.log(`[Bookmarklet] نوع حقل غير معروف: ${field.tagName}`);
      
      // محاولة أخيرة: استخدام خصائص DOM العامة للعناصر
      try {
        const htmlElement = field as HTMLElement;
        // محاولة تعيين القيمة من خلال setAttribute
        htmlElement.setAttribute('value', value);
        console.log(`[Bookmarklet] تم محاولة تعيين القيمة باستخدام setAttribute: ${value}`);
        return true;
      } catch (e) {
        console.warn("[Bookmarklet] فشلت محاولة تعيين القيمة باستخدام setAttribute:", e);
        return false;
      }
    }
  } catch (e) {
    console.error("[Bookmarklet] خطأ عام أثناء محاولة ملء الحقل:", e);
    return false;
  }
};

/**
 * وظيفة البحث عن زر الحفظ والنقر عليه
 */
export const findAndClickSaveButton = (): boolean => {
  console.log("[Bookmarklet] البحث عن زر الحفظ...");
  
  // محاولات متعددة للعثور على زر الحفظ
  const saveButtonSelectors = [
    // البحث عن النص المباشر
    'button:contains("حفظ")', 
    'button:contains("احفظ")',
    'button:contains("تأكيد")',
    'button:contains("إضافة")',
    'input[type="submit"][value*="حفظ"]',
    'input[type="button"][value*="حفظ"]',
    // البحث باستخدام السمات
    'button[type="submit"]',
    '.save-button', 
    '.btn-save',
    '.submit-btn',
    '.btn-primary',
    // محددات أخرى
    'form button:last-child',
    'form input[type="submit"]:last-child',
    'button.btn-success'
  ];
  
  // تحسين البحث عن النص داخل الأزرار
  const containsTextPredicate = (buttonElement: Element, searchText: string) => {
    return buttonElement.textContent?.trim().toLowerCase().includes(searchText.toLowerCase());
  };
  
  // محاولة العثور على زر باستخدام المحددات المعرفة
  for (const selector of saveButtonSelectors) {
    if (selector.includes(':contains("')) {
      // استخراج النص المطلوب البحث عنه
      const match = selector.match(/:contains\("([^"]+)"\)/);
      if (match && match[1]) {
        const searchText = match[1];
        const baseSelector = selector.replace(/:contains\("([^"]+)"\)/, '');
        
        // البحث عن جميع الأزرار وتصفيتها بناءً على النص
        const buttons = Array.from(document.querySelectorAll(baseSelector) as NodeListOf<Element>)
          .filter(btn => containsTextPredicate(btn, searchText));
        
        if (buttons.length > 0) {
          console.log(`[Bookmarklet] وجدت ${buttons.length} زر مع النص "${searchText}"`);
          try {
            // تصحيح الخطأ: تحويل العنصر إلى HTMLElement قبل استخدام click()
            (buttons[0] as HTMLElement).click();
            console.log("[Bookmarklet] تم النقر على زر الحفظ!");
            return true;
          } catch (e) {
            console.warn("[Bookmarklet] خطأ أثناء النقر على الزر:", e);
          }
        }
      }
    } else {
      // استخدام المحدد مباشرة
      const buttons = document.querySelectorAll(selector);
      if (buttons.length > 0) {
        console.log(`[Bookmarklet] وجدت ${buttons.length} زر باستخدام المحدد "${selector}"`);
        try {
          (buttons[0] as HTMLElement).click();
          console.log("[Bookmarklet] تم النقر على زر الحفظ!");
          return true;
        } catch (e) {
          console.warn("[Bookmarklet] خطأ أثناء النقر على الزر:", e);
        }
      }
    }
  }
  
  // البحث اليدوي عن أزرار قد تكون أزرار حفظ
  const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
  let potentialSaveButtons = [];
  
  for (const button of Array.from(allButtons)) {
    const buttonText = button.textContent?.trim().toLowerCase() || '';
    const buttonValue = (button as HTMLInputElement).value?.toLowerCase() || '';
    
    // تحقق من النص أو القيمة
    if (
      buttonText.includes('حفظ') || buttonText.includes('احفظ') || 
      buttonText.includes('تأكيد') || buttonText.includes('إرسال') || 
      buttonText.includes('تخزين') || buttonText.includes('إضافة') ||
      buttonValue.includes('حفظ') || buttonValue.includes('تأكيد') ||
      buttonText === 'حفظ' || buttonText === 'إضافة' ||
      button.classList.contains('save') || button.classList.contains('submit') ||
      button.classList.contains('btn-primary') || button.classList.contains('btn-success')
    ) {
      potentialSaveButtons.push(button);
    }
  }
  
  // ترتيب الأزرار المحتملة حسب أولوية النص
  potentialSaveButtons.sort((a, b) => {
    const aText = a.textContent?.trim().toLowerCase() || '';
    const bText = b.textContent?.trim().toLowerCase() || '';
    
    if (aText === 'حفظ' && bText !== 'حفظ') return -1;
    if (bText === 'حفظ' && aText !== 'حفظ') return 1;
    if (aText === 'إضافة' && bText !== 'إضافة') return -1;
    if (bText === 'إضافة' && aText !== 'إضافة') return 1;
    
    return 0;
  });
  
  // محاولة النقر على الزر الأول من القائمة المرتبة
  if (potentialSaveButtons.length > 0) {
    try {
      const button = potentialSaveButtons[0] as HTMLElement;
      const buttonValue = (button instanceof HTMLInputElement) ? button.value : '';
      console.log(`[Bookmarklet] محاولة النقر على الزر المحتمل: ${button.textContent || buttonValue}`);
      button.click();
      return true;
    } catch (e) {
      console.warn("[Bookmarklet] خطأ أثناء النقر على الزر المحتمل:", e);
    }
  }
  
  console.log("[Bookmarklet] لم يتم العثور على زر حفظ مناسب");
  return false;
};
