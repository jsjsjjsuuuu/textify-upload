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
  
  // فحص النص المحيط
  let surroundingText = '';
  let parent = field.parentElement;
  for (let i = 0; i < 3 && parent; i++) {
    surroundingText += parent.textContent ? parent.textContent.toLowerCase() : '';
    parent = parent.parentElement;
  }
  
  // فحص أي نص بجوار الحقل مباشرة
  const siblings = field.parentElement ? Array.from(field.parentElement.childNodes) : [];
  let siblingsText = '';
  for (const sibling of siblings) {
    if (sibling.nodeType === Node.TEXT_NODE) {
      siblingsText += sibling.textContent ? sibling.textContent.toLowerCase() : '';
    } else if (sibling.nodeType === Node.ELEMENT_NODE && sibling !== field) {
      siblingsText += sibling.textContent ? sibling.textContent.toLowerCase() : '';
    }
  }
  
  // تجميع كل النصوص المتاحة للبحث
  const searchText = `${name} ${id} ${className} ${placeholderText} ${labelText} ${surroundingText} ${siblingsText}`;
  
  // هنا، نحتاج إلى التحقق من الخاصية الصحيحة للعنصر الذي نحاول تسجيله
  // نستخدم إما معرف (ID) أو الاسم (name) إذا كان متاحًا، وإلا نستخدم "غير معروف"
  const fieldIdentifier = id || ('name' in field ? field.name : '') || 'غير معروف';
  console.log(`[Bookmarklet] تحليل الحقل: ${fieldIdentifier}, النص: ${searchText.substring(0, 100)}...`);
  
  // مصفوفة من الكلمات المفتاحية والأنماط - مع تحسين الكلمات المفتاحية للموقع المحدد
  const patterns = [
    { 
      type: 'code', 
      keywords: ['code', 'كود', 'رمز', 'رقم الوصل', 'رقم الشحنة', 'رقم الطلب', 'order', 'tracking', 'reference', 'ref', 'الوصل', 'الطلب', 'الشحنة', 'المرجع', 'تتبع', 'الرمز', 'تعقب', 'كود العميل', 'track', 'tracking number', 'shipment number', 'waybill', 'رقم التتبع', 'رقم المرجع', 'رقم الإشارة']
    },
    { 
      type: 'senderName', 
      keywords: ['sender', 'name', 'customer', 'اسم', 'المرسل', 'الزبون', 'العميل', 'المستلم', 'الاسم', 'اسم المستلم', 'اسم العميل', 'recipient', 'customer name', 'full name', 'الاسم الكامل', 'الشخص', 'المستفيد', 'consignee', 'اسم الزبون', 'حدد العميل', 'اسم المستفيد', 'client name']
    },
    { 
      type: 'phoneNumber', 
      keywords: ['phone', 'mobile', 'هاتف', 'موبايل', 'جوال', 'رقم الهاتف', 'تليفون', 'رقم الجوال', 'tel', 'telephone', 'contact', 'cell', 'رقم الاتصال', 'رقم التواصل', 'اتصال', 'رقم المحمول', 'هاتف الزبون', 'الرقم', 'الموبايل', 'للتواصل']
    },
    { 
      type: 'province', 
      keywords: ['province', 'state', 'city', 'region', 'محافظة', 'المحافظة', 'مدينة', 'منطقة', 'المدينة', 'المنطقة', 'الولاية', 'البلدة', 'البلد', 'country', 'المكان', 'الموقع', 'location', 'منطقة التسليم', 'area', 'delivery area', 'destination', 'مكان التسليم']
    },
    { 
      type: 'price', 
      keywords: ['price', 'amount', 'cost', 'سعر', 'المبلغ', 'التكلفة', 'قيمة', 'دينار', 'المال', 'النقود', 'الثمن', 'الكلفة', 'القيمة', 'value', 'money', 'currency', 'العملة', 'cod', 'cash on delivery', 'الدفع عند الاستلام', 'مبلغ التحصيل', 'مبلغ', 'المبلغ الكلي', 'قيمة البضاعة']
    },
    { 
      type: 'companyName', 
      keywords: ['company', 'business', 'vendor', 'شركة', 'الشركة', 'المتجر', 'البائع', 'اسم الشركة', 'الجهة', 'مؤسسة', 'corporation', 'store', 'shop', 'merchant', 'التاجر', 'المحل', 'نشاط تجاري', 'business name', 'مزود الخدمة', 'service provider', 'اسم المندوب']
    },
    {
      type: 'address',
      keywords: ['address', 'location', 'street', 'عنوان', 'الموقع', 'الشارع', 'التفاصيل', 'details', 'delivery address', 'shipping address', 'عنوان التسليم', 'عنوان الشحن', 'العنوان', 'مكان التسليم', 'تفاصيل العنوان', 'delivery location', 'المنطقة', 'التفاصيل', 'العنوان بالتفصيل']
    },
    {
      type: 'notes',
      keywords: ['notes', 'comments', 'ملاحظات', 'تعليقات', 'توضيح', 'explanation', 'additional', 'extra', 'إضافي', 'delivery notes', 'ملاحظات التسليم', 'ملاحظة', 'شرح', 'تفاصيل إضافية', 'additional details', 'ملاحظات خاصة', 'المحلظات', 'تعليمات خاصة']
    },
    {
      type: 'productType',
      keywords: ['product', 'item', 'منتج', 'صنف', 'نوع البضاعة', 'نوع المنتج', 'نوع', 'البضاعة', 'المنتج', 'بضاعة', 'سلعة', 'commodity', 'goods', 'merchandise', 'product type', 'item type', 'محتويات', 'وصف المنتج', 'طبيعة الشحنة']
    },
    {
      type: 'orderNumber',
      keywords: ['order number', 'invoice number', 'receipt number', 'رقم الطلب', 'رقم الفاتورة', 'رقم الإيصال', 'رقم الوصل', 'الوصل', 'رقم العملية', 'رقم التتبع', 'tracking number', 'waybill', 'رقم البوليصة', 'رقم الشحنة', 'رقم الشحن']
    },
    {
      type: 'customerCode',
      keywords: ['customer code', 'client id', 'كود العميل', 'رمز العميل', 'رقم العميل', 'الكود', 'customer id', 'client code', 'user id', 'معرف العميل', 'رقم الزبون']
    },
    {
      type: 'recipientName',
      keywords: ['recipient name', 'اسم المستلم', 'المستلم', 'receiver', 'receiver name', 'consignee name', 'من يستلم', 'الشخص المستلم', 'اسم المستفيد']
    },
    {
      type: 'delegateName',
      keywords: ['delegate', 'اسم المندوب', 'المندوب', 'delivery agent', 'agent name', 'courier', 'driver', 'delivery person', 'السائق', 'الموصل', 'الشخص المسؤول']
    },
    {
      type: 'packageCount',
      keywords: ['package count', 'عدد القطع', 'قطع', 'عدد الطرود', 'pieces', 'quantity', 'count', 'number of items', 'عدد', 'كمية', 'الكمية', 'عدد المنتجات', 'عدد القطع']
    },
    {
      type: 'reference',
      keywords: ['reference', 'المرجع', 'ref', 'رقم المرجع', 'reference number', 'reference id', 'الرقم المرجعي', 'المرجع']
    },
    {
      type: 'shippingType',
      keywords: ['shipping type', 'نوع الشحن', 'طريقة الشحن', 'delivery method', 'shipping method', 'وسيلة الشحن', 'طريقة التوصيل', 'نوع التوصيل']
    },
    {
      type: 'paymentType',
      keywords: ['payment type', 'نوع الدفع', 'طريقة الدفع', 'payment method', 'الدفع', 'كيفية الدفع', 'وسيلة الدفع', 'طريقة السداد']
    },
    {
      type: 'deliveryTime',
      keywords: ['delivery time', 'وقت التسليم', 'زمن التوصيل', 'موعد التسليم', 'وقت التوصيل', 'delivery schedule', 'time of delivery', 'موعد الشحن']
    },
    {
      type: 'region',
      keywords: ['region', 'المنطقة', 'منطقة', 'الحي', 'القطاع', 'الناحية', 'القضاء', 'district', 'zone', 'area', 'sector', 'الموقع', 'المكان']
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
  
  // إذا لم نجد تطابقًا، حاول التخمين بناءً على خصائص الحقل
  if (field instanceof HTMLInputElement && field.type) {
    const inputType = field.type.toLowerCase();
    if (inputType === 'tel' || (name && name.includes('phone')) || (name && name.includes('mobile'))) {
      return 'phoneNumber';
    } else if (inputType === 'number' && (name && (name.includes('price') || name.includes('amount')))) {
      return 'price';
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
        console.log(`[Bookmarklet] لم يتم العثور على تطابق في القائمة المنسدلة للقيمة: ${value}`);
        return false;
      }
    }
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
  } else if ('contentEditable' in field && field.contentEditable === 'true') {
    // ملء العناصر ذات المحتوى القابل للتحرير
    field.textContent = value;
    console.log(`[Bookmarklet] تم ملء عنصر المحتوى القابل للتحرير بالقيمة: ${value}`);
  } else {
    console.log(`[Bookmarklet] نوع حقل غير معروف: ${field.tagName}`);
    return false;
  }
  
  // إطلاق أحداث تغيير الحقل
  const events = ['input', 'change', 'blur', 'keyup'];
  events.forEach(eventType => {
    try {
      const event = new Event(eventType, { bubbles: true });
      field.dispatchEvent(event);
    } catch (error) {
      console.error(`خطأ في إطلاق حدث ${eventType}:`, error);
      // نحاول مرة أخرى بطريقة قديمة متوافقة مع IE للمتصفحات القديمة
      try {
        const ieEvent = document.createEvent('Event');
        ieEvent.initEvent(eventType, true, true);
        field.dispatchEvent(ieEvent);
      } catch (e) {
        console.error("فشل أيضًا في إطلاق الحدث بالطريقة القديمة");
      }
    }
  });
  
  // محاولة تنشيط الحقول للمواقع التي تعتمد على أحداث التركيز والنقر
  try {
    field.focus();
    field.click();
    // إطلاق حدث React غير القياسي لبعض مكتبات React
    const reactChangeEvent = new Event('reactChange', { bubbles: true });
    field.dispatchEvent(reactChangeEvent);
  } catch (e) {
    console.warn("تعذر تنشيط الحقل بالكامل:", e);
  }
  
  return true;
};

