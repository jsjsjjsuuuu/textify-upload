
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

// استيراد IRAQ_PROVINCE_MAP من fieldMappings
import { IRAQ_PROVINCE_MAP } from './fieldMappings';

// تعبئة الحقول في الصفحة المستهدفة - محسّنة للمواقع العراقية
export const fillFormFields = (item: any): FormFillerResults => {
  if (!item) return { filled: [], failed: [], message: 'لا توجد بيانات', success: false, attempted: 0 };
  
  console.log("بدء ملء النموذج بالبيانات:", item);
  
  // تعريف خريطة الحقول مع تحسين المحددات للمواقع العراقية
  const fieldMappings = [
    {
      key: 'code',
      label: 'رقم الوصل',
      value: item.code || '',
      selectors: [
        // محددات مضافة للمواقع العراقية
        'input[name*="reference"]',
        'input[id*="reference"]',
        'input[name*="voucher"]',
        'input[id*="voucher"]',
        'input[name*="no"]',
        'input[id*="no"]',
        'input[placeholder*="رقم الوصل"]',
        'input[placeholder*="رقم البوليصة"]',
        'input[placeholder*="رقم الشحنة"]',
        'input[placeholder*="رقم الطلب"]',
        'input[placeholder*="الرمز"]',
        'input[placeholder*="الكود"]',
        'input[name*="code"]',
        'input[id*="code"]',
        'input[name*="order"]',
        'input[id*="order"]',
        'input[name*="tracking"]',
        'input[id*="tracking"]',
        'input[name="bill_number"]',
        'input[id="bill_number"]',
        'input[name="shipment_number"]',
        'input[id="shipment_number"]',
        // دعم إضافي للأنماط العراقية
        'input[name*="wasl"]',
        'input[id*="wasl"]',
        'input[placeholder*="الواصل"]'
      ]
    },
    {
      key: 'phoneNumber',
      label: 'رقم الهاتف',
      value: formatIraqiPhoneNumber(item.phoneNumber),
      selectors: [
        // محددات محسنة لأرقام الهواتف العراقية
        'input[name*="phone"]',
        'input[id*="phone"]',
        'input[type="tel"]',
        'input[placeholder*="رقم الهاتف"]',
        'input[placeholder*="هاتف الزبون"]',
        'input[placeholder*="رقم الزبون"]',
        'input[placeholder*="موبايل"]',
        'input[placeholder*="جوال"]',
        'input[name*="mobile"]',
        'input[id*="mobile"]',
        'input[placeholder*="تليفون"]',
        'input[name*="tel"]',
        'input[id*="tel"]',
        'input[name="client_phone"]',
        'input[id="client_phone"]',
        'input[name="customer_mobile"]',
        'input[id="customer_mobile"]'
      ]
    },
    {
      key: 'senderName',
      label: 'اسم المرسل',
      value: item.senderName || item.customerName || '',
      selectors: [
        // محددات محسنة لأسماء العملاء في المواقع العراقية
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
        'input[name="name"]',
        'input[id="client_name"]',
        'input[name="client_name"]',
        'select[name="client_id"]',
        'select[id="client_id"]',
        // دعم إضافي للمواقع العراقية
        'input[name*="zabon"]',
        'input[id*="zabon"]',
        'input[name*="ameel"]',
        'input[id*="ameel"]',
        'select[name*="zabon"]',
        'select[id*="zabon"]',
        'select[name*="ameel"]',
        'select[id*="ameel"]',
        'select[name*="customer"]',
        'select[id*="customer"]',
        'select[name*="client"]',
        'select[id*="client"]'
      ]
    },
    {
      key: 'province',
      label: 'المحافظة',
      value: item.province || item.area || '',
      selectors: [
        // محددات محسنة للمحافظات العراقية
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
        'select[name="destination"]',
        'select[id="destination"]',
        'input[name*="province"]',
        'input[id*="province"]',
        'input[placeholder*="المحافظة"]',
        'input[name="city"]',
        'input[id="city"]',
        // دعم إضافي للمواقع العراقية
        'select[name*="muhafaza"]',
        'select[id*="muhafaza"]',
        'select[name*="mouhafaza"]',
        'select[id*="mouhafaza"]',
        'select[placeholder*="المنطقة"]',
        'select[placeholder*="إلى"]'
      ]
    },
    {
      key: 'price',
      label: 'المبلغ',
      value: formatPrice(item.price),
      selectors: [
        // محددات محسنة للمبالغ في المواقع العراقية
        'input[name*="price"]',
        'input[name*="amount"]',
        'input[id*="price"]',
        'input[id*="amount"]',
        'input[placeholder*="المبلغ"]',
        'input[placeholder*="المبلغ الكلي"]',
        'input[placeholder*="السعر"]',
        'input[type="number"]',
        'input[name*="total"]',
        'input[id*="total"]',
        'input[name*="cost"]',
        'input[id*="cost"]',
        'input[placeholder*="التكلفة"]',
        'input[name="total_amount"]',
        'input[id="total_amount"]',
        'input[name="cod_amount"]',
        'input[id="cod_amount"]',
        'input[name="grand_total"]',
        'input[id="grand_total"]',
        // دعم إضافي للمواقع العراقية
        'input[name*="mablagh"]',
        'input[id*="mablagh"]',
        'input[placeholder*="المبلغ بالدينار"]',
        'input[placeholder*="سعر"]',
        'input[placeholder*="قيمة"]'
      ]
    },
    {
      key: 'delegateName',
      label: 'اسم المندوب',
      value: item.delegateName || '',
      selectors: [
        'select[name*="delegate"]',
        'select[id*="delegate"]',
        'select[name*="agent"]',
        'select[id*="agent"]',
        'select[placeholder*="المندوب"]',
        'select[placeholder*="الموظف"]',
        'select[name="employee_id"]',
        'select[id="employee_id"]',
        'select[name="driver_id"]',
        'select[id="driver_id"]',
        // دعم إضافي للمواقع العراقية
        'select[name*="mandoob"]',
        'select[id*="mandoob"]',
        'select[name*="delivery_man"]',
        'select[id*="delivery_man"]',
        'select[name*="delivery_guy"]',
        'select[id*="delivery_guy"]',
        'select[placeholder*="السائق"]'
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
  
  // أولاً، عرض معلومات تشخيصية عن الصفحة الحالية
  const hostName = window.location.hostname;
  console.log(`[تشخيص البوكماركلت] موقع الويب الحالي: ${hostName}`);
  console.log(`[تشخيص البوكماركلت] مسار الصفحة: ${window.location.pathname}`);
  console.log(`[تشخيص البوكماركلت] عدد الحقول في الصفحة: ${document.querySelectorAll('input, select, textarea').length}`);
  
  // محاولة تحديد الإطارات وتجريب العمل داخلها أيضًا
  const frames = document.querySelectorAll('iframe');
  let documents = [document];
  
  try {
    // إضافة وثائق الإطارات إذا كان يمكن الوصول إليها
    frames.forEach(frame => {
      try {
        if (frame.contentDocument) {
          documents.push(frame.contentDocument);
          console.log(`[تشخيص البوكماركلت] تم العثور على إطار يمكن الوصول إليه: ${frame.id || frame.name || 'بدون اسم'}`);
        }
      } catch (e) {
        console.warn("[تشخيص البوكماركلت] لا يمكن الوصول إلى إطار بسبب سياسة CORS:", e);
      }
    });
  } catch (e) {
    console.warn("[تشخيص البوكماركلت] خطأ في محاولة الوصول إلى الإطارات:", e);
  }
  
  // تحسين: إضافة معلومات تشخيصية عن العناصر المميزة في الصفحة
  detectFormType();
  
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
            console.log(`[تشخيص البوكماركلت] وجدت عنصر للحقل ${mapping.key} باستخدام المحدد ${selector}`);
            
            // معلومات إضافية حول العنصر
            if (firstElement.name) console.log(`[تشخيص البوكماركلت] اسم العنصر: ${firstElement.name}`);
            if (firstElement.id) console.log(`[تشخيص البوكماركلت] معرّف العنصر: ${firstElement.id}`);
            if (firstElement.type) console.log(`[تشخيص البوكماركلت] نوع العنصر: ${firstElement.type}`);
            
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
        console.log(`[تشخيص البوكماركلت] فشل في العثور على أو ملء الحقل: ${mapping.key}`);
      }
    } catch (error) {
      console.error(`[تشخيص البوكماركلت] خطأ عام في معالجة الحقل ${mapping.key}:`, error);
      results.failed.push(mapping.key);
    }
  });
  
  // إذا لم يتم العثور على حقول كافية، حاول البحث بشكل أكثر ذكاءً
  if (results.filled.length < 3) {
    console.log("[تشخيص البوكماركلت] عدد قليل من الحقول تم ملؤها، محاولة استراتيجية متقدمة للاكتشاف...");
    
    // تجربة البحث عن الحقول باستخدام استراتيجية استكشافية متقدمة
    const foundByAdvancedDetection = advancedFieldDetection(documents, fieldMappings, results);
    console.log(`[تشخيص البوكماركلت] تم العثور على ${foundByAdvancedDetection} حقول إضافية باستخدام الاكتشاف المتقدم`);
  }
  
  // بعد ملء الحقول، محاولة الضغط على زر الحفظ تلقائيًا
  try {
    const saveButtonClicked = findAndClickIraqiSaveButton();
    if (saveButtonClicked) {
      console.log("[تشخيص البوكماركلت] تم العثور على زر الحفظ والضغط عليه تلقائيًا");
    } else {
      console.log("[تشخيص البوكماركلت] لم يتم العثور على زر الحفظ، يرجى الضغط عليه يدويًا");
    }
  } catch (e) {
    console.warn("[تشخيص البوكماركلت] خطأ أثناء محاولة الضغط على زر الحفظ:", e);
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

// دالة محسنة لتخمين نوع النموذج
function detectFormType() {
  // البحث عن العناصر المميزة للنماذج العراقية
  const formTitle = document.querySelector('h1, h2, h3, h4, .title, .header-title, .page-title');
  if (formTitle) {
    console.log(`[تشخيص البوكماركلت] عنوان النموذج المكتشف: ${formTitle.textContent}`);
  }
  
  // البحث عن أزرار متميزة في الصفحة
  const saveButton = document.querySelector('button[type="submit"], input[type="submit"], button.btn-primary, button:contains("حفظ")');
  if (saveButton) {
    console.log('[تشخيص البوكماركلت] تم العثور على زر حفظ محتمل');
    const buttonText = saveButton.textContent?.trim() || '';
    if (buttonText) {
      console.log(`[تشخيص البوكماركلت] نص زر الحفظ: ${buttonText}`);
    }
  }
  
  // محاولة تحديد المنصة
  if (document.documentElement.innerHTML.includes('express-box')) {
    console.log('[تشخيص البوكماركلت] نوع النموذج المكتشف: Express Box');
  } else if (document.documentElement.innerHTML.includes('alryany')) {
    console.log('[تشخيص البوكماركلت] نوع النموذج المكتشف: Al Ryany Delivery');
  } else if (document.documentElement.innerHTML.includes('wasla') || document.documentElement.innerHTML.includes('wasl')) {
    console.log('[تشخيص البوكماركلت] نوع النموذج المكتشف: Wasla/Wasl');
  } else if (document.documentElement.innerHTML.includes('aramex')) {
    console.log('[تشخيص البوكماركلت] نوع النموذج المكتشف: Aramex');
  } else {
    console.log('[تشخيص البوكماركلت] نوع النموذج: غير معروف');
  }
}

// دالة جديدة للاكتشاف المتقدم للحقول
function advancedFieldDetection(documents: Document[], fieldMappings: any[], results: FormFillerResults): number {
  let fieldsFound = 0;
  
  // دالة مساعدة للبحث في العناصر المجاورة عن تسميات
  const findAdjacentLabels = (element: Element): string => {
    let labelText = '';
    
    // البحث في العناصر الشقيقة السابقة
    let sibling = element.previousElementSibling;
    while (sibling && !labelText) {
      if (sibling.tagName.toLowerCase() === 'label' || 
          sibling.classList.contains('form-label') || 
          sibling.classList.contains('label')) {
        labelText = sibling.textContent?.trim() || '';
      }
      sibling = sibling.previousElementSibling;
    }
    
    // البحث في العنصر الأب
    if (!labelText) {
      const parent = element.parentElement;
      if (parent) {
        const labels = parent.querySelectorAll('label, .form-label, .label, span');
        for (const label of Array.from(labels)) {
          if (label.textContent?.trim()) {
            labelText = label.textContent.trim();
            break;
          }
        }
      }
    }
    
    return labelText;
  };
  
  // البحث عن جميع الحقول المحتملة في كل مستند
  for (const doc of documents) {
    const allInputs = doc.querySelectorAll('input, select, textarea');
    
    allInputs.forEach((input: ElementWithValue) => {
      try {
        // تجمع التسمية المجاورة للحقل
        const adjacentLabel = findAdjacentLabels(input);
        
        if (adjacentLabel) {
          console.log(`[تشخيص البوكماركلت] عنصر مع تسمية: "${adjacentLabel}"`);
          
          // بحث أكثر دقة عن نوع الحقل بالاعتماد على التسمية
          const isPhoneField = /هاتف|موبايل|جوال|تلفون|phone|mobile/i.test(adjacentLabel);
          const isCodeField = /كود|رمز|رقم.*وصل|رقم.*شحنة|رقم.*طلب|code|reference/i.test(adjacentLabel);
          const isCustomerField = /عميل|زبون|مرسل|اسم.*العميل|اسم.*الزبون|اسم.*المرسل|customer|sender|client/i.test(adjacentLabel);
          const isProvinceField = /محافظة|مدينة|منطقة|province|city|area/i.test(adjacentLabel);
          const isPriceField = /مبلغ|سعر|قيمة|كلفة|price|amount|cost/i.test(adjacentLabel);
          
          let fieldType = '';
          if (isPhoneField) fieldType = 'phoneNumber';
          else if (isCodeField) fieldType = 'code';
          else if (isCustomerField) fieldType = 'senderName';
          else if (isProvinceField) fieldType = 'province';
          else if (isPriceField) fieldType = 'price';
          
          if (fieldType && !results.filled.includes(fieldType)) {
            // العثور على البيانات المقابلة من العنصر
            const mapping = fieldMappings.find(m => m.key === fieldType);
            
            if (mapping) {
              console.log(`[تشخيص البوكماركلت] محاولة اكتشاف متقدمة: محاولة ملء الحقل ${fieldType} بقيمة ${mapping.value}`);
              const filledStatus = fillSingleField(input, mapping, results);
              if (filledStatus) {
                fieldsFound++;
              }
            }
          }
        } else {
          // لتخمين عام للحقل إذا لم نجد تسمية
          const fieldType = guessFieldTypeImproved(input);
          
          if (fieldType !== 'unknown' && !results.filled.includes(fieldType)) {
            // العثور على البيانات المقابلة من العنصر
            const mapping = fieldMappings.find(m => m.key === fieldType);
            
            if (mapping) {
              console.log(`[تشخيص البوكماركلت] محاولة اكتشاف متقدمة: محاولة ملء الحقل ${fieldType} بقيمة ${mapping.value}`);
              const filledStatus = fillSingleField(input, mapping, results);
              if (filledStatus) {
                fieldsFound++;
              }
            }
          }
        }
      } catch (e) {
        console.warn("[تشخيص البوكماركلت] خطأ في تخمين وملء حقل:", e);
      }
    });
  }
  
  return fieldsFound;
}

// دالة مساعدة لتنسيق رقم الهاتف العراقي
function formatIraqiPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // إزالة كل شيء ما عدا الأرقام
  const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
  
  // معالجة الصيغ المختلفة من الأرقام العراقية
  if (digitsOnly.length === 10 && digitsOnly.startsWith('7')) {
    return '0' + digitsOnly; // إضافة الصفر في البداية
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('07')) {
    return digitsOnly; // الحفاظ على الرقم كما هو
  } else if (digitsOnly.length === 13 && digitsOnly.startsWith('9647')) {
    return '0' + digitsOnly.substring(3); // تحويل الرقم الدولي إلى محلي
  } else if (digitsOnly.length === 14 && digitsOnly.startsWith('00964')) {
    return '0' + digitsOnly.substring(5); // تحويل الرقم الدولي بصيغة 00 إلى محلي
  }
  
  return phoneNumber; // إرجاع الرقم كما هو إذا لم يطابق أي صيغة
}

