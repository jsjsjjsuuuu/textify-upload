
/**
 * إنشاء كود Bookmarklet محسن للاستخدام في المتصفح
 * مع تحسين واجهة المستخدم وزيادة التوافق مع المواقع المختلفة
 */
export const generateBookmarkletCode = (): string => {
  // الكود المحسن للـ Bookmarklet - يجب تقليصه قدر الإمكان مع الحفاظ على وظائفه
  const code = `
  (function() {
    // التحقق من وجود البيانات
    const storageKey = "bookmarklet_data";
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

      // وظيفة تعبئة النموذج بشكل محسن
      function fillForm(item) {
        console.log("بدء ملء النموذج بالبيانات:", item);
        // البحث عن حقول النموذج
        const fields = document.querySelectorAll('input, select, textarea, [contenteditable="true"]');
        console.log("وجدت", fields.length, "حقل إدخال");
        
        // تتبع ما إذا تم ملء أي حقول
        let filledFields = 0;
        
        fields.forEach(field => {
          // تحديد نوع الحقل
          const fieldType = guessFieldType(field);
          if (fieldType !== 'unknown') {
            let value = '';
            
            switch (fieldType) {
              case 'code': value = item.code || ''; break;
              case 'senderName': value = item.senderName || ''; break;
              case 'phoneNumber': value = item.phoneNumber ? item.phoneNumber.replace(/\\D/g, '') : ''; break;
              case 'province': value = item.province || ''; break;
              case 'price': value = item.price ? item.price.replace(/[^\\d.]/g, '') : ''; break;
              case 'companyName': value = item.companyName || ''; break;
              case 'address': value = \`\${item.province || ''}\${item.notes ? ' - ' + item.notes : ''}\`; break;
              case 'notes': value = item.notes || ''; break;
              case 'productType': value = item.category || item.notes || 'بضائع متنوعة'; break;
              case 'orderNumber': value = item.code || ''; break;
              case 'customerCode': value = item.customerCode || item.code || ''; break;
              case 'recipientName': value = item.recipientName || item.senderName || ''; break;
              default: break;
            }
            
            if (value && fillField(field, value)) {
              filledFields++;
              console.log("تم ملء حقل", fieldType, "بقيمة:", value);
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
              const fieldType = guessFieldType(field);
              if (fieldType !== 'unknown') {
                let value = '';
                
                switch (fieldType) {
                  case 'code': value = item.code || ''; break;
                  case 'senderName': value = item.senderName || ''; break;
                  case 'phoneNumber': value = item.phoneNumber ? item.phoneNumber.replace(/\\D/g, '') : ''; break;
                  case 'province': value = item.province || ''; break;
                  case 'price': value = item.price ? item.price.replace(/[^\\d.]/g, '') : ''; break;
                  default: break;
                }
                
                if (value && fillField(field, value)) {
                  filledFields++;
                  console.log("تم ملء حقل جديد", fieldType, "بقيمة:", value);
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
        }, 1000);
        
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
                  statusMessage: message,
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
      
      // وظيفة تخمين نوع الحقل
      function guessFieldType(field) {
        const searchables = [];
        
        // جمع كل المعرّفات المحتملة للحقل
        if (field.name) searchables.push(field.name.toLowerCase());
        if (field.id) searchables.push(field.id.toLowerCase());
        if (field.className && typeof field.className === 'string') searchables.push(field.className.toLowerCase());
        if (field.placeholder) searchables.push(field.placeholder.toLowerCase());
        
        // البحث عن عنصر label المرتبط
        if (field.id) {
          const label = document.querySelector('label[for="' + field.id + '"]');
          if (label && label.textContent) searchables.push(label.textContent.toLowerCase());
        }
        
        // البحث في النص المحيط
        let parent = field.parentElement;
        if (parent && parent.textContent) searchables.push(parent.textContent.toLowerCase());
        
        // تجميع النص للبحث
        const searchText = searchables.join(' ');
        
        // الكلمات المفتاحية للبحث - مبسطة للتوافق
        const patterns = [
          { type: 'code', keywords: ['code', 'كود', 'رمز', 'رقم الوصل', 'رقم الشحنة', 'رقم الطلب', 'order', 'tracking', 'reference', 'ref'] },
          { type: 'senderName', keywords: ['sender', 'name', 'customer', 'اسم', 'المرسل', 'الزبون', 'العميل', 'المستلم', 'الاسم'] },
          { type: 'phoneNumber', keywords: ['phone', 'mobile', 'هاتف', 'موبايل', 'جوال', 'رقم الهاتف', 'تليفون', 'رقم الجوال', 'tel'] },
          { type: 'province', keywords: ['province', 'state', 'city', 'region', 'محافظة', 'المحافظة', 'مدينة', 'منطقة', 'المدينة'] },
          { type: 'price', keywords: ['price', 'amount', 'cost', 'سعر', 'المبلغ', 'التكلفة', 'قيمة', 'دينار', 'المال'] },
          { type: 'address', keywords: ['address', 'location', 'street', 'عنوان', 'الموقع', 'الشارع', 'التفاصيل'] },
          { type: 'notes', keywords: ['notes', 'comments', 'ملاحظات', 'تعليقات', 'توضيح', 'explanation'] },
          { type: 'companyName', keywords: ['company', 'business', 'vendor', 'شركة', 'الشركة', 'المتجر', 'البائع'] },
          { type: 'recipientName', keywords: ['recipient', 'receiver', 'المستلم', 'اسم المستلم', 'من يستلم'] }
        ];
        
        // البحث عن أفضل تطابق
        for (const pattern of patterns) {
          for (const keyword of pattern.keywords) {
            if (searchText.includes(keyword)) {
              return pattern.type;
            }
          }
        }
        
        // تخمين بناءً على خصائص الحقل
        if (field.type === 'tel') return 'phoneNumber';
        if (field.type === 'number' && searchText.includes('price')) return 'price';
        
        return 'unknown';
      }
      
      // وظيفة ملء الحقل بالقيمة
      function fillField(field, value) {
        if (!value || value.trim() === '') return false;
        
        try {
          // التعامل مع القوائم المنسدلة
          if (field.tagName === 'SELECT') {
            const select = field;
            const options = Array.from(select.options);
            const cleanValue = value.trim().toLowerCase();
            
            // محاولة العثور على تطابق
            let found = false;
            for (const option of options) {
              const optionText = option.text.toLowerCase();
              if (optionText === cleanValue || optionText.includes(cleanValue)) {
                select.value = option.value;
                found = true;
                break;
              }
            }
            
            if (!found) return false;
          } else {
            // للحقول العادية
            if (field.type === 'tel') {
              field.value = value.replace(/\\D/g, '');
            } else if (field.type === 'number') {
              field.value = value.replace(/[^\\d.]/g, '');
            } else if (field.contentEditable === 'true') {
              field.textContent = value;
            } else {
              field.value = value;
            }
          }
          
          // إطلاق الأحداث
          ['input', 'change', 'blur'].forEach(eventType => {
            const event = new Event(eventType, { bubbles: true });
            field.dispatchEvent(event);
          });
          
          // محاولة تنشيط الحقل
          try {
            field.focus();
            field.click();
          } catch (e) {
            console.warn("لم يمكن تنشيط الحقل:", e);
          }
          
          return true;
        } catch (e) {
          console.error("خطأ في ملء الحقل:", e);
          return false;
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