/**
 * وظيفة ملء النموذج بالبيانات
 */
export const fillForm = (item: BookmarkletItem) => {
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
  
  // تتبع الحقول التي تم ملؤها
  const filledFields: Record<string, boolean> = {};
  
  // محاولة تخمين وملء كل حقل
  fields.forEach(field => {
    // تحويل العنصر إلى النوع المناسب
    const inputElement = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement;
    const fieldType = guessFieldType(inputElement);
    
    if (fieldType !== 'unknown') {
      let value = '';
      
      // تحديد القيمة المناسبة بناءً على نوع الحقل
      switch (fieldType) {
        case 'code':
          value = item.code || '';
          break;
        case 'senderName':
          value = item.senderName || '';
          break;
        case 'phoneNumber':
          // تنسيق رقم الهاتف (إزالة المسافات والرموز غير الرقمية)
          value = item.phoneNumber ? item.phoneNumber.replace(/\D/g, '') : '';
          break;
        case 'province':
          value = item.province || '';
          break;
        case 'price':
          // تنسيق السعر (إزالة العملة والرموز)
          value = item.price ? item.price.replace(/[^\d.]/g, '') : '';
          break;
        case 'companyName':
          value = item.companyName || '';
          break;
        case 'address':
          // استخدام المحافظة والملاحظات معًا إذا وجدت
          value = `${item.province || ''}${item.notes ? ' - ' + item.notes : ''}`;
          break;
        case 'notes':
          value = item.notes || '';
          break;
        case 'productType':
          // استخدام الملاحظات أو فئة المنتج إذا كانت متوفرة
          value = item.category || item.notes || 'بضائع متنوعة';
          break;
        case 'orderNumber':
          // استخدام رمز الوصل
          value = item.code || '';
          break;
        case 'customerCode':
          value = item.customerCode || item.code || '';
          break;
        case 'recipientName':
          value = item.recipientName || item.senderName || '';
          break;
        case 'region':
          value = item.region || item.province || '';
          break;
      }
      
      if (value && fillField(inputElement, value)) {
        filledFields[fieldType] = true;
        console.log(`[Bookmarklet] تم ملء حقل ${fieldType} بنجاح: ${value}`);
      }
    }
  });
  
  // إضافة تأخير قصير ومحاولة ثانية للحقول التي قد تظهر بعد التفاعل مع الصفحة
  setTimeout(() => {
    const newFields = findFormFields();
    if (newFields.length > fields.length) {
      console.log(`[Bookmarklet] تم اكتشاف ${newFields.length - fields.length} حقول إضافية بعد التأخير`);
      
      // تحديد الحقول الجديدة فقط
      const existingIds = new Set(Array.from(fields).map(f => f.id || Math.random().toString()));
      const additionalFields = Array.from(newFields).filter(f => !existingIds.has(f.id || ''));
      
      // ملء الحقول الجديدة
      additionalFields.forEach(field => {
        const inputElement = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement;
        const fieldType = guessFieldType(inputElement);
        
        if (fieldType !== 'unknown' && !filledFields[fieldType]) {
          let value = '';
          
          switch (fieldType) {
            case 'code': value = item.code || ''; break;
            case 'senderName': value = item.senderName || ''; break;
            case 'phoneNumber': value = item.phoneNumber ? item.phoneNumber.replace(/\D/g, '') : ''; break;
            case 'province': value = item.province || ''; break;
            case 'price': value = item.price ? item.price.replace(/[^\d.]/g, '') : ''; break;
            default: break;
          }
          
          if (value && fillField(inputElement, value)) {
            filledFields[fieldType] = true;
          }
        }
      });
    }
    
    // حساب عدد الحقول التي تم ملؤها
    const filledCount = Object.keys(filledFields).length;
    
    // تحديث حالة العنصر
    updateItemStatus(
      item.id, 
      filledCount > 0 ? 'success' : 'error',
      filledCount > 0 
        ? `تم ملء ${filledCount} حقول بنجاح` 
        : 'فشل في العثور على حقول مناسبة'
    );
    
    console.log(`[Bookmarklet] اكتمال ملء النموذج: تم ملء ${filledCount} حقول`);
  }, 1000);
  
  // حساب العدد المبدئي للحقول التي تم ملؤها
  return Object.keys(filledFields).length;
};