// دالة مساعدة لتنسيق سعر الشحنة
function formatPrice(price: string): string {
  if (!price) return '0';
  
  // التعامل مع القيم النصية الخاصة
  if (price.toLowerCase() === 'مجاني' || price.toLowerCase() === 'free' || 
      price.toLowerCase() === 'واصل' || price.toLowerCase() === 'توصيل') {
    return '0';
  }
  
  // إزالة كل شيء عدا الأرقام والعلامة العشرية
  const numericValue = price.replace(/[^\d.]/g, '');
  
  // التحقق من وجود قيمة صالحة
  if (!numericValue || isNaN(Number(numericValue))) {
    return '0';
  }
  
  return numericValue;
}

// دالة مساعدة لملء حقل واحد
const fillSingleField = (element: ElementWithValue, mapping: any, results: FormFillerResults): boolean => {
  try {
    // إذا وجدنا عنصرًا وكان لدينا قيمة، نحاول ملئه
    if (element && mapping.value) {
      // تحديد نوع العنصر وملئه بالطريقة المناسبة
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'select') {
        return fillIraqiSelectField(element as HTMLSelectElement, mapping, results);
      } else if (tagName === 'input' || tagName === 'textarea') {
        return fillInputField(element, mapping, results);
      } else {
        // لأنواع الحقول الأخرى
        console.log(`[تشخيص البوكماركلت] نوع حقل غير معروف: ${tagName}`);
        return false;
      }
    } else {
      // إذا لم نجد العنصر أو لم تكن هناك قيمة
      if (!element) {
        console.log(`[تشخيص البوكماركلت] لم يتم العثور على عنصر للحقل: ${mapping.key}`);
      } else {
        console.log(`[تشخيص البوكماركلت] لا توجد قيمة للحقل: ${mapping.key}`);
      }
      return false;
    }
  } catch (error) {
    console.error(`[تشخيص البوكماركلت] خطأ في ملء الحقل ${mapping.key}:`, error);
    return false;
  }
};

