
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
    'هاتف الزبون': 'phoneNumber',
    'المحافظة': 'province',
    'اسم العميل': 'customerName',
    'اسم المستلم': 'recipientName',
    'المبلغ الكلي': 'totalAmount',
    'اسم الزبون': 'customerName',
    'المنطقة': 'area',
    'نوع البضاعة': 'packageType',
    'عدد القطع': 'pieceCount',
    'زيادة أجرة العميل': 'customerFee',
    'زيادة أجرة المندوب': 'deliveryAgentFee',
    'ملاحظات': 'notes1',
    'ملاحظات خاصة': 'notes2',
    'الحالة': 'status1',
    'استبدال': 'exchangeStatus',
    'اسم المندوب': 'delegateName'
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
      type: 'senderName', 
      keywords: ['sender', 'name', 'customer', 'اسم', 'المرسل', 'الزبون', 'العميل', 'المستلم', 'الاسم', 'اسم المستلم', 'اسم العميل']
    },
    { 
      type: 'phoneNumber', 
      keywords: ['phone', 'mobile', 'هاتف', 'موبايل', 'جوال', 'رقم الهاتف', 'تليفون', 'رقم الجوال', 'tel', 'telephone', 'contact']
    },
    { 
      type: 'province', 
      keywords: ['province', 'state', 'city', 'region', 'محافظة', 'المحافظة', 'مدينة', 'منطقة', 'المدينة', 'المنطقة', 'الولاية', 'البلدة']
    },
    { 
      type: 'price', 
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
      type: 'notes',
      keywords: ['notes', 'comment', 'ملاحظات', 'ملاحظة', 'تعليق', 'شرح', 'توضيح']
    },
    {
      type: 'customerName',
      keywords: ['customer name', 'اسم الزبون', 'اسم العميل', 'الزبون', 'المستلم']
    },
    {
      type: 'recipientName',
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
      return 'phoneNumber';
    } else if (inputType === 'number' && (name && (name.includes('price') || name.includes('amount')))) {
      return 'price';
    } else if (inputType === 'number' && (name && (name.includes('count') || name.includes('quantity')))) {
      return 'pieceCount';
    }
  }
  
  console.log(`[Bookmarklet] لم يتم التعرف على نوع الحقل: ${fieldIdentifier}`);
  return 'unknown';
};

/**
 * وظيفة ملء الحقل بالقيمة المناسبة وإطلاق أحداث التغيير
 */
