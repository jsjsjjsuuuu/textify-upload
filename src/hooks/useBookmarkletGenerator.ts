
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";

export const useBookmarkletGenerator = (
  imageData: ImageData | null,
  multipleImages: ImageData[] = [],
  isMultiMode = false,
  isOpen = false
) => {
  const [bookmarkletUrl, setBookmarkletUrl] = useState<string>("");
  const [bookmarkletCode, setBookmarkletCode] = useState<string>("");
  const [rawDataObject, setRawDataObject] = useState<any>({});

  // إعادة توليد كود الـ bookmarklet عند تغيير البيانات أو حالة المشاهدة
  useEffect(() => {
    if (isOpen) {
      const { url, code, dataObject } = generateBookmarklet(imageData, multipleImages, isMultiMode);
      setBookmarkletUrl(url);
      setBookmarkletCode(code);
      setRawDataObject(dataObject);
    }
  }, [imageData, multipleImages, isMultiMode, isOpen]);

  return { bookmarkletUrl, bookmarkletCode, rawDataObject };
};

// دالة لتوليد Bookmarklet URL وكود JavaScript
const generateBookmarklet = (
  imageData: ImageData | null,
  multipleImages: ImageData[] = [],
  isMultiMode = false
) => {
  try {
    // تجهيز البيانات للإدخال التلقائي
    let dataObject: any = {};
    
    // وضع البيانات في كائن يمكن استخدامه بسهولة في سكريبت الإدخال التلقائي
    if (isMultiMode && multipleImages.length > 0) {
      dataObject = {
        multiple: true,
        items: multipleImages.map(img => ({
          companyName: img.companyName || "",
          code: img.code || "",
          senderName: img.senderName || "",
          phoneNumber: img.phoneNumber || "",
          province: img.province || "",
          price: img.price || "",
        }))
      };
    } else if (imageData) {
      dataObject = {
        companyName: imageData.companyName || "",
        code: imageData.code || "",
        senderName: imageData.senderName || "",
        phoneNumber: imageData.phoneNumber || "",
        province: imageData.province || "",
        price: imageData.price || "",
      };
    }
    
    console.log("بيانات الإدخال التلقائي:", dataObject);
    
    // تكوين كود JavaScript محسن ومقاوم للموانع على المواقع
    const jsCode = `
      (function() {
        // تحديد محتوى السكريبت
        const scriptContent = function() {
          // تعريف البيانات داخل نطاق محمي
          let data = ${JSON.stringify(dataObject)};
          console.log("بيانات الإدخال التلقائي:", data);
          
          // التحقق من أن الصفحة الحالية ليست صفحة فارغة
          if (document.location.href === 'about:blank' || document.documentElement.innerHTML.trim() === '') {
            alert('يرجى فتح الموقع المستهدف أولاً ثم استخدام الإدخال التلقائي');
            return;
          }
          
          // وظيفة تأخير للتأكد من تحميل الصفحة بالكامل
          function waitForPageLoad(callback, maxAttempts = 10) {
            let attempts = 0;
            
            function checkReadyState() {
              attempts++;
              if (document.readyState === 'complete' || attempts > maxAttempts) {
                callback();
              } else {
                setTimeout(checkReadyState, 300);
              }
            }
            
            checkReadyState();
          }
          
          // وظائف مساعدة للعثور على الحقول وملئها
          function fillField(selectors, value) {
            if (!value) return false;
            
            // التأكد من أن selectors هو مصفوفة
            const allSelectors = (typeof selectors === 'string') ? [selectors] : selectors;
            
            // البحث عن حقول الإدخال باستخدام مجموعة موسعة من المحددات
            for (const selector of allSelectors) {
              // محاولة باستخدام querySelector أولاً
              let elements = [];
              try {
                elements = [...document.querySelectorAll(selector)];
              } catch (e) {
                console.warn("محدد غير صالح:", selector);
                continue;
              }
              
              // إذا لم نجد عناصر، نحاول البحث بطرق أخرى
              if (elements.length === 0) {
                // البحث عن العناصر باستخدام الاسم أو النص الوصفي أو معرف العنصر
                elements = [...document.querySelectorAll('input, textarea, select, [contenteditable="true"]')]
                  .filter(el => {
                    // البحث في النصوص المرتبطة بالعنصر
                    const labels = document.querySelectorAll('label[for="' + el.id + '"]');
                    let labelText = '';
                    if (labels.length) {
                      labelText = labels[0].textContent || '';
                    }
                    
                    // استخراج النص المحيط بالعنصر
                    let surroundingText = '';
                    if (el.parentElement) {
                      surroundingText = el.parentElement.textContent || '';
                    }
                    
                    // التحقق من عدة خصائص للعنصر
                    return (
                      // فحص النص الوصفي
                      (el.placeholder && (
                        el.placeholder.includes(selector) || 
                        selector.includes(el.placeholder) ||
                        el.placeholder.toLowerCase().includes(selector.toLowerCase()) ||
                        selector.toLowerCase().includes(el.placeholder.toLowerCase())
                      )) ||
                      // فحص الاسم
                      (el.name && (
                        el.name.includes(selector) || 
                        selector.includes(el.name) ||
                        el.name.toLowerCase().includes(selector.toLowerCase()) ||
                        selector.toLowerCase().includes(el.name.toLowerCase())
                      )) ||
                      // فحص المعرف
                      (el.id && (
                        el.id.includes(selector) || 
                        selector.includes(el.id) ||
                        el.id.toLowerCase().includes(selector.toLowerCase()) ||
                        selector.toLowerCase().includes(el.id.toLowerCase())
                      )) ||
                      // فحص الكلاس
                      (el.className && (
                        el.className.includes(selector) || 
                        selector.includes(el.className) ||
                        el.className.toLowerCase().includes(selector.toLowerCase()) ||
                        selector.toLowerCase().includes(el.className.toLowerCase())
                      )) ||
                      // فحص نص التسمية
                      (labelText && (
                        labelText.includes(selector) || 
                        selector.includes(labelText) ||
                        labelText.toLowerCase().includes(selector.toLowerCase()) ||
                        selector.toLowerCase().includes(labelText.toLowerCase())
                      )) ||
                      // فحص النص المحيط
                      (surroundingText && (
                        surroundingText.includes(selector) ||
                        selector.includes(surroundingText) ||
                        surroundingText.toLowerCase().includes(selector.toLowerCase()) ||
                        selector.toLowerCase().includes(surroundingText.toLowerCase())
                      ))
                    );
                  });
              }
              
              // فحص خاص للـ React والـ Angular وإطارات العمل الحديثة
              if (elements.length === 0) {
                elements = [...document.querySelectorAll('[data-input-type], [data-test], [data-testid], [data-cy], [data-e2e]')]
                  .filter(el => {
                    const dataAttributes = [
                      el.getAttribute('data-input-type'),
                      el.getAttribute('data-test'),
                      el.getAttribute('data-testid'),
                      el.getAttribute('data-cy'),
                      el.getAttribute('data-e2e')
                    ].filter(Boolean);
                    
                    return dataAttributes.some(attr => 
                      attr && (
                        attr.includes(selector) || 
                        selector.includes(attr) ||
                        attr.toLowerCase().includes(selector.toLowerCase()) ||
                        selector.toLowerCase().includes(attr.toLowerCase())
                      )
                    );
                  });
              }
              
              // بعد العثور على العناصر المرشحة، نحاول ملء القيمة في أول عنصر
              if (elements.length > 0) {
                const element = elements[0];
                console.log("تم العثور على عنصر لملء القيمة:", element);
                
                // التعامل مع العناصر المختلفة بشكل مناسب
                if (element.tagName === 'SELECT') {
                  // للقوائم المنسدلة، البحث عن الخيار المناسب
                  const options = [...element.options];
                  
                  // محاولة العثور على خيار مطابق للقيمة
                  const option = options.find(opt => {
                    const optText = (opt.text || '').toLowerCase();
                    const optValue = (opt.value || '').toLowerCase();
                    const valueToCheck = value.toString().toLowerCase();
                    
                    return (
                      optText.includes(valueToCheck) || 
                      valueToCheck.includes(optText) || 
                      optValue.includes(valueToCheck) || 
                      valueToCheck.includes(optValue)
                    );
                  });
                  
                  if (option) {
                    console.log("تم العثور على خيار مناسب:", option.text);
                    try {
                      // طريقة 1: التعيين المباشر
                      element.value = option.value;
                      // إطلاق حدث التغيير لتحديث النموذج
                      element.dispatchEvent(new Event('change', { bubbles: true }));
                      
                      // طريقة 2: محاكاة النقر على الخيار (للإطارات المعقدة)
                      try {
                        option.selected = true;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                      } catch (e) {
                        console.warn("فشل تحديد الخيار برمجياً:", e);
                      }
                      
                      return true;
                    } catch (e) {
                      console.warn("فشل ملء القائمة المنسدلة:", e);
                    }
                  }
                } else if (element.hasAttribute('contenteditable')) {
                  // للعناصر القابلة للتحرير
                  try {
                    element.innerHTML = value;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    return true;
                  } catch (e) {
                    console.warn("فشل ملء العنصر القابل للتحرير:", e);
                  }
                } else {
                  // للحقول النصية والمناطق النصية
                  console.log("ملء حقل نصي بالقيمة:", value);
                  try {
                    // طريقة 1: تعيين القيمة مباشرة
                    element.value = value;
                    
                    // إطلاق أحداث الإدخال والتغيير
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // طريقة 2: محاكاة الكتابة الفعلية (للإطارات المعقدة)
                    try {
                      // محاولة تحديث حالة React إذا كانت موجودة
                      const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                      if (nativeValueSetter) {
                        nativeValueSetter.call(element, value);
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    } catch (e) {
                      console.warn("فشل محاولة تحديث قيمة العنصر باستخدام setter:", e);
                    }
                    
                    // طريقة 3: محاكاة التركيز على الحقل
                    try {
                      element.focus();
                      element.dispatchEvent(new Event('focus', { bubbles: true }));
                      element.dispatchEvent(new Event('input', { bubbles: true }));
                      element.blur();
                      element.dispatchEvent(new Event('blur', { bubbles: true }));
                    } catch (e) {
                      console.warn("فشل محاكاة التركيز:", e);
                    }
                    
                    return true;
                  } catch (e) {
                    console.warn("فشل ملء الحقل النصي:", e);
                  }
                }
              }
            }
            
            return false;
          }
          
          // إعداد عنصر التحكم للوضع المتعدد
          let currentIndex = 0;
          let controlsContainer = null;
          
          // تحميل البيانات المحفوظة (إن وجدت)
          function loadData() {
            try {
              const savedData = localStorage.getItem('autofillData');
              if (savedData) {
                let parsedData = JSON.parse(savedData);
                console.log("تم تحميل البيانات المحفوظة:", parsedData);
                return parsedData;
              }
            } catch (e) {
              console.warn('فشل تحميل البيانات المحفوظة:', e);
            }
            return data;
          }
          
          // الوظيفة الرئيسية لملء البيانات
          function autoFillFields() {
            // مهم: تحميل البيانات من التخزين المحلي أو استخدام الموجودة في السكريبت
            const currentData = loadData();
            console.log("البيانات الحالية للملء:", currentData);
            
            if (currentData.multiple && Array.isArray(currentData.items) && currentData.items.length > 0) {
              // إنشاء شريط تحكم للتنقل بين البيانات المتعددة
              if (!controlsContainer) {
                controlsContainer = document.createElement('div');
                controlsContainer.style.position = 'fixed';
                controlsContainer.style.bottom = '10px';
                controlsContainer.style.right = '10px';
                controlsContainer.style.padding = '10px';
                controlsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                controlsContainer.style.border = '1px solid #ccc';
                controlsContainer.style.borderRadius = '5px';
                controlsContainer.style.zIndex = '9999';
                controlsContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                controlsContainer.style.direction = 'rtl';
                
                controlsContainer.innerHTML = \`
                  <div style="display:flex; align-items:center">
                    <button id="autofill-prev" style="margin-left: 5px; padding: 5px 10px; cursor: pointer">السابق</button>
                    <span id="autofill-counter">1 / \${currentData.items.length}</span>
                    <button id="autofill-next" style="margin-right: 5px; padding: 5px 10px; cursor: pointer">التالي</button>
                    <button id="autofill-close" style="margin-right: 10px; padding: 2px 8px; cursor: pointer">X</button>
                  </div>
                \`;
                
                document.body.appendChild(controlsContainer);
                
                // إضافة مستمعي الأحداث
                document.getElementById('autofill-next')?.addEventListener('click', () => {
                  if (currentIndex < currentData.items.length - 1) {
                    currentIndex++;
                    fillCurrentItem();
                    updateCounter();
                  }
                });
                
                document.getElementById('autofill-prev')?.addEventListener('click', () => {
                  if (currentIndex > 0) {
                    currentIndex--;
                    fillCurrentItem();
                    updateCounter();
                  }
                });
                
                document.getElementById('autofill-close')?.addEventListener('click', () => {
                  controlsContainer?.remove();
                });
              }
              
              function updateCounter() {
                const counter = document.getElementById('autofill-counter');
                if (counter) {
                  counter.textContent = \`\${currentIndex + 1} / \${currentData.items.length}\`;
                }
              }
              
              function fillCurrentItem() {
                const item = currentData.items[currentIndex];
                performFill(item);
              }
              
              // ملء العنصر الأول تلقائياً
              fillCurrentItem();
            } else {
              // في حالة البيانات الفردية
              performFill(currentData);
            }
          }
          
          // وظيفة ملء البيانات محسنة
          function performFill(dataItem) {
            // محاولة ملء البيانات باستخدام عدة استراتيجيات
            let filledFields = 0;
            console.log("محاولة ملء البيانات:", dataItem);
            
            // محددات حقول مختلفة لتغطية أكبر عدد من المواقع
            const fieldSelectors = {
              companyName: [
                'input[name*="company"], input[placeholder*="شركة"], input[id*="company"], input[name*="COMPANY"]',
                'شركة', 'الشركة', 'company', 'COMPANY', 'الجهة', 'جهة', 'المؤسسة',
                'اسم الشركة', 'اسم شركة', 'اسم المؤسسة', 'اسم مؤسسة'
              ],
              code: [
                'input[name*="code"], input[placeholder*="كود"], input[id*="code"], input[name*="CODE"]',
                'كود', 'رمز', 'code', 'CODE', 'رقم الطلب', 'رقم الفاتورة', 'رقم البضاعة', 'رقم',
                'رقم الشحنة', 'معرف', 'id', 'ID', 'tracking', 'track', 'رقم التتبع'
              ],
              senderName: [
                'input[name*="name"], input[placeholder*="اسم"], input[id*="name"], input[name*="NAME"], input[name*="sender"]',
                'الاسم', 'اسم', 'اسم المرسل', 'sender', 'SENDER', 'customer', 'المرسل', 'العميل', 'الزبون', 'name',
                'اسم الزبون', 'اسم العميل', 'اسم الارسال', 'الراسل', 'اسم الراسل'
              ],
              phoneNumber: [
                'input[name*="phone"], input[placeholder*="هاتف"], input[id*="phone"], input[type="tel"], input[name*="PHONE"], input[name*="TEL"]',
                'هاتف', 'رقم الهاتف', 'phone', 'تليفون', 'موبايل', 'جوال', 'الهاتف', 'الجوال', 'mobile', 'MOBILE', 'PHONE',
                'tel', 'رقم الموبايل', 'رقم الجوال', 'رقم المستلم', 'هاتف المستلم'
              ],
              province: [
                'select[name*="province"], select[id*="province"], select[name*="city"], select[id*="city"], select[name*="region"], select[id*="region"]',
                'input[name*="province"], input[id*="province"], input[name*="city"], input[id*="city"]',
                'المحافظة', 'محافظة', 'city', 'province', 'region', 'المدينة', 'مدينة', 'المنطقة', 'منطقة',
                'عنوان', 'موقع', 'الموقع', 'المحافظات', 'address', 'location'
              ],
              price: [
                'input[name*="price"], input[placeholder*="سعر"], input[id*="price"], input[name*="amount"], input[name*="PRICE"]',
                'السعر', 'المبلغ', 'price', 'amount', 'cost', 'المبلغ', 'القيمة', 'سعر', 'الكلفة', 'التكلفة',
                'قيمة', 'السعر', 'المبلغ الكلي', 'التكلفة الكلية', 'سعر المنتج'
              ]
            };
            
            // محاولة ملء كل حقل من البيانات
            for (const [field, selectors] of Object.entries(fieldSelectors)) {
              if (dataItem.hasOwnProperty(field) && dataItem[field]) {
                console.log(\`محاولة ملء الحقل: \${field} بالقيمة: \${dataItem[field]}\`);
                if (fillField(selectors, dataItem[field])) {
                  console.log(\`تم ملء الحقل: \${field} بنجاح\`);
                  filledFields++;
                } else {
                  console.log(\`فشل في ملء الحقل: \${field}\`);
                }
              }
            }
            
            // إظهار إشعار بعدد الحقول التي تم ملؤها
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '10px';
            notification.style.right = '10px';
            notification.style.padding = '10px 15px';
            notification.style.backgroundColor = filledFields > 0 ? '#4CAF50' : '#FF9800';
            notification.style.color = 'white';
            notification.style.fontSize = '14px';
            notification.style.fontWeight = 'bold';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '999999';
            notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
            notification.style.direction = 'rtl';
            
            if (filledFields > 0) {
              notification.textContent = \`✓ تم ملء \${filledFields} من الحقول بنجاح!\`;
            } else {
              notification.textContent = '⚠️ لم يتم العثور على حقول مناسبة للملء. جرب موقعاً آخر.';
            }
            
            document.body.appendChild(notification);
            
            // إخفاء الإشعار بعد 5 ثوانٍ
            setTimeout(() => {
              notification.style.opacity = '0';
              notification.style.transition = 'opacity 0.7s';
              setTimeout(() => notification.remove(), 700);
            }, 5000);
            
            // إرسال نتيجة الملء للنافذة الأم إذا كانت متاحة
            try {
              window.parent.postMessage({
                type: 'AUTOFILL_RESULT',
                success: filledFields > 0,
                filledCount: filledFields
              }, '*');
            } catch (e) {
              console.warn('فشل في إرسال نتيجة الملء للنافذة الأم:', e);
            }
          }
          
          // حفظ الصفحة الحالية لاستخدامها لاحقًا
          try {
            localStorage.setItem('lastAutoFillUrl', document.location.href);
          } catch (e) {
            console.warn('فشل حفظ عنوان URL في التخزين المحلي', e);
          }
          
          // انتظار تحميل الصفحة بالكامل قبل محاولة ملء البيانات
          waitForPageLoad(function() {
            setTimeout(autoFillFields, 500);
          });
        };
        
        // تحويل الوظيفة إلى نص لتنفيذها بأمان
        const scriptText = '(' + scriptContent.toString() + ')();';
        
        // إنشاء عنصر script وإضافته مباشرة إلى الصفحة
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptText;
        document.body.appendChild(scriptElement);
        
        // إزالة العنصر بعد التنفيذ
        setTimeout(() => {
          scriptElement.remove();
        }, 100);
      })();
    `;
    
    // تنظيف الكود وإزالة المسافات الزائدة
    const cleanedCode = jsCode
      .replace(/\s{2,}/g, ' ')
      .replace(/\n/g, ' ')
      .trim();
    
    // تشفير الكود لاستخدامه في الـ bookmarklet URL
    const encodedCode = encodeURIComponent(cleanedCode);
    const bookmarkletUrl = `javascript:${encodedCode}`;
    
    return { url: bookmarkletUrl, code: cleanedCode, dataObject };
  } catch (error) {
    console.error("خطأ في توليد Bookmarklet:", error);
    return { url: "", code: "", dataObject: {} };
  }
};