// دالة محسنة لملء حقول القائمة المنسدلة العراقية
const fillIraqiSelectField = (element: HTMLSelectElement, mapping: any, results: FormFillerResults): boolean => {
  // تحسين آلية تحديد الخيار المناسب في القائمة المنسدلة
  const options = Array.from(element.options);
  const value = mapping.value.toString().trim().toLowerCase();
  
  console.log(`[تشخيص البوكماركلت] القائمة المنسدلة ${mapping.key} تحتوي على ${options.length} خيارات`);
  
  // طباعة معلومات عن الخيارات المتاحة للتشخيص
  if (options.length > 0 && options.length < 20) { // الطباعة فقط إذا كان عدد الخيارات معقولًا
    console.log('[تشخيص البوكماركلت] الخيارات المتاحة:');
    options.forEach(opt => {
      console.log(`- ${opt.text.trim()} (${opt.value})`);
    });
  }
  
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
  if (!matchedOption && (mapping.key === 'province' || mapping.key === 'area')) {
    matchedOption = findIraqiProvinceMatchOption(options, value);
  }
  
  // إذا وجدنا خيارًا مناسبًا
  if (matchedOption) {
    // تعيين القيمة للخيار المحدد
    element.value = matchedOption.value;
    console.log(`[تشخيص البوكماركلت] تم ملء القائمة المنسدلة ${mapping.key} بالقيمة: ${matchedOption.text} (${matchedOption.value})`);
    results.filled.push(mapping.key);
    
    // إطلاق أحداث التغيير
    triggerEvents(element);
    return true;
  }
  
  // إذا لم نجد خيارًا مناسبًا، نحاول استخدام أول خيار غير فارغ
  if (options.length > 0) {
    for (const option of options) {
      if (option.value && option.value !== '' && option.text.trim() !== '' && option.index > 0) {
        element.value = option.value;
        console.log(`[تشخيص البوكماركلت] استخدام الخيار الأول لـ ${mapping.key}: ${option.text}`);
        results.filled.push(mapping.key);
        
        // إطلاق أحداث التغيير
        triggerEvents(element);
        return true;
      }
    }
  }
  
  console.log(`[تشخيص البوكماركلت] لم يتم العثور على خيار مناسب للقائمة المنسدلة: ${mapping.key}`);
  return false;
};