export const fillField = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement, value: string) => {
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
  
  // التعامل مع القوائم المنسدلة
  if (field instanceof HTMLSelectElement) {
    const select = field;
    
    // محاولة العثور على الخيار المطابق
    const options = Array.from(select.options);
    
    // تنظيف القيمة للمقارنة
    const cleanValue = value.trim().toLowerCase();
    
    // البحث عن تطابق دقيق أولاً
    const exactMatch = options.find(option => 
      option.text.trim().toLowerCase() === cleanValue || 
      option.value.trim().toLowerCase() === cleanValue
    );
    
    if (exactMatch) {
      select.value = exactMatch.value;
      console.log(`[Bookmarklet] تم ملء القائمة المنسدلة بالقيمة: ${exactMatch.text} (تطابق تام)`);
    } else {
      // البحث عن تطابق جزئي
      const partialMatches = options
        .map(option => ({
          option,
          similarity: Math.max(
            // قياس تشابه النص
            option.text.trim().toLowerCase().includes(cleanValue) ? 0.7 : 0,
            cleanValue.includes(option.text.trim().toLowerCase()) ? 0.6 : 0,
            // قياس تشابه القيمة
            option.value.trim().toLowerCase().includes(cleanValue) ? 0.5 : 0,
            cleanValue.includes(option.value.trim().toLowerCase()) ? 0.4 : 0
          )
        }))
        .filter(match => match.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity);
      
      if (partialMatches.length > 0) {
        const bestMatch = partialMatches[0].option;
        select.value = bestMatch.value;
        console.log(`[Bookmarklet] تم ملء القائمة المنسدلة بالقيمة: ${bestMatch.text} (تطابق جزئي)`);
      } else {
        // إذا لم نجد تطابقًا، اختر الخيار الأول إذا كان موجودًا
        if (options.length > 0) {
          select.value = options[0].value;
          console.log(`[Bookmarklet] تم ملء القائمة المنسدلة بالقيمة الافتراضية: ${options[0].text}`);
        } else {
          console.log(`[Bookmarklet] لم يتم العثور على تطابق في القائمة المنسدلة للقيمة: ${value}`);
          return false;
        }
      }
    }
    
    // إطلاق حدث التغيير
    try {
      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);
    } catch (e) {
      console.warn("خطأ في إطلاق حدث التغيير:", e);
    }
    
    return true;
  } else if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    // تعديل القيمة حسب نوع الإدخال
    if (field instanceof HTMLInputElement && field.type) {
      const inputElement = field;
      
      switch (inputElement.type.toLowerCase()) {
        case 'tel':
          // تنظيف رقم الهاتف من الأحرف غير الرقمية
          field.value = value.replace(/\D/g, '');
          break;
        case 'number':
          // تنظيف القيمة العددية
          field.value = value.replace(/[^\d.]/g, '');
          break;
        case 'checkbox':
        case 'radio':
          // تعيين حالة الاختيار بناءً على القيمة
          const shouldCheck = value === 'true' || value === '1' || value.toLowerCase() === 'نعم';
          field.checked = shouldCheck;
          break;
        default:
          field.value = value;
      }
    } else {
      field.value = value;
    }
    
    // استخدام معرف مناسب لتسجيل الإجراء
    let fieldIdentifier = 'غير معروف';
    
    if ('name' in field && field.name) {
      fieldIdentifier = field.name;
    } else if ('id' in field && field.id) {
      fieldIdentifier = field.id;
    }
    
    console.log(`[Bookmarklet] تم ملء الحقل: ${fieldIdentifier} بالقيمة: ${field.value}`);
    
    // إطلاق أحداث التغيير والإدخال
    try {
      ['input', 'change', 'blur'].forEach(eventType => {
        const event = new Event(eventType, { bubbles: true });
        field.dispatchEvent(event);
      });
    } catch (e) {
      console.warn("خطأ في إطلاق أحداث التغيير:", e);
    }
  } else if ('contentEditable' in field && field.contentEditable === 'true') {
    // ملء العناصر ذات المحتوى القابل للتحرير
    field.textContent = value;
    console.log(`[Bookmarklet] تم ملء عنصر المحتوى القابل للتحرير بالقيمة: ${value}`);
    
    try {
      const event = new Event('input', { bubbles: true });
      field.dispatchEvent(event);
    } catch (e) {
      console.warn("خطأ في إطلاق حدث التغيير:", e);
    }
  } else {
    console.log(`[Bookmarklet] نوع حقل غير معروف: ${field.tagName}`);
    return false;
  }
  
  // محاولة تنشيط الحقول للمواقع التي تعتمد على أحداث التركيز والنقر
  try {
    field.focus();
    field.click();
  } catch (e) {
    console.warn("تعذر تنشيط الحقل بالكامل:", e);
  }
  
  return true;
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
    'input[type="submit"][value*="حفظ"]',
    'input[type="button"][value*="حفظ"]',
    // البحث باستخدام السمات
    'button[type="submit"]',
    '.save-button', 
    '.btn-save',
    '.submit-btn',
    // محددات أخرى
    'button.btn-primary',
    'form button:last-child',
    'form input[type="submit"]:last-child'
  ];
  
  // البحث اليدوي عن أزرار قد تكون أزرار حفظ
  const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
  let potentialSaveButtons = [];
  
  for (const button of Array.from(allButtons)) {
    const buttonText = button.textContent?.trim().toLowerCase() || '';
    const buttonValue = button.getAttribute('value')?.toLowerCase() || '';
    
    // تحقق من النص أو القيمة
    if (
      buttonText.includes('حفظ') || buttonText.includes('احفظ') || 
      buttonText.includes('تأكيد') || buttonText.includes('إرسال') || 
      buttonText.includes('تخزين') || buttonText.includes('إضافة') ||
      buttonValue.includes('حفظ') || buttonValue.includes('تأكيد') ||
      buttonText === 'حفظ'
    ) {
      potentialSaveButtons.push(button);
    }
  }
  
  // البحث عن زر في أسفل النموذج
  if (potentialSaveButtons.length === 0) {
    const forms = document.querySelectorAll('form');
    for (const form of Array.from(forms)) {
      const formButtons = form.querySelectorAll('button, input[type="submit"], input[type="button"]');
      if (formButtons.length > 0) {
        // افترض أن آخر زر في النموذج هو زر الحفظ
        potentialSaveButtons.push(formButtons[formButtons.length - 1]);
      }
    }
  }
  
  // البحث عن أي زر في أسفل الصفحة
  if (potentialSaveButtons.length === 0) {
    const bottomButtons = Array.from(allButtons).filter(button => {
      const rect = button.getBoundingClientRect();
      return rect.top > window.innerHeight * 0.6; // في النصف السفلي من الصفحة
    });
    
    if (bottomButtons.length > 0) {
      // رتب الأزرار حسب موضعها من الأسفل إلى الأعلى
      bottomButtons.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectB.top - rectA.top;
      });
      
      potentialSaveButtons = potentialSaveButtons.concat(bottomButtons);
    }
  }
  
  // استخدم أول زر محتمل وجدته
  if (potentialSaveButtons.length > 0) {
    try {
      console.log("[Bookmarklet] جاري النقر على زر الحفظ...");
      potentialSaveButtons[0].click();
      console.log("[Bookmarklet] تم النقر على زر الحفظ بنجاح!");
      return true;
    } catch (error) {
      console.error("[Bookmarklet] خطأ أثناء النقر على زر الحفظ:", error);
      return false;
    }
  }
  
  console.warn("[Bookmarklet] لم يتم العثور على زر الحفظ");
  return false;
};

