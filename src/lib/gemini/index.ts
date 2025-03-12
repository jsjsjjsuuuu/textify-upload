// تصدير الوظائف والأنواع من كافة الملفات الفرعية

// Export main API functions
export { extractDataWithGemini, testGeminiConnection } from "./api";
export { testGeminiModels } from "./models";
export { fileToBase64 } from "./utils";

// Export types
export type { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";

/**
 * وظيفة لإنشاء وتصدير البيانات المستخرجة إلى bookmarklet
 */
export const createBookmarkletCode = (imageData: any) => {
  // تصفية البيانات للأوبجكت المصدر
  const exportData = {
    code: imageData.code || "",
    senderName: imageData.senderName || "",
    phoneNumber: imageData.phoneNumber || "",
    province: imageData.province || "",
    price: imageData.price || "",
    companyName: imageData.companyName || ""
  };

  // إنشاء كود الـ bookmarklet المحسن
  const bookmarkletCode = `
    (function() {
      try {
        // إظهار نافذة تأكيد قبل البدء
        if (!confirm('هل تريد ملء البيانات في هذه الصفحة؟')) {
          return;
        }

        const data = ${JSON.stringify(exportData)};
        console.log('بيانات للملء:', data);

        // العثور على الحقول وملئها مع رسائل تأكيد
        function fillField(selectors, value) {
          if (!value) return false;

          // تحويل السلسلة إلى مصفوفة إذا لم تكن كذلك
          const selectorList = typeof selectors === 'string' ? [selectors] : selectors;
          
          for (const selector of selectorList) {
            // البحث عن الحقول باستخدام مجموعة متنوعة من المحددات
            const elements = [
              ...document.querySelectorAll(\`input[id*="\${selector}"i]\`),
              ...document.querySelectorAll(\`input[name*="\${selector}"i]\`),
              ...document.querySelectorAll(\`input[placeholder*="\${selector}"i]\`),
              ...document.querySelectorAll(\`textarea[id*="\${selector}"i]\`),
              ...document.querySelectorAll(\`textarea[name*="\${selector}"i]\`),
              ...document.querySelectorAll(\`textarea[placeholder*="\${selector}"i]\`),
              ...document.querySelectorAll(\`select[id*="\${selector}"i]\`),
              ...document.querySelectorAll(\`select[name*="\${selector}"i]\`)
            ];

            // البحث عن العناصر من خلال التسميات
            const labels = document.querySelectorAll('label');
            labels.forEach(label => {
              if (label.textContent.toLowerCase().includes(selector.toLowerCase())) {
                const input = document.getElementById(label.htmlFor);
                if (input) elements.push(input);
              }
            });

            for (const element of elements) {
              if (element.disabled || element.readOnly) continue;

              // ملء القيمة
              if (element instanceof HTMLSelectElement) {
                // للقوائم المنسدلة، ابحث عن الخيار الأقرب
                const options = Array.from(element.options);
                const bestMatch = options.find(opt => 
                  opt.text.toLowerCase().includes(value.toLowerCase()) ||
                  value.toLowerCase().includes(opt.text.toLowerCase())
                );
                if (bestMatch) {
                  element.value = bestMatch.value;
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log(\`تم ملء حقل القائمة المنسدلة: \${selector}\`);
                  return true;
                }
              } else {
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(\`تم ملء الحقل: \${selector}\`);
                return true;
              }
            }
          }
          return false;
        }

        // محاولة ملء كل الحقول
        const filled = {
          code: fillField(['code', 'رمز', 'الكود', 'رقم_الطلب', 'orderid', 'ordernumber', 'order-number', 'orderNumber'], data.code),
          name: fillField(['name', 'الاسم', 'sender', 'customer', 'fullname', 'full-name', 'full_name'], data.senderName),
          phone: fillField(['phone', 'هاتف', 'موبايل', 'جوال', 'تليفون', 'mobile', 'tel', 'telephone'], data.phoneNumber),
          province: fillField(['province', 'محافظة', 'المحافظة', 'city', 'مدينة', 'المدينة', 'region', 'area'], data.province),
          price: fillField(['price', 'سعر', 'المبلغ', 'التكلفة', 'amount', 'total', 'cost'], data.price),
          company: fillField(['company', 'شركة', 'vendor', 'supplier', 'provider'], data.companyName)
        };

        // إظهار ملخص للعمليات
        const filledFields = Object.entries(filled).filter(([, success]) => success).length;
        const message = \`تم ملء \${filledFields} حقول من أصل \${Object.keys(filled).length} حقول متاحة.\`;
        alert(message);

      } catch (error) {
        console.error('حدث خطأ:', error);
        alert('حدث خطأ أثناء محاولة ملء البيانات: ' + error.message);
      }
    })();
  `;

  // تنظيف الكود وتحويله إلى bookmarklet
  return bookmarkletCode
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\n\r]/g, '');
};

/**
 * وظيفة لإنشاء وتصدير بيانات متعددة دفعة واحدة
 */
