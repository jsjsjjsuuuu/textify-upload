
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

  // إنشاء كود الـ bookmarklet المحسن - تم تحسينه ليظهر رسائل واضحة وليعمل بشكل أفضل
  const bookmarkletCode = `
    javascript:(function() {
      try {
        // عرض رسالة تأكيد للبدء
        if (!window.confirm('هل تريد ملء البيانات في هذه الصفحة؟')) {
          return;
        }

        // البيانات المستخرجة
        const data = ${JSON.stringify(exportData)};
        console.log('بيانات الملء:', data);
        
        // إنشاء عنصر div للإشعارات
        const createNotification = (message, isSuccess = true) => {
          const notif = document.createElement('div');
          notif.style.position = 'fixed';
          notif.style.top = '10px';
          notif.style.right = '10px';
          notif.style.zIndex = '9999';
          notif.style.padding = '10px 15px';
          notif.style.borderRadius = '4px';
          notif.style.color = '#fff';
          notif.style.backgroundColor = isSuccess ? '#4caf50' : '#f44336';
          notif.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          notif.style.transition = 'opacity 0.3s';
          notif.style.opacity = '0';
          notif.style.direction = 'rtl';
          notif.textContent = message;
          document.body.appendChild(notif);
          
          // إظهار الإشعار
          setTimeout(() => { notif.style.opacity = '1'; }, 10);
          
          // إخفاء الإشعار بعد 3 ثوان
          setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => {
              document.body.removeChild(notif);
            }, 300);
          }, 3000);
        };

        // البحث عن الحقول وملئها
        const fillField = (selectors, value) => {
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
            
            // البحث عن العناصر من خلال التسميات (labels)
            const labels = document.querySelectorAll('label');
            labels.forEach(label => {
              if (label.textContent.toLowerCase().includes(selector.toLowerCase())) {
                const forAttr = label.getAttribute('for');
                if (forAttr) {
                  const input = document.getElementById(forAttr);
                  if (input) elements.push(input);
                } else {
                  // البحث في العناصر الفرعية للتسمية
                  const inputs = label.querySelectorAll('input, textarea, select');
                  inputs.forEach(input => elements.push(input));
                }
              }
            });
            
            // البحث في العناصر الفرعية للنماذج (forms)
            const formGroups = document.querySelectorAll('.form-group, .input-group, .field');
            formGroups.forEach(group => {
              if (group.textContent.toLowerCase().includes(selector.toLowerCase())) {
                const inputs = group.querySelectorAll('input, textarea, select');
                inputs.forEach(input => elements.push(input));
              }
            });

            // محاولة ملء أول عنصر صالح
            for (const element of elements) {
              if (element.disabled || element.readOnly) continue;
              
              // ملء القيمة
              if (element instanceof HTMLSelectElement) {
                // للقوائم المنسدلة، ابحث عن الخيار المناسب
                let optionFound = false;
                const options = Array.from(element.options);
                
                // محاولة العثور على تطابق دقيق
                for (const option of options) {
                  if (option.text.toLowerCase().includes(value.toLowerCase()) || 
                      option.value.toLowerCase().includes(value.toLowerCase())) {
                    element.value = option.value;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(\`تم ملء القائمة المنسدلة: \${selector} بالقيمة: \${value}\`);
                    optionFound = true;
                    return true;
                  }
                }
                
                // إذا لم يتم العثور على تطابق، اختر الخيار المتاح الأول (إذا كان هناك خيارات)
                if (!optionFound && options.length > 0 && value) {
                  element.selectedIndex = 1; // عادة ما يكون الخيار الأول هو "اختر"
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log(\`تم تحديد خيار في القائمة المنسدلة: \${selector}\`);
                  return true;
                }
              } else {
                element.value = value;
                // إطلاق أحداث لتنبيه أي مستمعين للأحداث
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(\`تم ملء الحقل: \${selector} بالقيمة: \${value}\`);
                return true;
              }
            }
          }
          return false;
        };

        // محاولة ملء كل الحقول
        const filled = {
          code: fillField(['code', 'رمز', 'الكود', 'رقم_الطلب', 'orderid', 'ordernumber', 'order-number', 'orderNumber', 'tracking'], data.code),
          name: fillField(['name', 'الاسم', 'sender', 'customer', 'fullname', 'full-name', 'full_name', 'اسم_المرسل', 'اسم'], data.senderName),
          phone: fillField(['phone', 'هاتف', 'موبايل', 'جوال', 'تليفون', 'mobile', 'tel', 'telephone', 'رقم_الهاتف', 'رقم'], data.phoneNumber),
          province: fillField(['province', 'محافظة', 'المحافظة', 'city', 'مدينة', 'المدينة', 'region', 'area', 'state'], data.province),
          price: fillField(['price', 'سعر', 'المبلغ', 'التكلفة', 'amount', 'total', 'cost', 'المبلغ', 'السعر'], data.price),
          company: fillField(['company', 'شركة', 'vendor', 'supplier', 'provider', 'اسم_الشركة', 'الشركة'], data.companyName)
        };

        // التحقق من النتائج
        const filledFields = Object.values(filled).filter(Boolean).length;
        const totalFields = Object.keys(filled).length;
        
        if (filledFields > 0) {
          createNotification(\`تم ملء \${filledFields} حقول من أصل \${totalFields}\`, true);
        } else {
          createNotification('لم يتم العثور على حقول مطابقة لملئها', false);
        }

      } catch (error) {
        console.error('حدث خطأ:', error);
        alert('حدث خطأ أثناء محاولة ملء البيانات: ' + error.message);
      }
    })();
  `;

  // تنظيف الكود وإرجاعه
  return bookmarkletCode.trim().replace(/\\s+/g, ' ');
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

  // إنشاء كود الـ bookmarklet المحسن للبيانات المتعددة
  const bookmarkletCode = `
    javascript:(function() {
      try {
        // عرض رسالة تأكيد للبدء
        if (!window.confirm('هل تريد استخدام أداة ملء البيانات المتعددة؟')) {
          return;
        }

        // البيانات المستخرجة
        const dataArray = ${JSON.stringify(exportDataArray)};
        console.log('تم تحميل', dataArray.length, 'مجموعة من البيانات');
        
        // متغيرات عامة
        let currentIndex = 0;
        let panel;
        
        // إنشاء عنصر div للإشعارات
        const createNotification = (message, isSuccess = true) => {
          const notif = document.createElement('div');
          notif.style.position = 'fixed';
          notif.style.top = '10px';
          notif.style.left = '10px';
          notif.style.zIndex = '9999';
          notif.style.padding = '10px 15px';
          notif.style.borderRadius = '4px';
          notif.style.color = '#fff';
          notif.style.backgroundColor = isSuccess ? '#4caf50' : '#f44336';
          notif.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          notif.style.transition = 'opacity 0.3s';
          notif.style.opacity = '0';
          notif.style.direction = 'rtl';
          notif.textContent = message;
          document.body.appendChild(notif);
          
          // إظهار الإشعار
          setTimeout(() => { notif.style.opacity = '1'; }, 10);
          
          // إخفاء الإشعار بعد 3 ثوان
          setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => {
              document.body.removeChild(notif);
            }, 300);
          }, 3000);
        };
        
        // البحث عن الحقول وملئها
        const fillField = (selectors, value) => {
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
            
            // البحث عن العناصر من خلال التسميات (labels)
            const labels = document.querySelectorAll('label');
            labels.forEach(label => {
              if (label.textContent.toLowerCase().includes(selector.toLowerCase())) {
                const forAttr = label.getAttribute('for');
                if (forAttr) {
                  const input = document.getElementById(forAttr);
                  if (input) elements.push(input);
                } else {
                  // البحث في العناصر الفرعية للتسمية
                  const inputs = label.querySelectorAll('input, textarea, select');
                  inputs.forEach(input => elements.push(input));
                }
              }
            });
            
            // البحث في العناصر الفرعية للنماذج (forms)
            const formGroups = document.querySelectorAll('.form-group, .input-group, .field');
            formGroups.forEach(group => {
              if (group.textContent.toLowerCase().includes(selector.toLowerCase())) {
                const inputs = group.querySelectorAll('input, textarea, select');
                inputs.forEach(input => elements.push(input));
              }
            });

            // محاولة ملء أول عنصر صالح
            for (const element of elements) {
              if (element.disabled || element.readOnly) continue;
              
              // ملء القيمة
              if (element instanceof HTMLSelectElement) {
                // للقوائم المنسدلة، ابحث عن الخيار المناسب
                let optionFound = false;
                const options = Array.from(element.options);
                
                // محاولة العثور على تطابق دقيق
                for (const option of options) {
                  if (option.text.toLowerCase().includes(value.toLowerCase()) || 
                      option.value.toLowerCase().includes(value.toLowerCase())) {
                    element.value = option.value;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(\`تم ملء القائمة المنسدلة: \${selector} بالقيمة: \${value}\`);
                    optionFound = true;
                    return true;
                  }
                }
                
                // إذا لم يتم العثور على تطابق، اختر الخيار المتاح الأول (إذا كان هناك خيارات)
                if (!optionFound && options.length > 0 && value) {
                  element.selectedIndex = 1; // عادة ما يكون الخيار الأول هو "اختر"
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log(\`تم تحديد خيار في القائمة المنسدلة: \${selector}\`);
                  return true;
                }
              } else {
                element.value = value;
                // إطلاق أحداث لتنبيه أي مستمعين للأحداث
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(\`تم ملء الحقل: \${selector} بالقيمة: \${value}\`);
                return true;
              }
            }
          }
          return false;
        };
        
        // ملء البيانات الحالية
        const fillCurrentData = () => {
          const data = dataArray[currentIndex];
          
          // محاولة ملء كل الحقول
          const filled = {
            code: fillField(['code', 'رمز', 'الكود', 'رقم_الطلب', 'orderid', 'ordernumber', 'order-number', 'orderNumber', 'tracking'], data.code),
            name: fillField(['name', 'الاسم', 'sender', 'customer', 'fullname', 'full-name', 'full_name', 'اسم_المرسل', 'اسم'], data.senderName),
            phone: fillField(['phone', 'هاتف', 'موبايل', 'جوال', 'تليفون', 'mobile', 'tel', 'telephone', 'رقم_الهاتف', 'رقم'], data.phoneNumber),
            province: fillField(['province', 'محافظة', 'المحافظة', 'city', 'مدينة', 'المدينة', 'region', 'area', 'state'], data.province),
            price: fillField(['price', 'سعر', 'المبلغ', 'التكلفة', 'amount', 'total', 'cost', 'المبلغ', 'السعر'], data.price),
            company: fillField(['company', 'شركة', 'vendor', 'supplier', 'provider', 'اسم_الشركة', 'الشركة'], data.companyName)
          };
          
          // التحقق من النتائج
          const filledFields = Object.values(filled).filter(Boolean).length;
          
          if (filledFields > 0) {
            createNotification(\`تم ملء \${filledFields} حقول للمجموعة \${currentIndex + 1}\`, true);
          } else {
            createNotification('لم يتم العثور على حقول مطابقة لملئها', false);
          }
          
          // تحديث عداد المجموعة الحالية في لوحة التحكم
          const counter = panel.querySelector('#current-index');
          if (counter) counter.textContent = (currentIndex + 1).toString();
        };

        // إنشاء لوحة التحكم المتحركة
        const createControlPanel = () => {
          // إزالة أي لوحة سابقة
          const existingPanel = document.getElementById('multi-bookmarklet-panel');
          if (existingPanel) {
            document.body.removeChild(existingPanel);
          }
          
          // إنشاء اللوحة الجديدة
          panel = document.createElement('div');
          panel.id = 'multi-bookmarklet-panel';
          panel.style.position = 'fixed';
          panel.style.top = '10px';
          panel.style.right = '10px';
          panel.style.backgroundColor = '#f8f9fa';
          panel.style.border = '1px solid #dee2e6';
          panel.style.borderRadius = '5px';
          panel.style.padding = '10px';
          panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
          panel.style.zIndex = '9999';
          panel.style.direction = 'rtl';
          panel.style.fontFamily = 'Arial, sans-serif';
          panel.style.fontSize = '14px';
          
          // العنوان
          const title = document.createElement('h3');
          title.textContent = 'أداة ملء البيانات المتعددة';
          title.style.margin = '0 0 10px 0';
          title.style.fontSize = '16px';
          title.style.fontWeight = 'bold';
          title.style.cursor = 'move';
          panel.appendChild(title);
          
          // معلومات المجموعة الحالية
          const info = document.createElement('div');
          info.innerHTML = \`المجموعة: <span id="current-index">\${currentIndex + 1}</span> من \${dataArray.length}\`;
          info.style.marginBottom = '10px';
          panel.appendChild(info);
          
          // حاوية الأزرار
          const buttonsContainer = document.createElement('div');
          buttonsContainer.style.display = 'flex';
          buttonsContainer.style.gap = '5px';
          
          // زر السابق
          const prevButton = document.createElement('button');
          prevButton.textContent = 'السابق';
          prevButton.style.padding = '5px 10px';
          prevButton.style.backgroundColor = '#6c757d';
          prevButton.style.color = 'white';
          prevButton.style.border = 'none';
          prevButton.style.borderRadius = '3px';
          prevButton.style.cursor = 'pointer';
          prevButton.onclick = () => {
            if (currentIndex > 0) {
              currentIndex--;
              fillCurrentData();
            }
          };
          buttonsContainer.appendChild(prevButton);
          
          // زر التالي
          const nextButton = document.createElement('button');
          nextButton.textContent = 'التالي';
          nextButton.style.padding = '5px 10px';
          nextButton.style.backgroundColor = '#28a745';
          nextButton.style.color = 'white';
          nextButton.style.border = 'none';
          nextButton.style.borderRadius = '3px';
          nextButton.style.cursor = 'pointer';
          nextButton.onclick = () => {
            if (currentIndex < dataArray.length - 1) {
              currentIndex++;
              fillCurrentData();
            }
          };
          buttonsContainer.appendChild(nextButton);
          
          // زر الإغلاق
          const closeButton = document.createElement('button');
          closeButton.textContent = 'إغلاق';
          closeButton.style.padding = '5px 10px';
          closeButton.style.backgroundColor = '#dc3545';
          closeButton.style.color = 'white';
          closeButton.style.border = 'none';
          closeButton.style.borderRadius = '3px';
          closeButton.style.cursor = 'pointer';
          closeButton.onclick = () => {
            document.body.removeChild(panel);
          };
          buttonsContainer.appendChild(closeButton);
          
          panel.appendChild(buttonsContainer);
          
          // جعل اللوحة قابلة للسحب
          let isDragging = false;
          let offsetX, offsetY;
          
          title.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
          });
          
          document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.right = 'auto';
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
          });
          
          document.addEventListener('mouseup', () => {
            isDragging = false;
          });
          
          return panel;
        };
        
        // تهيئة لوحة التحكم وبدء الاستخدام
        panel = createControlPanel();
        document.body.appendChild(panel);
        
        // ملء البيانات الأولى
        fillCurrentData();
        
        createNotification('تم تشغيل أداة ملء البيانات المتعددة', true);
        
      } catch (error) {
        console.error('حدث خطأ:', error);
        alert('حدث خطأ أثناء محاولة تشغيل الأداة: ' + error.message);
      }
    })();
  `;

  // تنظيف الكود وإرجاعه
  return bookmarkletCode.trim().replace(/\\s+/g, ' ');
};

