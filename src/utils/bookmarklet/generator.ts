
/**
 * إنشاء كود Bookmarklet محسن للاستخدام في المتصفح
 * مع تحسين واجهة المستخدم وزيادة التوافق مع المواقع المختلفة
 */
export const generateBookmarkletCode = (): string => {
  // الكود المحسن للـ Bookmarklet - يجب تقليصه قدر الإمكان مع الحفاظ على وظائفه
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
            const result = fillForm(items[0]);
            fillFirstButton.innerHTML = '<span>إدخال بيانات أول عنصر</span>';
            fillFirstButton.disabled = false;
            
            if (result === 0) {
              showNotification("لم نتمكن من العثور على حقول مناسبة. حاول الانتقال إلى صفحة إضافة شحنة أولاً.", "error");
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
            const result = fillForm(items[0]);
            
            if (result > 0) {
              // ابحث عن زر الحفظ وانقر عليه
              setTimeout(() => {
                const saveButtonResult = clickSaveButton();
                
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
      
      // قسم عرض العناصر (مخفي افتراضيًا)
      const itemsContainer = document.createElement("div");
      itemsContainer.id = "bm-items-container";
      itemsContainer.style.display = "none";
      itemsContainer.style.marginTop = "15px";
      content.appendChild(itemsContainer);
      
      controlPanel.appendChild(content);
      document.body.appendChild(controlPanel);

      // وظيفة البحث عن زر الحفظ والضغط عليه
      function clickSaveButton() {
        console.log("البحث عن زر الحفظ...");
        
        // طرق مختلفة للعثور على زر الحفظ
        const saveButtonSelectors = [
          // البحث عن زر النص "حفظ" أو "احفظ" أو "تأكيد"
          'button:contains("حفظ")', 
          'input[type="submit"][value*="حفظ"]',
          'button:contains("احفظ")',
          'button:contains("تأكيد")',
          'button:contains("حفط")',
          'input[type="button"][value*="حفظ"]',
          // البحث بواسطة الكلاس
          '.save-button', 
          '.btn-save',
          '.submit-btn',
          // خاص بالموقع المستهدف
          'button.حفظ',
          // أي زر في أسفل النموذج
          'form button[type="submit"]',
          // محاولة العثور على أي زر في أسفل الصفحة
          'button', 
          'input[type="submit"]',
          'input[type="button"]'
        ];
        
        // محاولة العثور على زر الحفظ باستخدام المحددات المختلفة
        let saveButton;
        
        for (const selector of saveButtonSelectors) {
          // استخدام document.querySelectorAll ثم التصفية بناءً على النص المرئي
          const buttons = document.querySelectorAll(selector.replace(':contains(', '['));
          
          // تخمين زر الحفظ بناء على موقعه (غالبًا في أسفل النموذج) أو النص المعروض
          for (const button of Array.from(buttons)) {
            const buttonText = button.textContent?.trim().toLowerCase() || '';
            const buttonType = button.getAttribute('type')?.toLowerCase() || '';
            const buttonValue = button.getAttribute('value')?.toLowerCase() || '';
            
            if (
              (buttonText.includes('حفظ') || buttonText.includes('تأكيد') || 
               buttonText.includes('احفظ') || buttonText.includes('إرسال') || 
               buttonText.includes('تخزين') || buttonText.includes('إضافة') || 
               buttonText === 'حفظ') || 
              (buttonValue.includes('حفظ') || buttonValue.includes('تأكيد')) ||
              (buttonType === 'submit')
            ) {
              saveButton = button;
              console.log("تم العثور على زر الحفظ المحتمل:", buttonText || buttonValue || buttonType);
              break;
            }
          }
          
          if (saveButton) break;
        }
        
        // إذا لم يتم العثور على زر محدد، ابحث عن آخر زر في الصفحة (احتمالية أنه زر الحفظ)
        if (!saveButton) {
          const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
          // ابحث عن زر في أسفل الصفحة
          const bottomButtons = Array.from(allButtons).filter(button => {
            const rect = button.getBoundingClientRect();
            return rect.top > window.innerHeight * 0.6; // في النصف السفلي من الصفحة
          });
          
          if (bottomButtons.length > 0) {
            // رتب الأزرار حسب موضعها من الأسفل إلى الأعلى
            bottomButtons.sort((a, b) => {
              const rectA = a.getBoundingClientRect();
              const rectB = b.getBoundingClientRect();
              return rectB.top - rectA.top;
            });
            
            saveButton = bottomButtons[0];
            console.log("تم اختيار آخر زر في الصفحة كزر حفظ محتمل");
          }
        }
        
        // محاولة استخدام خاصة بالموقع المستهدف
        if (!saveButton) {
          // في بعض المواقع، قد يكون هناك عناصر divs تتصرف كأزرار
          const potentialButtons = document.querySelectorAll('.حفظ, .btn, .button, [role="button"]');
          for (const btn of Array.from(potentialButtons)) {
            const btnText = btn.textContent?.trim().toLowerCase() || '';
            if (btnText.includes('حفظ') || btnText.includes('تأكيد') || btnText === 'حفظ') {
              saveButton = btn;
              console.log("تم العثور على عنصر يتصرف كزر:", btnText);
              break;
            }
          }
        }
        
        // إذا وجدنا زر الحفظ، انقر عليه
        if (saveButton) {
          try {
            console.log("جاري النقر على زر الحفظ...");
            saveButton.click();
            
            // التحقق من نجاح النقر
            setTimeout(() => {
              console.log("تم النقر على زر الحفظ بنجاح!");
            }, 100);
            
            return true;
          } catch (error) {
            console.error("خطأ أثناء النقر على زر الحفظ:", error);
            return false;
          }
        } else {
          console.warn("لم يتم العثور على زر الحفظ");
          return false;
        }
      }

      // وظيفة تعبئة النموذج بشكل محسن
      function fillForm(item) {
        console.log("بدء ملء النموذج بالبيانات:", item);
        // البحث عن حقول النموذج
        const fields = document.querySelectorAll('input, select, textarea, [contenteditable="true"]');
        console.log("وجدت", fields.length, "حقل إدخال");
        
        // تتبع ما إذا تم ملء أي حقول
        let filledFields = 0;
        
        // تعيين الحقول المرئية في الصورة المرفقة
        const fieldMappings = {
          'كود العميل': { key: 'customerCode', value: item.code || item.customerCode || '' },
          'رقم العميل': { key: 'customerCode', value: item.code || item.customerCode || '' },
          'رقم الوصل': { key: 'code', value: item.code || '' },
          'رقم البوليصة': { key: 'code', value: item.code || '' },
          'هاتف الزبون': { key: 'phoneNumber', value: item.phoneNumber ? item.phoneNumber.replace(/\\D/g, '') : '' },
          'المحافظة': { key: 'province', value: item.province || '' },
          'اسم العميل': { key: 'customerName', value: item.senderName || item.recipientName || '' },
          'اسم المستلم': { key: 'recipientName', value: item.recipientName || item.senderName || '' },
          'المبلغ الكلي': { key: 'totalAmount', value: item.price ? item.price.replace(/[^\\d.]/g, '') : '' },
          'عدد القطع': { key: 'pieceCount', value: item.packageCount || item.pieceCount || '1' },
          'المنطقة': { key: 'area', value: item.region || item.province || '' },
          'اسم الزبون': { key: 'customerName', value: item.senderName || '' },
          'نوع البضاعة': { key: 'packageType', value: item.productType || item.category || 'بضائع متنوعة' },
          'زيادة أجرة العميل': { key: 'customerFee', value: '' },
          'زيادة أجرة المندوب': { key: 'deliveryAgentFee', value: '' },
          'ملاحظات': { key: 'notes1', value: item.notes || '' },
          'ملاحظات خاصة': { key: 'notes2', value: '' },
          'الحالة': { key: 'status1', value: 'قيد التنفيذ' },
          'استبدال': { key: 'exchangeStatus', value: '' },
          'اسم المندوب': { key: 'delegateName', value: item.delegateName || '' }
        };
        
        // للبحث في النص المحيط بالحقل
        function getFieldLabel(field) {
          // محاولة العثور على التسمية المرتبطة مباشرة بالحقل
          if (field.id) {
            const labelElement = document.querySelector(\`label[for="\${field.id}"]\`);
            if (labelElement) {
              return labelElement.textContent?.trim() || '';
            }
          }
          
          // البحث في العناصر المجاورة عن تسمية محتملة
          let current = field.previousElementSibling;
          while (current && current.tagName !== 'INPUT' && current.tagName !== 'SELECT' && current.tagName !== 'TEXTAREA') {
            // إذا كان العنصر الحالي نص (td, div, span, label, etc)
            if (current.textContent) {
              const text = current.textContent.trim();
              if (text && text.length < 50) { // تجنب النصوص الطويلة جدًا
                return text;
              }
            }
            current = current.previousElementSibling;
          }
          
          // البحث في العنصر الأب
          if (field.parentElement) {
            // ابحث عن أي عنصر نصي مباشر في العنصر الأب
            const parentText = Array.from(field.parentElement.childNodes)
              .filter(node => node.nodeType === 3) // الأنواع النصية فقط
              .map(node => node.textContent?.trim())
              .filter(text => text && text.length > 0 && text.length < 50)
              .join(' ');
              
            if (parentText) {
              return parentText;
            }
            
            // ابحث عن أي span أو div أو label داخل الأب قبل الحقل
            const siblings = Array.from(field.parentElement.children);
            const fieldIndex = siblings.indexOf(field);
            
            for (let i = 0; i < fieldIndex; i++) {
              const sibling = siblings[i];
              if (sibling.tagName === 'SPAN' || sibling.tagName === 'DIV' || sibling.tagName === 'LABEL') {
                const text = sibling.textContent?.trim();
                if (text && text.length < 50) {
                  return text;
                }
              }
            }
            
            // ابحث عن النص في العنصر الأب نفسه
            const parentElement = field.parentElement;
            if (parentElement.childNodes.length <= 3) { // لتجنب العناصر المعقدة
              const text = parentElement.textContent?.trim() || '';
              // استبعاد النص إذا كان يحتوي فقط على نص الحقل نفسه
              if (text && text !== field.value && text.length < 50) {
                return text;
              }
            }
          }
          
          // إذا لم نجد أي شيء، أعد الاسم أو المعرف أو الفئة
          return field.name || field.id || field.className || '';
        }
        
        fields.forEach(field => {
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
              break;
            }
          }
          
          // إذا وجدنا تطابقًا، املأ الحقل
          if (foundMapping) {
            const value = foundMapping.value;
            
            if (value && field.tagName) {
              if (field.tagName === 'SELECT') {
                // للقوائم المنسدلة
                const select = field;
                const options = Array.from(select.options);
                
                // البحث عن تطابق دقيق أو جزئي
                const exactMatch = options.find(opt => 
                  opt.text.trim().toLowerCase() === value.toLowerCase() || 
                  opt.value.toLowerCase() === value.toLowerCase()
                );
                
                if (exactMatch) {
                  // تعيين القيمة باستخدام قيمة الخيار
                  select.value = exactMatch.value;
                  console.log("تم ملء القائمة المنسدلة:", foundMapping.key, "بالقيمة:", exactMatch.text);
                } else {
                  // البحث عن تطابق جزئي
                  const partialMatch = options.find(opt => 
                    opt.text.trim().toLowerCase().includes(value.toLowerCase()) || 
                    value.toLowerCase().includes(opt.text.trim().toLowerCase())
                  );
                  
                  if (partialMatch) {
                    select.value = partialMatch.value;
                    console.log("تم ملء القائمة المنسدلة (تطابق جزئي):", foundMapping.key, "بالقيمة:", partialMatch.text);
                  } else if (options.length > 0 && foundMapping.key === 'status1') {
                    // للحالة، اختر الخيار الأول إذا لم نجد تطابقًا
                    select.value = options[0].value;
                    console.log("تم ملء القائمة المنسدلة (الخيار الأول):", foundMapping.key, "بالقيمة:", options[0].text);
                  }
                }
                
                // إطلاق حدث التغيير
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
                
                filledFields++;
              } else if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                // للحقول النصية
                const input = field;
                
                if (input.type === 'checkbox' || input.type === 'radio') {
                  // للمربعات أو أزرار الاختيار
                  const shouldCheck = value === 'true' || value === '1' || value.toLowerCase() === 'نعم';
                  input.checked = shouldCheck;
                } else {
                  // للحقول النصية العادية
                  input.value = value;
                }
                
                // إطلاق أحداث التغيير والإدخال
                ['input', 'change', 'blur'].forEach(eventType => {
                  const event = new Event(eventType, { bubbles: true });
                  input.dispatchEvent(event);
                });
                
                console.log("تم ملء الحقل:", foundMapping.key, "بالقيمة:", value);
                filledFields++;
              } else if (field.contentEditable === 'true') {
                // للعناصر القابلة للتحرير
                field.textContent = value;
                const event = new Event('input', { bubbles: true });
                field.dispatchEvent(event);
                console.log("تم ملء العنصر القابل للتحرير:", foundMapping.key, "بالقيمة:", value);
                filledFields++;
              }
            }
          }
        });
        
        // إضافة تأخير قصير ومحاولة ثانية للحقول
        setTimeout(() => {
          const newFields = document.querySelectorAll('input, select, textarea, [contenteditable="true"]');
          if (newFields.length > fields.length) {
            console.log("تم اكتشاف", newFields.length - fields.length, "حقول جديدة");
            
            // تحديد الحقول الجديدة فقط
            const existingIds = new Set(Array.from(fields).map(f => f.id || Math.random().toString()));
            const additionalFields = Array.from(newFields).filter(f => !existingIds.has(f.id || ''));
            
            additionalFields.forEach(field => {
              const fieldLabel = getFieldLabel(field);
              
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
                  break;
                }
              }
              
              if (foundMapping) {
                const value = foundMapping.value;
                
                if (value && field.tagName) {
                  if (field.tagName === 'SELECT') {
                    // للقوائم المنسدلة
                    const select = field;
                    const options = Array.from(select.options);
                    
                    const exactMatch = options.find(opt => 
                      opt.text.trim().toLowerCase() === value.toLowerCase() || 
                      opt.value.toLowerCase() === value.toLowerCase()
                    );
                    
                    if (exactMatch) {
                      select.value = exactMatch.value;
                    } else {
                      const partialMatch = options.find(opt => 
                        opt.text.trim().toLowerCase().includes(value.toLowerCase()) || 
                        value.toLowerCase().includes(opt.text.trim().toLowerCase())
                      );
                      
                      if (partialMatch) {
                        select.value = partialMatch.value;
                      }
                    }
                    
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                    
                    filledFields++;
                  } else if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                    // للحقول النصية
                    const input = field;
                    
                    if (input.type === 'checkbox' || input.type === 'radio') {
                      const shouldCheck = value === 'true' || value === '1' || value.toLowerCase() === 'نعم';
                      input.checked = shouldCheck;
                    } else {
                      input.value = value;
                    }
                    
                    ['input', 'change', 'blur'].forEach(eventType => {
                      const event = new Event(eventType, { bubbles: true });
                      input.dispatchEvent(event);
                    });
                    
                    filledFields++;
                  } else if (field.contentEditable === 'true') {
                    field.textContent = value;
                    const event = new Event('input', { bubbles: true });
                    field.dispatchEvent(event);
                    filledFields++;
                  }
                }
              }
            });
          }
          
          // إظهار رسالة نجاح أو فشل
          if (filledFields > 0) {
            showNotification("تم ملء " + filledFields + " حقول بنجاح", "success");
            
            // تحديث حالة العنصر في localStorage
            updateItemStatus(item.id, "success", "تم إدخال البيانات بنجاح");
          } else {
            showNotification("لم نتمكن من العثور على حقول مناسبة. تأكد من أنك في صفحة إضافة شحنة.", "error");
            
            // تحديث حالة العنصر في localStorage
            updateItemStatus(item.id, "error", "فشل في إدخال البيانات");
          }
        }, 500);
        
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
  // هذا يتجنب استخدام encodeURIComponent الذي قد يسبب مشاكل في بعض الأحيان
  const cleanedCode = code.replace(/\s{2,}/g, ' ').replace(/\n/g, '').trim();
  const bookmarkletCode = `javascript:${cleanedCode}`;
  
  return bookmarkletCode;
};