export const createBatchBookmarkletCode = (imagesData: any[]) => {
  // تحويل البيانات إلى مصفوفة منظمة
  const exportDataArray = imagesData.map(imageData => ({
    code: imageData.code || "",
    senderName: imageData.senderName || "",
    phoneNumber: imageData.phoneNumber || "",
    province: imageData.province || "",
    price: imageData.price || "",
    companyName: imageData.companyName || ""
  }));

  // إنشاء كود الـ bookmarklet
  const bookmarkletCode = `
    (function() {
      try {
        // البيانات المستخرجة (مصفوفة من البيانات)
        const dataArray = ${JSON.stringify(exportDataArray)};
        let currentIndex = 0;
        
        // وظيفة البحث عن الحقول وملئها
        function fillFields(data) {
          // أنماط أسماء الحقول المحتملة
          const fieldPatterns = {
            code: ['code', 'الكود', 'رمز', 'رقم'],
            name: ['name', 'الاسم', 'اسم', 'sender'],
            phone: ['phone', 'هاتف', 'رقم الهاتف', 'جوال', 'موبايل'],
            province: ['province', 'محافظة', 'المحافظة', 'city', 'مدينة'],
            price: ['price', 'سعر', 'السعر', 'المبلغ', 'التكلفة'],
            company: ['company', 'شركة', 'اسم الشركة', 'الشركة']
          };
          
          let filledFields = 0;
          // البحث عن الحقول وملئها
          Object.entries(data).forEach(([key, value]) => {
            if (!value) return;
            
            // تحديد نمط البحث المناسب
            let patterns = [];
            if (key === 'code') patterns = fieldPatterns.code;
            else if (key === 'senderName') patterns = fieldPatterns.name;
            else if (key === 'phoneNumber') patterns = fieldPatterns.phone;
            else if (key === 'province') patterns = fieldPatterns.province;
            else if (key === 'price') patterns = fieldPatterns.price;
            else if (key === 'companyName') patterns = fieldPatterns.company;
            
            // البحث عن الحقول المطابقة
            let found = false;
            for (const pattern of patterns) {
              const inputs = [
                ...document.querySelectorAll(\`input[name*="\${pattern}"]\`),
                ...document.querySelectorAll(\`input[id*="\${pattern}"]\`),
                ...document.querySelectorAll(\`input[placeholder*="\${pattern}"]\`),
                ...document.querySelectorAll(\`textarea[name*="\${pattern}"]\`),
                ...document.querySelectorAll(\`textarea[id*="\${pattern}"]\`),
                ...document.querySelectorAll(\`textarea[placeholder*="\${pattern}"]\`)
              ];
              
              if (inputs.length > 0) {
                inputs[0].value = value;
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                found = true;
                filledFields++;
                break;
              }
            }
            
            // إذا لم يتم العثور، ابحث عن التسميات
            if (!found) {
              const allLabels = document.querySelectorAll('label');
              for (const pattern of patterns) {
                for (const label of allLabels) {
                  if (label.textContent.toLowerCase().includes(pattern)) {
                    const inputId = label.getAttribute('for');
                    if (inputId) {
                      const input = document.getElementById(inputId);
                      if (input) {
                        input.value = value;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        found = true;
                        filledFields++;
                        break;
                      }
                    }
                  }
                }
                if (found) break;
              }
            }
          });
          
          return filledFields > 0;
        }
        
        // وظيفة للبحث عن زر الإرسال والضغط عليه
        function findAndClickSubmitButton() {
          const submitPatterns = ['submit', 'إرسال', 'حفظ', 'تأكيد', 'ارسال', 'save', 'ok', 'نشر'];
          
          // البحث عن زر الإرسال
          for (const pattern of submitPatterns) {
            // البحث في أزرار التقديم
            const submitButtons = document.querySelectorAll('input[type="submit"]');
            for (const button of submitButtons) {
              if (button.value.toLowerCase().includes(pattern)) {
                button.click();
                return true;
              }
            }
            
            // البحث في الأزرار العادية
            const buttons = document.querySelectorAll('button');
            for (const button of buttons) {
              if (button.textContent.toLowerCase().includes(pattern)) {
                button.click();
                return true;
              }
            }
            
            // البحث في عناصر a التي تبدو كأزرار
            const links = document.querySelectorAll('a.btn, a.button');
            for (const link of links) {
              if (link.textContent.toLowerCase().includes(pattern)) {
                link.click();
                return true;
              }
            }
          }
          
          return false;
        }
        
        // وظيفة لمعالجة النموذج الحالي والانتقال للتالي
        function processCurrentForm() {
          if (currentIndex >= dataArray.length) {
            alert('تم الانتهاء من معالجة جميع البيانات (' + dataArray.length + ' سجل)');
            return;
          }
          
          const data = dataArray[currentIndex];
          const success = fillFields(data);
          
          if (success) {
            alert('تم ملء البيانات للسجل ' + (currentIndex + 1) + ' من ' + dataArray.length);
            // محاولة النقر على زر الإرسال
            const submitted = findAndClickSubmitButton();
            
            // زيادة المؤشر للعنصر التالي
            currentIndex++;
            
            // إذا تم النقر على زر الإرسال، ننتظر قليلاً قبل محاولة معالجة النموذج التالي
            if (submitted) {
              setTimeout(() => {
                alert('جاري الانتقال للسجل التالي...');
                processCurrentForm();
              }, 2000);
            }
          } else {
            if (confirm('لم يتم العثور على حقول لملئها. هل تريد الانتقال للسجل التالي؟')) {
              currentIndex++;
              processCurrentForm();
            }
          }
        }
        
        // بدء معالجة النماذج
        processCurrentForm();
        
      } catch (error) {
        alert('حدث خطأ: ' + error.message);
      }
    })();
  `;
  
  return bookmarkletCode
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\n\r]/g, '');
};
