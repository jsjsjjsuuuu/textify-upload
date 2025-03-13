
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
    
    // تكوين كود JavaScript محسن يعمل على نطاق أوسع من المواقع
    const jsCode = `
      (function() {
        // حفظ المرجع للنافذة الأصلية
        const data = ${JSON.stringify(dataObject)};
        console.log("بيانات الإدخال التلقائي:", data);
        
        // التحقق من أن الصفحة الحالية ليست صفحة فارغة
        if (document.location.href === 'about:blank' || document.documentElement.innerHTML.trim() === '') {
          alert('يرجى فتح الموقع المستهدف أولاً ثم استخدام الإدخال التلقائي');
          return;
        }
        
        // وظائف مساعدة للعثور على الحقول وملئها
        function fillField(selectors, value) {
          if (!value) return false;
          
          // للتوافق مع أكبر عدد من المواقع، نحاول عدة طرق للعثور على الحقول
          const allSelectors = (typeof selectors === 'string') ? [selectors] : selectors;
          
          for (const selector of allSelectors) {
            // البحث عن جميع العناصر التي تتطابق مع المحددات
            let elements = [];
            try {
              elements = [...document.querySelectorAll(selector)];
            } catch (e) {
              console.warn("محدد غير صالح:", selector);
              continue;
            }
            
            // محاولة أخرى للبحث عن الحقول حسب النوع أو الاسم أو الملصق
            if (elements.length === 0) {
              elements = [...document.querySelectorAll('input, textarea, select')]
                .filter(el => {
                  const labels = document.querySelectorAll('label[for="' + el.id + '"]');
                  if (labels.length && labels[0].textContent && 
                      (labels[0].textContent.includes(selector) || 
                       selector.includes(labels[0].textContent))) {
                    return true;
                  }
                  
                  return el.placeholder && 
                        (el.placeholder.includes(selector) || selector.includes(el.placeholder)) ||
                         el.name && 
                        (el.name.includes(selector) || selector.includes(el.name)) ||
                         el.id && 
                        (el.id.includes(selector) || selector.includes(el.id));
                });
            }
            
            if (elements.length > 0) {
              // ملء أول عنصر وجدناه
              const element = elements[0];
              
              // الإجراء يعتمد على نوع العنصر
              if (element.tagName === 'SELECT') {
                // للقوائم المنسدلة، محاولة العثور على الخيار المناسب
                const options = [...element.options];
                const option = options.find(opt => 
                  opt.text.includes(value) || value.includes(opt.text) || 
                  opt.value.includes(value) || value.includes(opt.value)
                );
                
                if (option) {
                  element.value = option.value;
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  return true;
                }
              } else {
                // للحقول النصية والمناطق النصية
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          }
          
          return false;
        }
        
        // إعداد عنصر التحكم للوضع المتعدد
        let currentIndex = 0;
        let controlsContainer = null;
        
        if (data.multiple && Array.isArray(data.items) && data.items.length > 0) {
          // إنشاء شريط تحكم للتنقل بين البيانات المتعددة
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
              <span id="autofill-counter">1 / \${data.items.length}</span>
              <button id="autofill-next" style="margin-right: 5px; padding: 5px 10px; cursor: pointer">التالي</button>
              <button id="autofill-close" style="margin-right: 10px; padding: 2px 8px; cursor: pointer">X</button>
            </div>
          \`;
          
          document.body.appendChild(controlsContainer);
          
          // إضافة مستمعي الأحداث
          document.getElementById('autofill-next').addEventListener('click', () => {
            if (currentIndex < data.items.length - 1) {
              currentIndex++;
              fillCurrentItem();
              updateCounter();
            }
          });
          
          document.getElementById('autofill-prev').addEventListener('click', () => {
            if (currentIndex > 0) {
              currentIndex--;
              fillCurrentItem();
              updateCounter();
            }
          });
          
          document.getElementById('autofill-close').addEventListener('click', () => {
            controlsContainer.remove();
          });
          
          function updateCounter() {
            document.getElementById('autofill-counter').textContent = \`\${currentIndex + 1} / \${data.items.length}\`;
          }
          
          function fillCurrentItem() {
            const item = data.items[currentIndex];
            performFill(item);
          }
          
          // ملء العنصر الأول تلقائياً
          fillCurrentItem();
        } else {
          // في حالة البيانات الفردية
          performFill(data);
        }
        
        // وظيفة ملء البيانات
        function performFill(dataItem) {
          // محاولة ملء البيانات باستخدام عدة استراتيجيات
          let filledFields = 0;
          
          // محاولة ملء حقول متعددة باستخدام محددات مختلفة
          if (dataItem.hasOwnProperty("companyName") && dataItem.companyName) {
            if (fillField(['input[name*="company"], input[placeholder*="شركة"], input[id*="company"]', 'الشركة', 'شركة', 'company'], dataItem.companyName)) 
              filledFields++;
          }
          
          if (dataItem.hasOwnProperty("code") && dataItem.code) {
            if (fillField(['input[name*="code"], input[placeholder*="كود"], input[id*="code"]', 'كود', 'رمز', 'code', 'رقم الطلب'], dataItem.code))
              filledFields++;
          }
          
          if (dataItem.hasOwnProperty("senderName") && dataItem.senderName) {
            if (fillField(['input[name*="name"], input[placeholder*="اسم"], input[id*="name"]', 'الاسم', 'اسم المرسل', 'sender', 'customer'], dataItem.senderName))
              filledFields++;
          }
          
          if (dataItem.hasOwnProperty("phoneNumber") && dataItem.phoneNumber) {
            if (fillField(['input[name*="phone"], input[placeholder*="هاتف"], input[id*="phone"], input[type="tel"]', 'هاتف', 'رقم الهاتف', 'phone', 'mobile', 'تليفون', 'جوال'], dataItem.phoneNumber))
              filledFields++;
          }
          
          if (dataItem.hasOwnProperty("province") && dataItem.province) {
            if (fillField(['select[name*="province"], select[id*="province"]', 'input[name*="province"], input[id*="province"]', 'المحافظة', 'محافظة', 'city', 'province', 'region'], dataItem.province))
              filledFields++;
          }
          
          if (dataItem.hasOwnProperty("price") && dataItem.price) {
            if (fillField(['input[name*="price"], input[placeholder*="سعر"], input[id*="price"]', 'السعر', 'المبلغ', 'price', 'amount', 'cost'], dataItem.price))
              filledFields++;
          }
          
          // إظهار إشعار بعدد الحقول التي تم ملؤها
          const notification = document.createElement('div');
          notification.style.position = 'fixed';
          notification.style.top = '10px';
          notification.style.right = '10px';
          notification.style.padding = '10px';
          notification.style.backgroundColor = filledFields > 0 ? '#4CAF50' : '#FF9800';
          notification.style.color = 'white';
          notification.style.borderRadius = '5px';
          notification.style.zIndex = '9999';
          notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
          notification.style.direction = 'rtl';
          
          if (filledFields > 0) {
            notification.textContent = \`تم ملء \${filledFields} حقل بنجاح\`;
          } else {
            notification.textContent = 'لم يتم العثور على حقول مناسبة للملء. جرب موقعًا آخر أو املأ البيانات يدويًا.';
          }
          
          document.body.appendChild(notification);
          
          // إخفاء الإشعار بعد 3 ثوانٍ
          setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
          }, 3000);
        }
        
        // حفظ الصفحة الحالية لاستخدامها لاحقًا
        try {
          localStorage.setItem('lastAutoFillUrl', document.location.href);
        } catch (e) {
          console.warn('فشل حفظ عنوان URL في التخزين المحلي', e);
        }
      })();
    `;
    
    // تنظيف الكود وإزالة المسافات الزائدة
    const cleanedCode = jsCode
      .replace(/\s{2,}/g, ' ')
      .replace(/\n/g, '')
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