/**
 * إنشاء واجهة تحكم البوكماركلت
 */
export const createBookmarkletUI = () => {
  // التحقق مما إذا كانت واجهة المستخدم موجودة بالفعل
  if (document.getElementById('bookmarklet-ui-container')) {
    console.log('[Bookmarklet] واجهة المستخدم موجودة بالفعل');
    return null;
  }
  
  // إنشاء عنصر الحاوية
  const container = document.createElement('div');
  container.id = 'bookmarklet-ui-container';
  container.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    width: 300px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 999999;
    font-family: Arial, sans-serif;
    direction: rtl;
  `;
  
  // إضافة العنوان
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'أداة نقل البيانات';
  title.style.margin = '0';
  title.style.fontSize = '16px';
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
  `;
  closeButton.onclick = () => container.remove();
  
  header.appendChild(title);
  header.appendChild(closeButton);
  container.appendChild(header);
  
  return {
    container,
    addContent: (content: HTMLElement) => {
      container.appendChild(content);
    },
    show: () => {
      document.body.appendChild(container);
    }
  };
};

/**
 * استخراج معلومات مفيدة من الصفحة الحالية
 */
export const extractPageInfo = () => {
  return {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    formCount: document.querySelectorAll('form').length,
    inputCount: document.querySelectorAll('input').length,
    selectCount: document.querySelectorAll('select').length,
    textareaCount: document.querySelectorAll('textarea').length,
    buttonCount: document.querySelectorAll('button').length,
    iframeCount: document.querySelectorAll('iframe').length
  };
};

/**
 * إضافة حدث استماع للتغييرات في الصفحة للعثور على حقول جديدة
 */
export const startDynamicFieldDetection = (callback: (fields: Element[]) => void) => {
  // متغير لتخزين الحقول المكتشفة سابقًا
  let previousFields: Element[] = [];
  
  // وظيفة للتحقق من الحقول الجديدة
  const checkForNewFields = () => {
    const currentFields = findFormFields();
    
    // التحقق مما إذا كان هناك حقول جديدة
    if (currentFields.length !== previousFields.length) {
      console.log(`[Bookmarklet] تم العثور على تغيير في عدد الحقول: ${previousFields.length} -> ${currentFields.length}`);
      previousFields = currentFields;
      callback(currentFields);
    }
  };
  
  // إعداد مراقب الـ DOM
  const observer = new MutationObserver(() => {
    checkForNewFields();
  });
  
  // بدء المراقبة
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // إجراء الفحص الأولي
  checkForNewFields();
  
  // إرجاع وظيفة لإيقاف المراقبة
  return () => observer.disconnect();
};
