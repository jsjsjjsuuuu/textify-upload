
// تحديث interface لأنواع HTML المختلفة للحقول
interface ElementWithValue extends HTMLElement {
  value?: string;
  checked?: boolean;
  type?: string;
  name?: string;
  placeholder?: string;
  options?: HTMLOptionElement[];
}

// تعبئة الحقول في الصفحة المستهدفة
export const fillFormFields = (item: any) => {
  if (!item) return { filled: [], failed: [], message: 'لا توجد بيانات', success: false, attempted: 0 };
  
  console.log("بدء ملء النموذج بالبيانات:", item);
  
  // تعريف خريطة الحقول
  const fieldMappings = [
    {
      key: 'code',
      label: 'رقم الوصل',
      value: item.code || '',
      selectors: [
        'input[name*="code"]',
        'input[id*="code"]',
        'input[placeholder*="رقم الوصل"]',
        'input[placeholder*="رقم البوليصة"]'
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
        'input[placeholder*="موبايل"]'
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
        'input[placeholder*="اسم المرسل"]',
        'input[placeholder*="اسم العميل"]'
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
        'input[placeholder*="اسم المستلم"]'
      ]
    },
    {
      key: 'province',
      label: 'المحافظة',
      value: item.province || '',
      selectors: [
        'select[name*="province"]',
        'select[id*="province"]',
        'select[name*="city"]',
        'select[placeholder*="المحافظة"]'
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
        'input[placeholder*="المبلغ"]',
        'input[type="number"]'
      ]
    }
  ];
  
  // تتبع الحقول المملوءة والفاشلة
  const results = {
    filled: [] as string[],
    failed: [] as string[],
    message: '',
    success: false,
    attempted: 0
  };
  
  // البحث في عناصر الصفحة ومحاولة ملئها
  fieldMappings.forEach(mapping => {
    results.attempted++;
    
    // البحث عن العنصر في الصفحة
    let foundElement: ElementWithValue | null = null;
    
    for (const selector of mapping.selectors) {
      try {
        const element = document.querySelector(selector) as ElementWithValue;
        if (element) {
          foundElement = element;
          break;
        }
      } catch (error) {
        console.warn(`خطأ في البحث عن العنصر: ${selector}`, error);
      }
    }
    
    // إذا وجدنا عنصرًا وكان لدينا قيمة، نحاول ملئه
    if (foundElement && mapping.value) {
      try {
        // تحديد نوع العنصر وملئه بالطريقة المناسبة
        const tagName = foundElement.tagName.toLowerCase();
        
        if (tagName === 'select') {
          // للقوائم المنسدلة - تحويل العنصر بشكل صريح
          const selectElement = foundElement as unknown as HTMLSelectElement;
          const options = Array.from(selectElement.options);
          
          // البحث عن تطابق دقيق أو جزئي
          const exactMatch = options.find(opt => 
            opt.text.trim().toLowerCase() === mapping.value.toLowerCase() || 
            opt.value.toLowerCase() === mapping.value.toLowerCase()
          );
          
          if (exactMatch) {
            // تعيين القيمة باستخدام قيمة الخيار
            selectElement.value = exactMatch.value;
            console.log(`تم ملء القائمة المنسدلة: ${mapping.key} بالقيمة: ${exactMatch.text}`);
            results.filled.push(mapping.key);
          } else {
            // البحث عن تطابق جزئي
            const partialMatch = options.find(opt => 
              opt.text.trim().toLowerCase().includes(mapping.value.toLowerCase()) || 
              mapping.value.toLowerCase().includes(opt.text.trim().toLowerCase())
            );
            
            if (partialMatch) {
              selectElement.value = partialMatch.value;
              console.log(`تم ملء القائمة المنسدلة (تطابق جزئي): ${mapping.key} بالقيمة: ${partialMatch.text}`);
              results.filled.push(mapping.key);
            } else {
              console.log(`لم يتم العثور على خيار مطابق للقيمة: ${mapping.value}`);
              results.failed.push(mapping.key);
            }
          }
          
          // إطلاق حدث التغيير
          const event = new Event('change', { bubbles: true });
          foundElement.dispatchEvent(event);
        } else if (tagName === 'input' || tagName === 'textarea') {
          // للحقول النصية
          if (foundElement.type === 'checkbox' || foundElement.type === 'radio') {
            // للمربعات أو أزرار الاختيار
            const shouldCheck = mapping.value === 'true' || mapping.value === '1' || mapping.value.toLowerCase() === 'نعم';
            (foundElement as HTMLInputElement).checked = shouldCheck;
          } else {
            // للحقول النصية العادية
            (foundElement as HTMLInputElement).value = mapping.value;
          }
          
          // إطلاق أحداث التغيير والإدخال
          ['input', 'change', 'blur'].forEach(eventType => {
            const event = new Event(eventType, { bubbles: true });
            foundElement!.dispatchEvent(event);
          });
          
          console.log(`تم ملء الحقل: ${mapping.key} بالقيمة: ${mapping.value}`);
          results.filled.push(mapping.key);
        } else {
          // لأنواع الحقول الأخرى
          console.log(`نوع حقل غير معروف: ${tagName}`);
          results.failed.push(mapping.key);
        }
      } catch (error) {
        console.error(`خطأ في ملء الحقل ${mapping.key}:`, error);
        results.failed.push(mapping.key);
      }
    } else {
      // إذا لم نجد العنصر أو لم تكن هناك قيمة
      if (!foundElement) {
        console.log(`لم يتم العثور على عنصر للحقل: ${mapping.key}`);
      } else {
        console.log(`لا توجد قيمة للحقل: ${mapping.key}`);
      }
      results.failed.push(mapping.key);
    }
  });
  
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
