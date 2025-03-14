
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
  const fields = document.querySelectorAll('input, select, textarea');
  return Array.from(fields);
};

/**
 * وظيفة تخمين نوع الحقل بناء على السمات المختلفة
 */
export const guessFieldType = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string => {
  // جمع كل المعرّفات المحتملة للحقل
  const name = field.name ? field.name.toLowerCase() : '';
  const id = field.id ? field.id.toLowerCase() : '';
  const className = field.className ? field.className.toLowerCase() : '';
  const placeholderText = 'placeholder' in field ? (field.placeholder || '').toLowerCase() : '';
  
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
  
  // مصفوفة من الكلمات المفتاحية والأنماط
  const patterns = [
    { type: 'code', keywords: ['code', 'كود', 'رمز', 'رقم الوصل', 'رقم الشحنة', 'رقم الطلب', 'order'] },
    { type: 'senderName', keywords: ['sender', 'name', 'customer', 'اسم', 'المرسل', 'الزبون', 'العميل', 'المستلم'] },
    { type: 'phoneNumber', keywords: ['phone', 'mobile', 'هاتف', 'موبايل', 'جوال', 'رقم الهاتف', 'تليفون'] },
    { type: 'province', keywords: ['province', 'state', 'city', 'region', 'محافظة', 'المحافظة', 'مدينة', 'منطقة'] },
    { type: 'price', keywords: ['price', 'amount', 'cost', 'سعر', 'المبلغ', 'التكلفة', 'قيمة', 'دينار'] },
    { type: 'companyName', keywords: ['company', 'business', 'vendor', 'شركة', 'الشركة', 'المتجر', 'البائع'] }
  ];
  
  // تجميع كل النصوص المتاحة للبحث
  const searchText = `${name} ${id} ${className} ${placeholderText} ${labelText} ${surroundingText}`;
  
  // البحث عن أفضل تطابق
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => searchText.includes(keyword))) {
      return pattern.type;
    }
  }
  
  // إذا لم نجد تطابقًا
  return 'unknown';
};

/**
 * وظيفة ملء الحقل بالقيمة المناسبة وإطلاق أحداث التغيير
 */
export const fillField = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) => {
  // التعامل مع القوائم المنسدلة
  if (field.tagName === 'SELECT') {
    const select = field as HTMLSelectElement;
    
    // محاولة العثور على الخيار المطابق
    const options = Array.from(select.options);
    const exactMatch = options.find(option => 
      option.text.toLowerCase() === value.toLowerCase() || 
      option.value.toLowerCase() === value.toLowerCase()
    );
    
    if (exactMatch) {
      select.value = exactMatch.value;
    } else {
      // البحث عن تطابق جزئي
      const partialMatch = options.find(option => 
        option.text.toLowerCase().includes(value.toLowerCase()) || 
        value.toLowerCase().includes(option.text.toLowerCase())
      );
      
      if (partialMatch) {
        select.value = partialMatch.value;
      }
    }
  } else {
    // التعامل مع حقول النص والإدخال العادية
    field.value = value;
  }
  
  // إطلاق أحداث تغيير الحقل
  const events = ['input', 'change', 'blur'];
  events.forEach(eventType => {
    const event = new Event(eventType, { bubbles: true });
    field.dispatchEvent(event);
  });
  
  return true;
};

/**
 * وظيفة ملء النموذج بالبيانات
 */
export const fillForm = (item: BookmarkletItem) => {
  // البحث عن حقول النموذج
  const fields = findFormFields();
  console.log(`[Bookmarklet] وجدت ${fields.length} حقل إدخال`);
  
  // تتبع الحقول التي تم ملؤها
  const filledFields: Record<string, boolean> = {};
  
  // محاولة تخمين وملء كل حقل
  fields.forEach(field => {
    // تحويل العنصر إلى النوع المناسب
    const inputElement = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const fieldType = guessFieldType(inputElement);
    
    if (fieldType !== 'unknown') {
      let value = '';
      
      // تحديد القيمة المناسبة بناءً على نوع الحقل
      switch (fieldType) {
        case 'code':
          value = item.code;
          break;
        case 'senderName':
          value = item.senderName;
          break;
        case 'phoneNumber':
          // تنسيق رقم الهاتف (إزالة المسافات والرموز غير الرقمية)
          value = item.phoneNumber.replace(/\D/g, '');
          break;
        case 'province':
          value = item.province;
          break;
        case 'price':
          // تنسيق السعر (إزالة العملة والرموز)
          value = item.price.replace(/[^\d.]/g, '');
          break;
        case 'companyName':
          value = item.companyName;
          break;
      }
      
      if (value && fillField(inputElement, value)) {
        filledFields[fieldType] = true;
      }
    }
  });
  
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
  
  return filledCount;
};

/**
 * إنشاء واجهة تحكم البوكماركلت
 */
export const createBookmarkletUI = () => {
  // هذه الوظيفة ستكون مسؤولة عن إنشاء واجهة المستخدم للبوكماركلت
  // سيتم استخدامها من ملف bookmarkletService.ts
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
    inputCount: document.querySelectorAll('input').length
  };
};


