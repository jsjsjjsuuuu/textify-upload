
/**
 * إنشاء كود Bookmarklet محسن للاستخدام في المتصفح
 * مع تحسين واجهة المستخدم وزيادة التوافق مع المواقع المختلفة
 */
export const generateBookmarkletCode = (): string => {
  // الكود المحسن للـ Bookmarklet - تم تحسينه لحل مشاكل التوافق
  const code = `
  (function() {
    // التحقق من وجود البيانات
    const storageKey = "bookmarklet_data_v1";
    const data = localStorage.getItem(storageKey);
    
    if (!data) {
      alert("لا توجد بيانات مخزنة للاستخدام. يرجى تصدير البيانات أولاً.");
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      const items = parsedData.items || [];
      
      if (items.length === 0) {
        alert("لا توجد عناصر مخزنة للاستخدام.");
        return;
      }
      
      // تحميل CSS لتحسين مظهر واجهة المستخدم
      const styles = document.createElement("style");
      styles.textContent = \`
        .bm-control{font-family:sans-serif;direction:rtl;position:fixed;top:10px;right:10px;background:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);width:320px;z-index:9999999;max-height:90vh;overflow-y:auto;border:1px solid #eaeaea}
        .bm-header{padding:12px 15px;border-bottom:1px solid #eaeaea;display:flex;justify-content:space-between;align-items:center}
        .bm-title{margin:0;font-size:16px;font-weight:600;color:#333}
        .bm-close{background:none;border:none;font-size:16px;cursor:pointer;color:#666;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px}
        .bm-close:hover{background:#f5f5f5;color:#333}
        .bm-content{padding:12px 15px}
        .bm-info{margin-bottom:15px;font-size:14px;color:#555;padding:8px 12px;background:#f9f9f9;border-radius:6px}
        .bm-btn{display:block;width:100%;padding:10px 15px;border:none;border-radius:6px;margin:8px 0;cursor:pointer;font-size:14px;font-weight:500;text-align:center}
        .bm-btn-primary{background:#4CAF50;color:white}
        .bm-btn-primary:hover{background:#43A047}
        .bm-btn-secondary{background:#f1f1f1;color:#333}
        .bm-btn-secondary:hover{background:#e5e5e5}
        .bm-item{padding:10px;margin:8px 0;border:1px solid #eaeaea;border-radius:6px;background:#f9f9f9}
        .bm-item-title{font-weight:600;margin-bottom:5px;font-size:14px}
        .bm-item-detail{font-size:12px;color:#666}
        .bm-badge{display:inline-block;padding:2px 6px;border-radius:12px;font-size:11px;font-weight:500}
        .bm-loader{display:inline-block;width:12px;height:12px;border:2px solid rgba(0,0,0,0.1);border-radius:50%;border-top-color:#4CAF50;animation:bm-spin 1s linear infinite;margin-left:8px}
        @keyframes bm-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        .bm-debug{background:#f5f5f5;padding:8px;margin:10px 0;border-radius:4px;font-size:11px;max-height:120px;overflow-y:auto;color:#666}
      \`;
      document.head.appendChild(styles);
      
      // إنشاء واجهة التحكم
      const controlPanel = document.createElement("div");
      controlPanel.className = "bm-control";
      
      // إضافة العنوان وزر الإغلاق
      const header = document.createElement("div");
      header.className = "bm-header";
      
      const title = document.createElement("h3");
      title.className = "bm-title";
      title.textContent = "أداة إدخال البيانات التلقائي";
      header.appendChild(title);
      
      const closeButton = document.createElement("button");
      closeButton.className = "bm-close";
      closeButton.textContent = "×";
      closeButton.onclick = function() {
        document.body.removeChild(controlPanel);
      };
      header.appendChild(closeButton);
      
      controlPanel.appendChild(header);
      
      // إضافة محتوى اللوحة
      const content = document.createElement("div");
      content.className = "bm-content";
      
      // إضافة معلومات العناصر
      const info = document.createElement("div");
      info.className = "bm-info";
      info.innerHTML = "<strong>العناصر المتاحة:</strong> " + items.length + 
        "<br><small>يمكنك إدخال بيانات وصل واحد أو جميع الوصولات دفعة واحدة</small>";
      content.appendChild(info);
      
      // القسم الرئيسي للأزرار
      const actionsDiv = document.createElement("div");
      
      // إضافة زر "إدخال بيانات أول عنصر"
      const fillFirstButton = document.createElement("button");
      fillFirstButton.className = "bm-btn bm-btn-primary";
      fillFirstButton.innerHTML = '<span>إدخال بيانات أول عنصر</span>';
      fillFirstButton.onclick = function() {
        if (items.length > 0) {
          fillFirstButton.innerHTML = '<span>جاري ملء البيانات</span><span class="bm-loader"></span>';
          fillFirstButton.disabled = true;
          
          setTimeout(() => {
            // تأكد من اكتمال تحميل الصفحة
            if (document.readyState === 'complete') {
              runWithRetry(() => fillForm(items[0]), 3)
                .then(result => {
                  fillFirstButton.innerHTML = '<span>إدخال بيانات أول عنصر</span>';
                  fillFirstButton.disabled = false;
                  
                  if (result === 0) {
                    showNotification("لم نتمكن من العثور على حقول مناسبة. حاول الانتقال إلى صفحة إضافة شحنة أولاً.", "error");
                  }
                })
                .catch(error => {
                  console.error("فشل محاولات ملء النموذج:", error);
                  fillFirstButton.innerHTML = '<span>إدخال بيانات أول عنصر</span>';
                  fillFirstButton.disabled = false;
                  showNotification("حدث خطأ أثناء ملء النموذج", "error");
                });
            } else {
              window.addEventListener('load', () => {
                runWithRetry(() => fillForm(items[0]), 3)
                  .then(result => {
                    fillFirstButton.innerHTML = '<span>إدخال بيانات أول عنصر</span>';
                    fillFirstButton.disabled = false;
                    
                    if (result === 0) {
                      showNotification("لم نتمكن من العثور على حقول مناسبة. حاول الانتقال إلى صفحة إضافة شحنة أولاً.", "error");
                    }
                  })
                  .catch(error => {
                    console.error("فشل محاولات ملء النموذج:", error);
                    fillFirstButton.innerHTML = '<span>إدخال بيانات أول عنصر</span>';
                    fillFirstButton.disabled = false;
                    showNotification("حدث خطأ أثناء ملء النموذج", "error");
                  });
              });
            }
          }, 500);
        }
      };
      actionsDiv.appendChild(fillFirstButton);
      
      // إضافة زر "إدخال ثم ضغط حفظ"
      const fillAndSaveButton = document.createElement("button");
      fillAndSaveButton.className = "bm-btn bm-btn-primary";
      fillAndSaveButton.innerHTML = '<span>إدخال البيانات والضغط على حفظ</span>';
      fillAndSaveButton.onclick = function() {
        if (items.length > 0) {
          fillAndSaveButton.innerHTML = '<span>جاري ملء البيانات...</span><span class="bm-loader"></span>';
          fillAndSaveButton.disabled = true;
          
          setTimeout(() => {
            // تأكد من اكتمال تحميل الصفحة
            if (document.readyState === 'complete') {
              runWithRetry(() => fillForm(items[0]), 3)
                .then(result => {
                  if (result > 0) {
                    // ابحث عن زر الحفظ وانقر عليه
                    setTimeout(() => {
                      const saveButtonResult = findAndClickSaveButton();
                      
                      if (saveButtonResult) {
                        showNotification("تم ملء البيانات والضغط على زر الحفظ بنجاح!", "success");
                        updateItemStatus(items[0].id, "success", "تم إدخال البيانات والحفظ بنجاح");
                      } else {
                        showNotification("تم ملء البيانات لكن لم نتمكن من العثور على زر الحفظ.", "error");
                      }
                      
                      fillAndSaveButton.innerHTML = '<span>إدخال البيانات والضغط على حفظ</span>';
                      fillAndSaveButton.disabled = false;
                    }, 1000);
                  } else {
                    showNotification("لم نتمكن من العثور على حقول مناسبة. تأكد من أنك في صفحة إضافة شحنة.", "error");
                    fillAndSaveButton.innerHTML = '<span>إدخال البيانات والضغط على حفظ</span>';
                    fillAndSaveButton.disabled = false;
                  }
                })
                .catch(error => {
                  console.error("فشل محاولات ملء النموذج وحفظه:", error);
                  fillAndSaveButton.innerHTML = '<span>إدخال البيانات والضغط على حفظ</span>';
                  fillAndSaveButton.disabled = false;
                  showNotification("حدث خطأ أثناء ملء النموذج", "error");
                });
            } else {
              window.addEventListener('load', () => {
                runWithRetry(() => fillForm(items[0]), 3)
                  .then(result => {
                    if (result > 0) {
                      // ابحث عن زر الحفظ وانقر عليه
                      setTimeout(() => {
                        const saveButtonResult = findAndClickSaveButton();
                        
                        if (saveButtonResult) {
                          showNotification("تم ملء البيانات والضغط على زر الحفظ بنجاح!", "success");
                          updateItemStatus(items[0].id, "success", "تم إدخال البيانات والحفظ بنجاح");
                        } else {
                          showNotification("تم ملء البيانات لكن لم نتمكن من العثور على زر الحفظ.", "error");
                        }
                        
                        fillAndSaveButton.innerHTML = '<span>إدخال البيانات والضغط على حفظ</span>';
                        fillAndSaveButton.disabled = false;
                      }, 1000);
                    } else {
                      showNotification("لم نتمكن من العثور على حقول مناسبة. تأكد من أنك في صفحة إضافة شحنة.", "error");
                      fillAndSaveButton.innerHTML = '<span>إدخال البيانات والضغط على حفظ</span>';
                      fillAndSaveButton.disabled = false;
                    }
                  })
                  .catch(error => {
                    console.error("فشل محاولات ملء النموذج وحفظه:", error);
                    fillAndSaveButton.innerHTML = '<span>إدخال البيانات والضغط على حفظ</span>';
                    fillAndSaveButton.disabled = false;
                    showNotification("حدث خطأ أثناء ملء النموذج", "error");
                  });
              });
            }
          }, 500);
        }
      };
      actionsDiv.appendChild(fillAndSaveButton);
      
      // إضافة زر "إظهار جميع العناصر"
      const showAllButton = document.createElement("button");
      showAllButton.className = "bm-btn bm-btn-secondary";
      showAllButton.innerHTML = '<span>إظهار جميع العناصر</span>';
      showAllButton.onclick = function() {
        showAllItems();
      };
      actionsDiv.appendChild(showAllButton);
      
      content.appendChild(actionsDiv);
      
      // إضافة قسم تصحيح الأخطاء (للمطورين)
      const debugContainer = document.createElement("div");
      debugContainer.id = "bm-debug-container";
      debugContainer.className = "bm-debug";
      debugContainer.style.display = "none";
      debugContainer.innerHTML = "<strong>معلومات التصحيح:</strong>";
      content.appendChild(debugContainer);
      
      // قسم عرض العناصر (مخفي افتراضيًا)
      const itemsContainer = document.createElement("div");
      itemsContainer.id = "bm-items-container";
      itemsContainer.style.display = "none";
      itemsContainer.style.marginTop = "15px";
      content.appendChild(itemsContainer);
      
      controlPanel.appendChild(content);
      document.body.appendChild(controlPanel);
      
      // وظيفة تجربة الوظيفة عدة مرات مع تأخير متزايد
      async function runWithRetry(fn, maxRetries = 3, initialDelay = 500) {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const result = fn();
            if (result > 0) return result; // نجاح
            
            // تأخير قبل المحاولة التالية
            await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, attempt)));
          } catch (error) {
            console.error(\`محاولة \${attempt + 1} فشلت:\`, error);
            lastError = error;
          }
        }
        throw lastError || new Error("فشلت جميع المحاولات");
      }
      
      // وظيفة إضافة معلومات التصحيح
      function addDebugInfo(message) {
        const debugContainer = document.getElementById("bm-debug-container");
        if (debugContainer) {
          const debugLine = document.createElement("div");
          debugLine.textContent = "• " + message;
          debugContainer.appendChild(debugLine);
          debugContainer.style.display = "block";
          
          // حفظ آخر 10 سطور فقط لتجنب الحمل الزائد
          const lines = debugContainer.querySelectorAll("div");
          if (lines.length > 10) {
            debugContainer.removeChild(lines[1]); // إزالة أقدم سطر (الأول هو العنوان)
          }
        }
      }

      // وظيفة البحث عن زر الحفظ والضغط عليه
      function findAndClickSaveButton() {
        // محاولات متعددة للعثور على زر الحفظ
        const saveButtonSelectors = [
          // البحث عن النص المباشر
          'button:contains("حفظ")', 
          'button:contains("احفظ")',
          'button:contains("تأكيد")',
          'button:contains("إضافة")',
          'input[type="submit"][value*="حفظ"]',
          'input[type="button"][value*="حفظ"]',
          // البحث باستخدام السمات
          'button[type="submit"]',
          '.save-button', 
          '.btn-save',
          '.submit-btn',
          '.btn-primary',
          // محددات أخرى
          'form button:last-child',
          'form input[type="submit"]:last-child',
          'button.btn-success'
        ];
        
        // تحسين البحث عن النص داخل الأزرار
        const getAllButtons = () => document.querySelectorAll('button, input[type="submit"], input[type="button"]');
        const allButtons = getAllButtons();
        
        // البحث عن الأزرار بالنص المناسب
        for (const button of Array.from(allButtons)) {
          const buttonText = button.textContent?.trim().toLowerCase() || '';
          const buttonValue = button.getAttribute('value')?.toLowerCase() || '';
          
          if (buttonText.includes('حفظ') || buttonText.includes('تأكيد') || buttonText.includes('إضافة') ||
              buttonValue.includes('حفظ') || buttonValue.includes('تأكيد')) {
            try {
              console.log("وجدت زر الحفظ:", buttonText || buttonValue);
              button.click();
              return true;
            } catch (e) {
              console.warn("خطأ أثناء النقر على الزر:", e);
            }
          }
        }
        
        // البحث عن زر في أسفل النموذج
        const forms = document.querySelectorAll('form');
        for (const form of Array.from(forms)) {
          const formButtons = form.querySelectorAll('button, input[type="submit"], input[type="button"]');
          if (formButtons.length > 0) {
            try {
              console.log("النقر على آخر زر في النموذج");
              formButtons[formButtons.length - 1].click();
              return true;
            } catch (e) {
              console.warn("خطأ أثناء النقر على آخر زر في النموذج:", e);
            }
          }
        }
        
        // محاولة أخيرة - البحث عن أي زر submit
        const submitButtons = document.querySelectorAll('button[type="submit"]');
        if (submitButtons.length > 0) {
          try {
            console.log("النقر على زر submit");
            submitButtons[0].click();
            return true;
          } catch (e) {
            console.warn("خطأ أثناء النقر على زر submit:", e);
          }
        }
        
        return false;
      }

      // وظيفة تعبئة النموذج بشكل محسن
      function fillForm(item) {
        console.log("بدء ملء النموذج بالبيانات:", item);
        addDebugInfo("بدء ملء النموذج للعنصر: " + (item.code || "بدون كود"));
        
        // البحث عن حقول النموذج
        const fields = document.querySelectorAll('input, select, textarea, [contenteditable="true"]');
        console.log("وجدت", fields.length, "حقل إدخال");
        addDebugInfo("تم العثور على " + fields.length + " حقل إدخال");
        
        if (fields.length === 0) {
          addDebugInfo("لم يتم العثور على حقول! تأكد من أنك في صفحة النموذج");
          return 0;
        }
        
        // تتبع ما إذا تم ملء أي حقول
        let filledFields = 0;
        let attemptedFields = 0;
        
        // تعيين الحقول المرئية في الصورة المرفقة - أضفنا المزيد من الوسوم لزيادة فرص المطابقة
        const fieldMappings = {
          'كود العميل': { key: 'customerCode', value: item.code || item.customerCode || '' },
          'رقم العميل': { key: 'customerCode', value: item.code || item.customerCode || '' },
          'رقم الوصل': { key: 'code', value: item.code || '' },
          'رقم البوليصة': { key: 'code', value: item.code || '' },
          'الرقم المرجعي': { key: 'code', value: item.code || '' },
          'الرمز': { key: 'code', value: item.code || '' },
          'رقم': { key: 'code', value: item.code || '' },
          'هاتف الزبون': { key: 'phoneNumber', value: item.phoneNumber ? item.phoneNumber.replace(/\\D/g, '') : '' },
          'رقم الهاتف': { key: 'phoneNumber', value: item.phoneNumber ? item.phoneNumber.replace(/\\D/g, '') : '' },
          'الهاتف': { key: 'phoneNumber', value: item.phoneNumber ? item.phoneNumber.replace(/\\D/g, '') : '' },
          'موبايل': { key: 'phoneNumber', value: item.phoneNumber ? item.phoneNumber.replace(/\\D/g, '') : '' },
          'المحافظة': { key: 'province', value: item.province || item.area || '' },
          'محافظة': { key: 'province', value: item.province || item.area || '' },
          'المدينة': { key: 'province', value: item.province || item.area || '' },
          'اسم العميل': { key: 'customerName', value: item.senderName || item.recipientName || item.customerName || '' },
          'اسم المستلم': { key: 'recipientName', value: item.recipientName || item.senderName || item.customerName || '' },
          'المبلغ الكلي': { key: 'totalAmount', value: item.price || item.totalAmount || '' },
          'المبلغ': { key: 'totalAmount', value: item.price || item.totalAmount || '' },
          'السعر': { key: 'totalAmount', value: item.price || item.totalAmount || '' },
          'عدد القطع': { key: 'pieceCount', value: item.packageCount || item.pieceCount || '1' },
          'عدد': { key: 'pieceCount', value: item.packageCount || item.pieceCount || '1' },
          'المنطقة': { key: 'area', value: item.region || item.area || item.province || '' },
          'منطقة': { key: 'area', value: item.region || item.area || item.province || '' },
          'اسم الزبون': { key: 'customerName', value: item.senderName || item.customerName || '' },
          'نوع البضاعة': { key: 'packageType', value: item.productType || item.packageType || item.category || 'بضائع متنوعة' },
          'نوع': { key: 'packageType', value: item.productType || item.packageType || item.category || 'بضائع متنوعة' },
          'البضاعة': { key: 'packageType', value: item.productType || item.packageType || item.category || 'بضائع متنوعة' },
          'زيادة أجرة العميل': { key: 'customerFee', value: item.customerFee || '0' },
          'أجرة العميل': { key: 'customerFee', value: item.customerFee || '0' },
          'زيادة أجرة المندوب': { key: 'deliveryAgentFee', value: item.deliveryAgentFee || '0' },
          'أجرة المندوب': { key: 'deliveryAgentFee', value: item.deliveryAgentFee || '0' },
          'ملاحظات': { key: 'notes1', value: item.notes || item.notes1 || '' },
          'ملاحظة': { key: 'notes1', value: item.notes || item.notes1 || '' },
          'ملاحظات خاصة': { key: 'notes2', value: item.notes2 || '' },
          'الحالة': { key: 'status1', value: item.status1 || 'قيد التنفيذ' },
          'حالة': { key: 'status1', value: item.status1 || 'قيد التنفيذ' },
          'استبدال': { key: 'exchangeStatus', value: item.exchangeStatus || 'لا' },
          'تبديل': { key: 'exchangeStatus', value: item.exchangeStatus || 'لا' },
          'حالة الدفع': { key: 'paymentStatus', value: item.paymentStatus || 'نقدي' },
          'الدفع': { key: 'paymentStatus', value: item.paymentStatus || 'نقدي' },
          'تاريخ التسليم': { key: 'deliveryDate', value: item.deliveryDate || '' },
          'التسليم': { key: 'deliveryDate', value: item.deliveryDate || '' },
          'اسم المندوب': { key: 'delegateName', value: item.delegateName || '' },
          'المندوب': { key: 'delegateName', value: item.delegateName || '' }
        };
        
        // للبحث في النص المحيط بالحقل - تحسين للحصول على تسميات أكثر دقة
        function getFieldLabel(field) {
          let labels = [];
          
          // 1. محاولة العثور على التسمية المرتبطة مباشرة بالحقل
          if (field.id) {
            const labelElement = document.querySelector(\`label[for="\${field.id}"]\`);
            if (labelElement) {
              labels.push(labelElement.textContent?.trim() || '');
            }
          }
          
          // 2. البحث في العناصر المجاورة عن تسمية محتملة
          let current = field.previousElementSibling;
          while (current && current.tagName !== 'INPUT' && current.tagName !== 'SELECT' && current.tagName !== 'TEXTAREA') {
            // إذا كان العنصر الحالي نص (td, div, span, label, etc)
            if (current.textContent) {
              const text = current.textContent.trim();
              if (text && text.length < 50) { // تجنب النصوص الطويلة جدًا
                labels.push(text);
              }
            }
            current = current.previousElementSibling;
          }
          
          // 3. البحث في العنصر الأب
          if (field.parentElement) {
            // ابحث عن أي عنصر نصي مباشر في العنصر الأب
            const parentTextNodes = Array.from(field.parentElement.childNodes)
              .filter(node => node.nodeType === 3); // الأنواع النصية فقط
              
            for (const textNode of parentTextNodes) {
              const text = textNode.textContent?.trim();
              if (text && text.length > 0 && text.length < 50) {
                labels.push(text);
              }
            }
            
            // ابحث عن أي span أو div أو label داخل الأب قبل الحقل
            const siblings = Array.from(field.parentElement.children);
            const fieldIndex = siblings.indexOf(field);
            
            for (let i = 0; i < fieldIndex; i++) {
              const sibling = siblings[i];
              if (sibling.tagName === 'SPAN' || sibling.tagName === 'DIV' || sibling.tagName === 'LABEL') {
                const text = sibling.textContent?.trim();
                if (text && text.length < 50) {
                  labels.push(text);
                }
              }
            }
          }
          
          // 4. إضافة جميع السمات المفيدة للحقل
          if (field.name) labels.push(field.name);
          if (field.id) labels.push(field.id);
          if (field.placeholder) labels.push(field.placeholder);
          if (field.title) labels.push(field.title);
          if ('ariaLabel' in field && field.ariaLabel) labels.push(field.ariaLabel);
          
          // إذا لم نجد أي تسميات، أعد الخصائص الأساسية
          if (labels.length === 0) {
            return field.name || field.id || field.className || '';
          }
          
          // أعد التسمية الأكثر احتمالا (الأولى)
          return labels.join(' ');
        }
        
        // وظيفة تحسين ملء القيم في الحقول لزيادة فرص النجاح
        function fillFieldValue(field, value) {
          if (!value || value.trim() === '') {
            return false; // لا فائدة من ملء قيمة فارغة
          }
          
          try {
            // سجل القيمة الأصلية للحقل للمقارنة لاحقًا
            const originalValue = field.value;
            addDebugInfo("محاولة ملء الحقل: " + (field.name || field.id || "بدون اسم") + " بالقيمة: " + value);
            
            // طريقة 1: الإسناد المباشر
            field.value = value;
            
            // طريقة 2: استخدام إعادة تعريف الخاصية
            try {
              // أعد تعريف خاصية القيمة
              Object.defineProperty(field, 'value', {
                writable: true,
                value: value
              });
            } catch (propError) {
              console.warn("خطأ في إعادة تعريف الخاصية:", propError);
            }
            
            // طريقة 3: محاكاة كتابة المستخدم
            try {
              // تحديث القيمة بطريقة مختلفة
              if (field.tagName === 'SELECT') {
                const options = Array.from(field.options);
                const bestOption = options.find(opt => 
                  opt.text.toLowerCase().includes(value.toLowerCase()) || 
                  opt.value.toLowerCase().includes(value.toLowerCase())
                );
                
                if (bestOption) {
                  field.selectedIndex = bestOption.index;
                }
              } else if (field.type !== 'file') {
                // محاكاة النقر على الحقل أولاً
                field.focus();
                field.select();
                
                // محاكاة كتابة المستخدم
                if (typeof InputEvent === 'function') {
                  const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: value
                  });
                  field.dispatchEvent(inputEvent);
                }
                
                // تعيين القيمة مرة أخرى للتأكد
                field.value = value;
              }
            } catch (simulationError) {
              console.warn("خطأ في محاكاة كتابة المستخدم:", simulationError);
            }
            
            // طريقة 4: إطلاق أحداث متنوعة لضمان تعرف النموذج على التغيير
            try {
              ['focus', 'input', 'change', 'blur'].forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                field.dispatchEvent(event);
              });
            } catch (eventError) {
              console.warn("خطأ في إطلاق الأحداث:", eventError);
            }
            
            // تحقق مما إذا تم تغيير القيمة بالفعل
            const valueChanged = field.value !== originalValue;
            addDebugInfo(valueChanged ? "تم تغيير القيمة بنجاح" : "لم يتم تغيير القيمة");
            
            return valueChanged;
          } catch (error) {
            console.error("خطأ أثناء ملء الحقل:", error);
            addDebugInfo("خطأ في ملء الحقل: " + error.message);
            return false;
          }
        }
        
        // هنا نبدأ ملء الحقول
        fields.forEach(field => {
          // تجاهل الحقول المخفية وحقول الملفات
          if ((field.type === 'hidden' || field.type === 'file') && field.tagName !== 'SELECT') {
            return;
          }
          
          // تحديد تسمية الحقل
          const fieldLabel = getFieldLabel(field);
          console.log("الحقل:", field.tagName, "الاسم:", field.name || field.id, "التسمية:", fieldLabel);
          
          // البحث عن تطابق في خريطة الحقول
          let foundMapping = null;
          for (const [label, mapping] of Object.entries(fieldMappings)) {
            if (
              fieldLabel.includes(label) || 
              (field.placeholder && field.placeholder.includes(label)) ||
              (field.name && field.name.includes(label)) ||
              (field.id && field.id.includes(label))
            ) {
              foundMapping = mapping;
              console.log("تم العثور على تطابق:", label, "->", mapping.key);
              addDebugInfo("تطابق: " + label + " -> " + mapping.key);
              break;
            }
          }
          
          // إذا وجدنا تطابقًا، املأ الحقل
          if (foundMapping) {
            const value = foundMapping.value;
            
            if (value && field.tagName) {
              attemptedFields++;
              
              if (field.tagName === 'SELECT') {
                // للقوائم المنسدلة
                const select = field;
                const options = Array.from(select.options);
                
                console.log("خيارات القائمة المنسدلة:", options.map(o => o.text));
                addDebugInfo("القائمة المنسدلة تحتوي على " + options.length + " خيار");
                
                // البحث عن تطابق دقيق أو جزئي
                const exactMatch = options.find(opt => 
                  opt.text.trim().toLowerCase() === value.toLowerCase() || 
                  opt.value.toLowerCase() === value.toLowerCase()
                );
                
                if (exactMatch) {
                  // تعيين القيمة باستخدام قيمة الخيار
                  select.value = exactMatch.value;
                  console.log("تم ملء القائمة المنسدلة:", foundMapping.key, "بالقيمة:", exactMatch.text);
                  addDebugInfo("تم اختيار: " + exactMatch.text);
                  
                  // إطلاق حدث التغيير
                  try {
                    ['input', 'change', 'blur'].forEach(eventType => {
                      const event = new Event(eventType, { bubbles: true });
                      select.dispatchEvent(event);
                    });
                    filledFields++;
                  } catch (e) {
                    console.warn("خطأ في إطلاق أحداث التغيير:", e);
                  }
                } else {
                  // البحث عن تطابق جزئي
                  const partialMatch = options.find(opt => 
                    opt.text.trim().toLowerCase().includes(value.toLowerCase()) || 
                    value.toLowerCase().includes(opt.text.trim().toLowerCase())
                  );
                  
                  if (partialMatch) {
                    select.value = partialMatch.value;
                    console.log("تم ملء القائمة المنسدلة (تطابق جزئي):", foundMapping.key, "بالقيمة:", partialMatch.text);
                    addDebugInfo("تم اختيار (تطابق جزئي): " + partialMatch.text);
                    
                    // إطلاق حدث التغيير
                    try {
                      ['input', 'change', 'blur'].forEach(eventType => {
                        const event = new Event(eventType, { bubbles: true });
                        select.dispatchEvent(event);
                      });
                      filledFields++;
                    } catch (e) {
                      console.warn("خطأ في إطلاق أحداث التغيير:", e);
                    }
                  } else if (options.length > 0 && foundMapping.key === 'status1') {
                    // للحالة، اختر الخيار الأول إذا لم نجد تطابقًا
                    select.value = options[0].value;
                    console.log("تم ملء القائمة المنسدلة (الخيار الأول):", foundMapping.key, "بالقيمة:", options[0].text);
                    addDebugInfo("تم اختيار (أول خيار): " + options[0].text);
                    
                    // إطلاق حدث التغيير
                    try {
                      ['input', 'change', 'blur'].forEach(eventType => {
                        const event = new Event(eventType, { bubbles: true });
                        select.dispatchEvent(event);
                      });
                      filledFields++;
                    } catch (e) {
                      console.warn("خطأ في إطلاق أحداث التغيير:", e);
                    }
                  }
                }
              } else if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                // للحقول النصية
                const input = field;
                
                if (input.type === 'checkbox' || input.type === 'radio') {
                  // للمربعات أو أزرار الاختيار
                  const shouldCheck = value === 'true' || value === '1' || value.toLowerCase() === 'نعم';
                  input.checked = shouldCheck;
                  
                  // إطلاق أحداث التغيير والنقر
                  try {
                    ['input', 'change', 'click'].forEach(eventType => {
                      const event = new Event(eventType, { bubbles: true });
                      input.dispatchEvent(event);
                    });
                    
                    filledFields++;
                    addDebugInfo("تم تعيين خانة الاختيار: " + (shouldCheck ? "محددة" : "غير محددة"));
                  } catch (e) {
                    console.warn("خطأ في إطلاق أحداث خانة الاختيار:", e);
                  }
                } else {
                  // للحقول النصية العادية
                  if (input.type === 'number') {
                    // تنظيف القيمة العددية
                    const numericValue = value.replace(/[^\\d.]/g, '');
                    if (fillFieldValue(input, numericValue)) {
                      filledFields++;
                    }
                  } else if (input.type === 'tel') {
                    // تنظيف رقم الهاتف
                    const phoneValue = value.replace(/\\D/g, '');
                    if (fillFieldValue(input, phoneValue)) {
                      filledFields++;
                    }
                  } else {
                    // للحقول النصية العادية
                    if (fillFieldValue(input, value)) {
                      filledFields++;
                    }
                  }
                }
              } else if (field.contentEditable === 'true') {
                // للعناصر القابلة للتحرير
                field.textContent = value;
                const event = new Event('input', { bubbles: true });
                field.dispatchEvent(event);
                console.log("تم ملء العنصر القابل للتحرير:", foundMapping.key, "بالقيمة:", value);
                addDebugInfo("تم ملء العنصر القابل للتحرير بقيمة: " + value);
                filledFields++;
              }
            }
          }
        });
        
        // سجل معلومات عن عملية الملء
        console.log("تم ملء", filledFields, "من", attemptedFields, "حقل محاول");
        addDebugInfo("النتيجة: تم ملء " + filledFields + " من " + attemptedFields + " حقل محاول");
        
        // إذا تم ملء حقول، أظهر إشعارًا بالنجاح
        if (filledFields > 0) {
          showNotification("تم ملء " + filledFields + " حقول بنجاح", "success");
          
          // تحديث حالة العنصر في localStorage
          updateItemStatus(item.id, "success", "تم إدخال البيانات بنجاح");
        } else {
          showNotification("لم نتمكن من العثور على حقول مناسبة أو ملئها. تأكد من أنك في صفحة إضافة شحنة.", "error");
          
          // تحديث حالة العنصر في localStorage
          updateItemStatus(item.id, "error", "فشل في إدخال البيانات");
        }
        
        return filledFields;
      }
      
      // وظيفة لتحديث حالة العنصر في localStorage
      function updateItemStatus(itemId, status, message) {
        try {
          const storageData = JSON.parse(localStorage.getItem(storageKey) || '{}');
          if (storageData.items && Array.isArray(storageData.items)) {
            const updatedItems = storageData.items.map(item => {
              if (item.id === itemId) {
                const now = new Date();
                return {
                  ...item,
                  status: status,
                  message: message,
                  lastUpdated: now.toISOString()
                };
              }
              return item;
            });
            
            storageData.items = updatedItems;
            storageData.lastUpdated = new Date().toISOString();
            
            localStorage.setItem(storageKey, JSON.stringify(storageData));
            console.log("تم تحديث حالة العنصر:", itemId, status);
          }
        } catch (e) {
          console.error("خطأ في تحديث حالة العنصر:", e);
        }
      }
      
      // وظيفة لعرض إشعار
      function showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.style.position = "fixed";
        notification.style.bottom = "20px";
        notification.style.right = "20px";
        notification.style.padding = "10px 15px";
        notification.style.borderRadius = "6px";
        notification.style.color = "white";
        notification.style.fontWeight = "500";
        notification.style.zIndex = "10000";
        notification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
        notification.style.direction = "rtl";
        notification.style.fontFamily = "sans-serif";
        
        if (type === "success") {
          notification.style.backgroundColor = "#4CAF50";
        } else if (type === "error") {
          notification.style.backgroundColor = "#F44336";
        } else {
          notification.style.backgroundColor = "#2196F3";
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = "0";
          notification.style.transition = "opacity 0.5s";
          setTimeout(() => notification.parentNode && document.body.removeChild(notification), 500);
        }, 3000);
      }
      
      // وظيفة لعرض جميع العناصر
      function showAllItems() {
        const container = document.getElementById('bm-items-container');
        
        // تبديل عرض قائمة العناصر
        if (container.style.display === "none") {
          container.style.display = "block";
          showAllButton.innerHTML = '<span>إخفاء العناصر</span>';
          
          // إنشاء قائمة العناصر
          container.innerHTML = '';
          
          items.forEach((item, index) => {
            const itemElement = document.createElement("div");
            itemElement.className = "bm-item";
            
            const title = document.createElement("div");
            title.className = "bm-item-title";
            title.textContent = \`\${index + 1}. \${item.senderName || 'بدون اسم'} - \${item.code || 'بدون كود'}\`;
            
            const details = document.createElement("div");
            details.className = "bm-item-detail";
            details.innerHTML = \`
              رقم الهاتف: \${item.phoneNumber || 'غير محدد'}<br>
              المحافظة: \${item.province || 'غير محددة'}<br>
              \${item.price ? 'السعر: ' + item.price : ''}
            \`;
            
            const actionBtn = document.createElement("button");
            actionBtn.className = "bm-btn bm-btn-secondary";
            actionBtn.textContent = "إدخال هذا الوصل";
            actionBtn.style.marginTop = "8px";
            actionBtn.onclick = function(e) {
              e.preventDefault();
              actionBtn.textContent = "جاري الإدخال...";
              actionBtn.disabled = true;
              
              setTimeout(() => {
                fillForm(item);
                actionBtn.textContent = "إدخال هذا الوصل";
                actionBtn.disabled = false;
              }, 500);
            };
            
            itemElement.appendChild(title);
            itemElement.appendChild(details);
            itemElement.appendChild(actionBtn);
            container.appendChild(itemElement);
          });
        } else {
          container.style.display = "none";
          showAllButton.innerHTML = '<span>إظهار جميع العناصر</span>';
        }
      }
    } catch (error) {
      console.error("خطأ في تنفيذ البوكماركلت:", error);
      alert("حدث خطأ في تنفيذ الأداة: " + error.message);
    }
  })();
  `;
  
  // استخدام تنسيق مباشر وبسيط للرابط
  const cleanedCode = code.replace(/\\s{2,}/g, ' ').replace(/\\n/g, '').trim();
  const bookmarkletCode = `javascript:${cleanedCode}`;
  
  return bookmarkletCode;
};

