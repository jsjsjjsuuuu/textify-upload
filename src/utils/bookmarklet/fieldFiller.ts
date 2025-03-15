import { formatIraqiPhoneNumber, formatPrice, detectFormType, advancedFieldDetection, fillSingleField, findAndClickIraqiSaveButton } from './bookmarkletHelpers';

/**
 * ملء نموذج باستخدام بيانات العنصر المحدد
 */
export const fillFormFields = (item: any) => {
  if (!item) return { 
    filled: [], 
    failed: [], 
    message: 'لا توجد بيانات',
    success: false,
    attempted: 0 
  };
  console.log("بدء ملء النموذج بالبيانات:", item);
  
  // تعريف خريطة الحقول مع تحسين المحددات للمواقع العراقية
  const fieldMappings = [
    {
      key: 'code',
      label: 'رقم الوصل',
      value: item.code || '',
      selectors: [
        // محددات مضافة للمواقع العراقية
        'input[name*="reference"]', 'input[id*="reference"]',
        'input[name*="voucher"]', 'input[id*="voucher"]',
        'input[name*="no"]', 'input[id*="no"]',
        'input[placeholder*="رقم الوصل"]', 'input[placeholder*="رقم البوليصة"]',
        'input[placeholder*="رقم الشحنة"]', 'input[placeholder*="رقم الطلب"]',
        'input[placeholder*="الرمز"]', 'input[placeholder*="الكود"]',
        'input[name*="code"]', 'input[id*="code"]',
        'input[name*="order"]', 'input[id*="order"]',
        'input[name*="tracking"]', 'input[id*="tracking"]',
        'input[name="bill_number"]', 'input[id="bill_number"]',
        'input[name="shipment_number"]', 'input[id="shipment_number"]',
        // دعم إضافي للأنماط العراقية
        'input[name*="wasl"]', 'input[id*="wasl"]',
        'input[placeholder*="الواصل"]'
      ]
    },
    {
      key: 'phoneNumber',
      label: 'رقم الهاتف',
      value: formatIraqiPhoneNumber(item.phoneNumber),
      selectors: [
        // محددات محسنة لأرقام الهواتف العراقية
        'input[name*="phone"]', 'input[id*="phone"]',
        'input[type="tel"]',
        'input[placeholder*="رقم الهاتف"]', 'input[placeholder*="هاتف الزبون"]',
        'input[placeholder*="رقم الزبون"]', 'input[placeholder*="موبايل"]',
        'input[placeholder*="جوال"]',
        'input[name*="mobile"]', 'input[id*="mobile"]',
        'input[placeholder*="تليفون"]',
        'input[name*="tel"]', 'input[id*="tel"]',
        'input[name="client_phone"]', 'input[id="client_phone"]',
        'input[name="customer_mobile"]', 'input[id="customer_mobile"]'
      ]
    },
    {
      key: 'senderName',
      label: 'اسم المرسل',
      value: item.senderName || item.customerName || '',
      selectors: [
        // محددات محسنة لأسماء العملاء في المواقع العراقية
        'input[name*="sender"]', 'input[name*="customer"]',
        'input[id*="sender"]', 'input[id*="customer"]',
        'input[placeholder*="اسم المرسل"]', 'input[placeholder*="اسم العميل"]',
        'input[placeholder*="الزبون"]', 'input[placeholder*="المرسل"]',
        'input[name*="client"]', 'input[id*="client"]',
        'input[name="name"]', 'input[id="client_name"]',
        'input[name="client_name"]',
        'select[name="client_id"]', 'select[id="client_id"]',
        // دعم إضافي للمواقع العراقية
        'input[name*="zabon"]', 'input[id*="zabon"]',
        'input[name*="ameel"]', 'input[id*="ameel"]',
        'select[name*="zabon"]', 'select[id*="zabon"]',
        'select[name*="ameel"]', 'select[id*="ameel"]',
        'select[name*="customer"]', 'select[id*="customer"]',
        'select[name*="client"]', 'select[id*="client"]'
      ]
    },
    {
      key: 'province',
      label: 'المحافظة',
      value: item.province || item.area || '',
      selectors: [
        // محددات محسنة للمحافظات العراقية
        'select[name*="province"]', 'select[id*="province"]',
        'select[name*="city"]', 'select[id*="city"]',
        'select[placeholder*="المحافظة"]', 'select[placeholder*="المدينة"]',
        'select[name*="governorate"]', 'select[id*="governorate"]',
        'select[name*="area"]', 'select[id*="area"]',
        'select[placeholder*="منطقة"]',
        'select[name="destination"]', 'select[id="destination"]',
        'input[name*="province"]', 'input[id*="province"]',
        'input[placeholder*="المحافظة"]',
        'input[name="city"]', 'input[id="city"]',
        // دعم إضافي للمواقع العراقية
        'select[name*="muhafaza"]', 'select[id*="muhafaza"]',
        'select[name*="mouhafaza"]', 'select[id*="mouhafaza"]',
        'select[placeholder*="المنطقة"]', 'select[placeholder*="إلى"]'
      ]
    },
    {
      key: 'price',
      label: 'المبلغ',
      value: formatPrice(item.price),
      selectors: [
        // محددات محسنة للمبالغ في المواقع العراقية
        'input[name*="price"]', 'input[name*="amount"]',
        'input[id*="price"]', 'input[id*="amount"]',
        'input[placeholder*="المبلغ"]', 'input[placeholder*="المبلغ الكلي"]',
        'input[placeholder*="السعر"]', 'input[type="number"]',
        'input[name*="total"]', 'input[id*="total"]',
        'input[name*="cost"]', 'input[id*="cost"]',
        'input[placeholder*="التكلفة"]',
        'input[name="total_amount"]', 'input[id="total_amount"]',
        'input[name="cod_amount"]', 'input[id="cod_amount"]',
        'input[name="grand_total"]', 'input[id="grand_total"]',
        // دعم إضافي للمواقع العراقية
        'input[name*="mablagh"]', 'input[id*="mablagh"]',
        'input[placeholder*="المبلغ بالدينار"]', 'input[placeholder*="سعر"]',
        'input[placeholder*="قيمة"]'
      ]
    },
    {
      key: 'delegateName',
      label: 'اسم المندوب',
      value: item.delegateName || '',
      selectors: [
        'select[name*="delegate"]', 'select[id*="delegate"]',
        'select[name*="agent"]', 'select[id*="agent"]',
        'select[placeholder*="المندوب"]', 'select[placeholder*="الموظف"]',
        'select[name="employee_id"]', 'select[id="employee_id"]',
        'select[name="driver_id"]', 'select[id="driver_id"]',
        // دعم إضافي للمواقع العراقية
        'select[name*="mandoob"]', 'select[id*="mandoob"]',
        'select[name*="delivery_man"]', 'select[id*="delivery_man"]',
        'select[name*="delivery_guy"]', 'select[id*="delivery_guy"]',
        'select[placeholder*="السائق"]'
      ]
    }
  ];
  
  // تتبع الحقول المملوءة والفاشلة
  const results = {
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
    frames.forEach((frame) => {
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
  fieldMappings.forEach((mapping) => {
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
            const firstElement = elements[0];
            console.log(`[تشخيص البوكماركلت] وجدت عنصر للحقل ${mapping.key} باستخدام المحدد ${selector}`);
            
            // معلومات إضافية حول العنصر
            if ((firstElement as HTMLInputElement).name) 
              console.log(`[تشخيص البوكماركلت] اسم العنصر: ${(firstElement as HTMLInputElement).name}`);
            if (firstElement.id) 
              console.log(`[تشخيص البوكماركلت] معرّف العنصر: ${firstElement.id}`);
            if ((firstElement as HTMLInputElement).type) 
              console.log(`[تشخيص البوكماركلت] نوع العنصر: ${(firstElement as HTMLInputElement).type}`);
            
            // محاولة ملء الحقل
            const filledStatus = fillSingleField(firstElement as HTMLElement, mapping, results);
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

export default fillFormFields;