/**
 * وظيفة ملء النموذج بالبيانات
 */
export const fillForm = (item: BookmarkletItem): number => {
  console.log("[Bookmarklet] بدء عملية ملء النموذج بالبيانات:", item);
  
  // التحقق من صحة البيانات
  if (!item || !item.id) {
    console.error("[Bookmarklet] خطأ: عنصر البيانات غير صالح");
    return 0;
  }
  
  // البحث عن حقول النموذج
  const fields = findFormFields();
  console.log(`[Bookmarklet] وجدت ${fields.length} حقل إدخال`);
  
  if (fields.length === 0) {
    console.error("[Bookmarklet] لم يتم العثور على أي حقول في الصفحة");
    updateItemStatus(item.id, 'error', 'لم يتم العثور على أي حقول في الصفحة');
    return 0;
  }
  
  // خريطة للحقول المستهدفة من الموقع المرسل
  const fieldMappings = {
    'customerCode': item.customerCode || item.code || '',
    'orderNumber': item.code || '',
    'phoneNumber': item.phoneNumber ? item.phoneNumber.replace(/\D/g, '') : '',
    'province': item.province || '',
    'customerName': item.customerName || item.senderName || '',
    'recipientName': item.recipientName || item.senderName || '',
    'totalAmount': item.totalAmount || item.price ? item.price.replace(/[^\d.]/g, '') : '',
    'area': item.area || item.region || item.province || '',
    'packageType': item.packageType || item.productType || item.category || 'بضائع متنوعة',
    'pieceCount': item.pieceCount || item.packageCount || '1',
    'customerFee': item.customerFee || '',
    'deliveryAgentFee': item.deliveryAgentFee || '',
    'notes1': item.notes1 || item.notes || '',
    'notes2': item.notes2 || '',
    'status1': item.status1 || 'قيد التنفيذ',
    'exchangeStatus': item.exchangeStatus || '',
    'delegateName': item.delegateName || '',
    'senderName': item.senderName || '',
    'price': item.price ? item.price.replace(/[^\d.]/g, '') : '',
    'companyName': item.companyName || '',
    'code': item.code || '',
    'address': item.address || item.province || ''
  };
  
  // تتبع الحقول التي تم ملؤها
  const filledFields: Record<string, boolean> = {};
  
  // محاولة تخمين وملء كل حقل
  fields.forEach(field => {
    // تحويل العنصر إلى النوع المناسب
    const inputElement = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement;
    const fieldType = guessFieldType(inputElement);
    
    if (fieldType !== 'unknown' && fieldMappings[fieldType]) {
      // استخدام القيمة من الخريطة
      const value = fieldMappings[fieldType];
      
      if (value && fillField(inputElement, value)) {
        filledFields[fieldType] = true;
        console.log(`[Bookmarklet] تم ملء حقل ${fieldType} بنجاح: ${value}`);
      }
    }
  });
  
  // إضافة تأخير قصير والبحث عن حقول جديدة قد تظهر
  setTimeout(() => {
    const newFields = findFormFields();
    if (newFields.length > fields.length) {
      console.log(`[Bookmarklet] تم اكتشاف ${newFields.length - fields.length} حقول إضافية بعد التأخير`);
      
      // تحديد الحقول الجديدة فقط
      const newFieldsArray = Array.from(newFields);
      const existingIds = new Set(Array.from(fields).map(f => {
        if ('id' in f && f.id) return f.id;
        if ('name' in f && f.name) return f.name;
        return Math.random().toString();
      }));
      
      const additionalFields = newFieldsArray.filter(f => {
        const fieldId = ('id' in f && f.id) ? f.id : ('name' in f && f.name) ? f.name : Math.random().toString();
        return !existingIds.has(fieldId);
      });
      
      // ملء الحقول الجديدة
      additionalFields.forEach(field => {
        const inputElement = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement;
        const fieldType = guessFieldType(inputElement);
        
        if (fieldType !== 'unknown' && fieldMappings[fieldType] && !filledFields[fieldType]) {
          // استخدام القيمة من الخريطة
          const value = fieldMappings[fieldType];
          
          if (value && fillField(inputElement, value)) {
            filledFields[fieldType] = true;
            console.log(`[Bookmarklet] تم ملء حقل جديد ${fieldType} بنجاح: ${value}`);
          }
        }
      });
    }
  }, 1000);
  
  // حساب العدد المبدئي للحقول التي تم ملؤها
  return Object.keys(filledFields).length;
};