// دالة محسنة للعثور على خيار المحافظة المناسب للمواقع العراقية
const findIraqiProvinceMatchOption = (options: HTMLOptionElement[], value: string): HTMLOptionElement | undefined => {
  console.log(`[تشخيص البوكماركلت] البحث عن مطابقة للمحافظة: "${value}"`);
  
  // 1. البحث عن تطابق مباشر بالعربية
  const directMatch = options.find(opt => 
    opt.text.trim().toLowerCase() === value
  );
  
  if (directMatch) {
    console.log(`[تشخيص البوكماركلت] وجدت تطابق مباشر للمحافظة: ${directMatch.text}`);
    return directMatch;
  }
  
  // 2. البحث في البدائل لأسماء المحافظات العراقية
  for (const province of IRAQ_PROVINCE_MAP.provinces) {
    if (value === province.toLowerCase()) {
      const provinceMatch = options.find(opt => 
        opt.text.toLowerCase().includes(province.toLowerCase())
      );
      
      if (provinceMatch) {
        console.log(`[تشخيص البوكماركلت] وجدت تطابق للمحافظة "${province}" في الخيار: ${provinceMatch.text}`);
        return provinceMatch;
      }
    }
    
    // البحث في البدائل للمحافظة
    const alternatives = IRAQ_PROVINCE_MAP.alternativeNames[province] || [];
    for (const alt of alternatives) {
      if (value === alt.toLowerCase()) {
        const altMatch = options.find(opt => 
          opt.text.toLowerCase().includes(province.toLowerCase()) || 
          alternatives.some(a => opt.text.toLowerCase().includes(a.toLowerCase()))
        );
        
        if (altMatch) {
          console.log(`[تشخيص البوكماركلت] وجدت تطابق للبديل "${alt}" (${province}) في الخيار: ${altMatch.text}`);
          return altMatch;
        }
      }
    }
  }
  
  // 3. البحث بالاتجاه المعاكس - للمحافظة التي ترد في نص الخيار
  for (const option of options) {
    const optionText = option.text.toLowerCase();
    
    for (const province of IRAQ_PROVINCE_MAP.provinces) {
      if (optionText.includes(province.toLowerCase())) {
        console.log(`[تشخيص البوكماركلت] وجدت تطابق للمحافظة "${province}" في نص الخيار: ${option.text}`);
        return option;
      }
      
      // التحقق من البدائل
      const alternatives = IRAQ_PROVINCE_MAP.alternativeNames[province] || [];
      if (alternatives.some(alt => optionText.includes(alt.toLowerCase()))) {
        console.log(`[تشخيص البوكماركلت] وجدت تطابق لبديل محافظة "${province}" في نص الخيار: ${option.text}`);
        return option;
      }
    }
  }
  
  // 4. محاولة مطابقة ذكية أخيرة (استخدام أول خيار يحتوي على اسم مدينة/محافظة)
  const provinceKeywords = ['محافظة', 'مدينة', 'بغداد', 'البصرة', 'النجف', 'كربلاء', 'أربيل'];
  const provinceOption = options.find(opt => 
    provinceKeywords.some(keyword => opt.text.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  if (provinceOption) {
    console.log(`[تشخيص البوكماركلت] وجدت خيار محتمل للمحافظة باستخدام كلمات مفتاحية: ${provinceOption.text}`);
    return provinceOption;
  }
  
  console.log('[تشخيص البوكماركلت] لم أجد أي تطابق مناسب للمحافظة');
  return undefined;
};

// دالة مساعدة لملء حقول الإدخال النصية
const fillInputField = (element: ElementWithValue, mapping: any, results: FormFillerResults): boolean => {
  try {
    if (element.type === 'checkbox' || element.type === 'radio') {
      // للمربعات أو أزرار الاختيار
      const shouldCheck = mapping.value === 'true' || mapping.value === '1' || mapping.value.toLowerCase() === 'نعم';
      (element as HTMLInputElement).checked = shouldCheck;
      console.log(`[تشخيص البوكماركلت] تم ضبط خانة الاختيار: ${mapping.key} = ${shouldCheck}`);
    } else {
      // تحسين معالجة القيم للحقول المختلفة
      let finalValue = mapping.value;
      
      if (element.type === 'tel' || mapping.key === 'phoneNumber') {
        // تنظيف رقم الهاتف - تحسين خاص للأرقام العراقية
        finalValue = formatIraqiPhoneNumber(mapping.value);
      } else if (element.type === 'number' || mapping.key === 'price') {
        // تنظيف المبالغ من الأحرف غير الرقمية
        finalValue = formatPrice(mapping.value);
      } else if (mapping.key === 'code') {
        // تحسين خاص لأكواد الوصل العراقية
        finalValue = mapping.value.replace(/[^\d]/g, '');
      }
      
      // تعيين القيمة مباشرة وكذلك defaultValue للتغلب على بعض الحماية
      (element as HTMLInputElement).value = finalValue;
      
      if ('defaultValue' in element) {
        (element as HTMLInputElement).defaultValue = finalValue;
      }
    }
    
    // إطلاق سلسلة من أحداث DOM للتغلب على آليات الحماية
    triggerEvents(element);
    
    console.log(`[تشخيص البوكماركلت] تم ملء الحقل: ${mapping.key} بالقيمة: ${mapping.value}`);
    results.filled.push(mapping.key);
    return true;
  } catch (e) {
    console.error(`[تشخيص البوكماركلت] خطأ في ملء الحقل ${mapping.key}:`, e);
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
      console.warn(`[تشخيص البوكماركلت] خطأ في إطلاق حدث ${eventType}:`, e);
      
      // خطة بديلة باستخدام الواجهة البرمجية القديمة للأحداث
      try {
        const legacyEvent = document.createEvent('HTMLEvents');
        legacyEvent.initEvent(eventType, true, true);
        element.dispatchEvent(legacyEvent);
      } catch (legacyError) {
        console.warn(`[تشخيص البوكماركلت] فشل أيضًا في إطلاق الحدث بالطريقة القديمة:`, legacyError);
      }
    }
  }
  
  // إضافة محاكاة النقر لبعض الحقول
  if (element.type === 'checkbox' || element.type === 'radio') {
    try {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      element.dispatchEvent(clickEvent);
    } catch (e) {
      console.warn(`[تشخيص البوكماركلت] خطأ في إطلاق حدث النقر:`, e);
    }
  }
};

// دالة مساعدة لتخمين نوع الحقل - نسخة محسنة للمواقع العراقية
const guessFieldTypeImproved = (element: ElementWithValue): string => {
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
  
  // محددات تحسين خاصة بالمواقع العراقية
  const iraqiPatterns = {
    code: /رقم.*وصل|رقم.*طلب|رقم.*شحنة|كود|رمز|مرجع|reference|ref|order|bill|tracking|waybill|code|رقم/,
    phoneNumber: /هاتف|phone|موبايل|جوال|mobile|tel|اتصال|تلفون|زبون|العميل/,
    senderName: /اسم.*عميل|اسم.*مرسل|اسم.*زبون|sender|customer|client|name|امرسل|الزبون/,
    province: /محافظة|province|مدينة|city|منطقة|area|destination|الى|governorate|المدينة/,
    price: /سعر|مبلغ|price|amount|cost|total|المال|الثمن|دينار|cod|النقود|قيمة/,
    delegateName: /مندوب|agent|delivery|driver|موظف|ساعي|deliveryman|mandoob/
  };
  
  // البحث عن أفضل تطابق للحقول
  for (const [fieldType, pattern] of Object.entries(iraqiPatterns)) {
    if (pattern.test(allText)) {
      return fieldType;
    }
  }
  
  // تخمين بناءً على خصائص الحقل
  if (type === 'tel') {
    return 'phoneNumber';
  } else if (type === 'number') {
    // تخمين ذكي بناء على نوع الحقل العددي
    if (placeholder.includes('رقم') || name.includes('code') || id.includes('code')) {
      return 'code';
    } else {
      return 'price'; // الافتراض الأكثر شيوعًا للحقول العددية
    }
  } else if (tagName === 'select') {
    // تخمين ذكي للقوائم المنسدلة
    if (name.includes('city') || name.includes('province') || name.includes('area')) {
      return 'province';
    } else if (name.includes('customer') || name.includes('client') || name.includes('sender')) {
      return 'senderName';
    } else if (name.includes('delegate') || name.includes('driver') || name.includes('agent')) {
      return 'delegateName';
    }
  }
  
  // إذا كان الحقل كبيرًا وله أكثر من 20 حرفًا، ربما يكون ملاحظات
  if (tagName === 'textarea' || ('maxLength' in element && (element as HTMLInputElement).maxLength > 100)) {
    return 'notes';
  }
  
  return 'unknown';
};

// دالة جديدة للبحث عن زر الحفظ في المواقع العراقية والضغط عليه
const findAndClickIraqiSaveButton = (): boolean => {
  console.log("[تشخيص البوكماركلت] البحث عن زر الحفظ للمواقع العراقية...");
  
  // إضافة محددات خاصة بالمواقع العراقية
  const iraqiSaveButtonSelectors = [
    'button[type="submit"][name="submit"][class*="btn-primary"]',
    'button:contains("حفظ")',
    'button:contains("إضافة")',
    'button:contains("تأكيد")',
    'button:contains("إرسال")',
    'button.btn-primary:contains("حفظ")',
    'button.btn-success:contains("حفظ")',
    'input[type="submit"][value*="حفظ"]',
    'input[type="submit"][value*="إضافة"]',
    'input.btn-primary[type="submit"]',
    'button.save-button',
    'button.btn-save',
    '.save-btn',
    '.add-btn',
    'button[type="submit"]'
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
  
  // 1. أولاً، محاولة العثور على زر الحفظ الخاص بالمواقع العراقية
  try {
    const exactButton = document.querySelector('button[type="submit"][name="submit"][class*="btn-primary"]');
    if (exactButton) {
      console.log("[تشخيص البوكماركلت] تم العثور على زر الحفظ بالمواصفات المحددة!");
      (exactButton as HTMLElement).click();
      return true;
    }
    
    // 2. البحث عن أزرار بنص "حفظ" بالعربية
    const saveButtons = findButtonsWithText("حفظ");
    if (saveButtons.length > 0) {
      console.log(`[تشخيص البوكماركلت] وجدت ${saveButtons.length} أزرار مع نص "حفظ"، محاولة النقر على الأول...`);
      saveButtons[0].click();
      return true;
    }
    
    // 3. البحث عن أزرار بنص "إضافة" بالعربية
    const addButtons = findButtonsWithText("إضافة");
    if (addButtons.length > 0) {
      console.log(`[تشخيص البوكماركلت] وجدت ${addButtons.length} أزرار مع نص "إضافة"، محاولة النقر على الأول...`);
      addButtons[0].click();
      return true;
    }
    
    // 4. محاولة العثور على زر باستخدام المحددات المعروفة
    for (const selector of iraqiSaveButtonSelectors) {
      if (!selector.includes(':contains("')) {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > 0) {
          console.log(`[تشخيص البوكماركلت] وجدت زر باستخدام المحدد "${selector}"، محاولة النقر عليه...`);
          (buttons[0] as HTMLElement).click();
          return true;
        }
      }
    }
    
    // 5. البحث في جميع الأزرار وتصنيفها حسب احتمالية كونها زر حفظ
    const buttonScores: {element: HTMLElement, score: number}[] = [];
    
    for (const button of Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))) {
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
        console.log(`[تشخيص البوكماركلت] محاولة النقر على أفضل زر محتمل (النتيجة: ${buttonScores[0].score}, النص: "${bestButton.textContent?.trim() || '-'}")...`);
        bestButton.click();
        return true;
      } catch (e) {
        console.warn("[تشخيص البوكماركلت] خطأ أثناء النقر على أفضل زر محتمل:", e);
      }
    }
  } catch (e) {
    console.error("[تشخيص البوكماركلت] خطأ عام أثناء البحث عن زر الحفظ:", e);
  }
  
  console.log("[تشخيص البوكماركلت] لم يتم العثور على زر حفظ مناسب");
  return false;
};

