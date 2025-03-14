
import { ImageData, BookmarkletExportData, BookmarkletItem } from "@/types/ImageData";

// المفاتيح المستخدمة للتخزين في localStorage
const STORAGE_KEY = "bookmarklet_data";
const STORAGE_VERSION = "1.0";

/**
 * تحويل بيانات الصورة إلى تنسيق يمكن استخدامه بواسطة Bookmarklet
 */
export const convertImageToBookmarkletItem = (image: ImageData): BookmarkletItem | null => {
  // التحقق من توفر البيانات الأساسية المطلوبة
  if (!image.code || !image.senderName || !image.phoneNumber || !image.province) {
    return null;
  }

  return {
    id: image.id,
    code: image.code || "",
    senderName: image.senderName || "",
    phoneNumber: image.phoneNumber || "",
    province: image.province || "",
    price: image.price || "",
    companyName: image.companyName || "",
    exportDate: new Date().toISOString(),
    status: "ready"
  };
};

/**
 * حفظ بيانات الصور في localStorage
 */
export const saveToLocalStorage = (images: ImageData[]): number => {
  try {
    // تحويل فقط الصور المكتملة ذات البيانات الكافية
    const items = images
      .filter(img => img.status === "completed" && img.code && img.senderName && img.phoneNumber)
      .map(img => convertImageToBookmarkletItem(img))
      .filter(item => item !== null) as BookmarkletItem[];

    if (items.length === 0) {
      return 0;
    }

    const exportData: BookmarkletExportData = {
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      items
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(exportData));
    return items.length;
  } catch (error) {
    console.error("خطأ في حفظ البيانات:", error);
    return 0;
  }
};

/**
 * قراءة البيانات المخزنة من localStorage
 */
export const getFromLocalStorage = (): BookmarkletExportData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    return JSON.parse(data) as BookmarkletExportData;
  } catch (error) {
    console.error("خطأ في قراءة البيانات:", error);
    return null;
  }
};

/**
 * تحديد عدد العناصر المخزنة وجاهزة للاستخدام
 */
export const getStoredItemsCount = (): number => {
  const data = getFromLocalStorage();
  if (!data) return 0;
  return data.items.length;
};

/**
 * مسح البيانات المخزنة
 */
export const clearStoredItems = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * تحديث حالة عنصر محدد
 */
export const updateItemStatus = (id: string, status: "ready" | "pending" | "success" | "error", message?: string): boolean => {
  try {
    const data = getFromLocalStorage();
    if (!data) return false;

    const updatedItems = data.items.map(item => {
      if (item.id === id) {
        return { ...item, status, message };
      }
      return item;
    });

    const updatedData = {
      ...data,
      items: updatedItems
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error("خطأ في تحديث حالة العنصر:", error);
    return false;
  }
};

/**
 * إنشاء كود Bookmarklet محسن للاستخدام في المتصفح
 * مع تحسين واجهة المستخدم وزيادة التوافق مع المواقع المختلفة
 */
export const generateBookmarkletCode = (): string => {
  // الكود المحسن للـ Bookmarklet
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
      styles.innerHTML = \`
        .bm-control {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          direction: rtl;
          position: fixed;
          top: 10px;
          right: 10px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          width: 320px;
          z-index: 9999999;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid #eaeaea;
        }
        .bm-header {
          padding: 12px 15px;
          border-bottom: 1px solid #eaeaea;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bm-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        .bm-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #666;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .bm-close:hover {
          background: #f5f5f5;
          color: #333;
        }
        .bm-content {
          padding: 12px 15px;
        }
        .bm-info {
          margin-bottom: 15px;
          font-size: 14px;
          color: #555;
          padding: 8px 12px;
          background: #f9f9f9;
          border-radius: 6px;
        }
        .bm-btn {
          display: block;
          width: 100%;
          padding: 10px 15px;
          border: none;
          border-radius: 6px;
          margin: 8px 0;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }
        .bm-btn-primary {
          background: #4CAF50;
          color: white;
        }
        .bm-btn-primary:hover {
          background: #43A047;
        }
        .bm-btn-secondary {
          background: #f1f1f1;
          color: #333;
        }
        .bm-btn-secondary:hover {
          background: #e5e5e5;
        }
        .bm-btn-danger {
          background: #ff5252;
          color: white;
        }
        .bm-btn-danger:hover {
          background: #e64a4a;
        }
        .bm-item {
          padding: 10px;
          margin: 8px 0;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          background: #f9f9f9;
        }
        .bm-item-title {
          font-weight: 600;
          margin-bottom: 5px;
          font-size: 14px;
        }
        .bm-item-detail {
          font-size: 12px;
          color: #666;
        }
        .bm-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        .bm-badge-success {
          background: #e6f7e6;
          color: #43A047;
        }
        .bm-badge-pending {
          background: #fff8e6;
          color: #F9A825;
        }
        .bm-badge-error {
          background: #ffebee;
          color: #e64a4a;
        }
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
          fillForm(items[0]);
        }
      };
      actionsDiv.appendChild(fillFirstButton);
      
      // إضافة زر "إدخال جميع البيانات"
      const fillAllButton = document.createElement("button");
      fillAllButton.className = "bm-btn bm-btn-secondary";
      fillAllButton.innerHTML = '<span>إظهار جميع العناصر</span>';
      fillAllButton.onclick = function() {
        showAllItems();
      };
      actionsDiv.appendChild(fillAllButton);
      
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
        // البحث عن حقول النموذج استنادًا إلى السمات والأسماء الشائعة
        const fields = document.querySelectorAll('input, select, textarea');
        console.log("وجدت", fields.length, "حقل إدخال");
        
        // تتبع ما إذا تم ملء أي حقول
        let filledFields = 0;
        
        fields.forEach(field => {
          // تجميع كل المعرّفات المحتملة للحقل
          const name = field.name ? field.name.toLowerCase() : '';
          const id = field.id ? field.id.toLowerCase() : '';
          const className = field.className ? field.className.toLowerCase() : '';
          const placeholderText = field.placeholder ? field.placeholder.toLowerCase() : '';
          const labelFor = field.labels && field.labels[0] ? field.labels[0].textContent.toLowerCase() : '';
          
          // إيجاد عنصر label المرتبط بالحقل إذا كان موجودًا
          let labelText = '';
          if (field.id) {
            const associatedLabel = document.querySelector('label[for="' + field.id + '"]');
            if (associatedLabel) {
              labelText = associatedLabel.textContent.toLowerCase();
            }
          }
          
          // البحث في النص المجاور عن أدلة على محتوى الحقل
          let nearbyText = '';
          let parent = field.parentElement;
          for (let i = 0; i < 3 && parent; i++) {
            nearbyText += parent.textContent ? parent.textContent.toLowerCase() : '';
            parent = parent.parentElement;
          }
          
          // جمع كل المدخلات المحتملة للبحث
          const searchables = [name, id, className, placeholderText, labelText, labelFor, nearbyText];
          
          // مطابقة الحقول بشكل أكثر تفصيلاً
          if (matchesAny(searchables, ['code', 'كود', 'رمز', 'رقم الوصل', 'رقم الشحنة'])) {
            field.value = item.code;
            triggerInputEvents(field);
            filledFields++;
          }
          else if (matchesAny(searchables, ['sender', 'name', 'customer', 'اسم', 'المرسل', 'الزبون', 'العميل'])) {
            field.value = item.senderName;
            triggerInputEvents(field);
            filledFields++;
          }
          else if (matchesAny(searchables, ['phone', 'mobile', 'هاتف', 'موبايل', 'جوال', 'رقم الهاتف'])) {
            // تنسيق رقم الهاتف (إزالة المسافات والرموز غير الرقمية)
            const formattedPhone = item.phoneNumber.replace(/\D/g, '');
            field.value = formattedPhone;
            triggerInputEvents(field);
            filledFields++;
          }
          else if (matchesAny(searchables, ['province', 'state', 'city', 'region', 'محافظة', 'المحافظة', 'مدينة', 'منطقة'])) {
            if (field.tagName === 'SELECT') {
              // محاولة مطابقة قيمة المحافظة مع الخيارات المتاحة
              let found = false;
              Array.from(field.options).forEach(option => {
                const optionText = option.text.toLowerCase();
                if (optionText.includes(item.province.toLowerCase())) {
                  field.value = option.value;
                  found = true;
                }
              });
              
              // إذا لم نجد تطابقًا مباشرًا، نحاول البحث عن تطابق مرن
              if (!found) {
                const provinceWords = item.province.toLowerCase().split(' ');
                Array.from(field.options).forEach(option => {
                  const optionText = option.text.toLowerCase();
                  if (provinceWords.some(word => optionText.includes(word) && word.length > 2)) {
                    field.value = option.value;
                  }
                });
              }
            } else {
              field.value = item.province;
            }
            triggerInputEvents(field);
            filledFields++;
          }
          else if (matchesAny(searchables, ['price', 'amount', 'cost', 'سعر', 'المبلغ', 'التكلفة', 'قيمة'])) {
            // تنسيق السعر (إزالة العملة والرموز)
            const formattedPrice = item.price.replace(/[^\d.]/g, '');
            field.value = formattedPrice;
            triggerInputEvents(field);
            filledFields++;
          }
          else if (matchesAny(searchables, ['company', 'business', 'vendor', 'شركة', 'الشركة', 'المتجر', 'البائع'])) {
            field.value = item.companyName;
            triggerInputEvents(field);
            filledFields++;
          }
        });
        
        // إظهار رسالة نجاح أو فشل
        if (filledFields > 0) {
          showNotification("تم ملء " + filledFields + " حقول بنجاح", "success");
        } else {
          showNotification("لم نتمكن من العثور على حقول مناسبة. حاول ملء البيانات يدويًا", "error");
        }
      }
      
      // وظيفة لإطلاق أحداث تغيير وإدخال لتحديث الحقل
      function triggerInputEvents(field) {
        // تشغيل أحداث متعددة لضمان تحديث الحقل بشكل صحيح
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        
        // محاولة تشغيل أحداث React الافتراضية
        if (typeof React !== 'undefined' && React.events) {
          const reactEvent = new Event('reactInput', { bubbles: true });
          field.dispatchEvent(reactEvent);
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
        notification.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        
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
          document.body.removeChild(notification);
        }, 3000);
      }
      
      // وظيفة لعرض جميع العناصر
      function showAllItems() {
        const container = document.getElementById('bm-items-container');
        
        // تبديل عرض قائمة العناصر
        if (container.style.display === "none") {
          container.style.display = "block";
          fillAllButton.innerHTML = '<span>إخفاء العناصر</span>';
          
          // إنشاء قائمة العناصر
          container.innerHTML = '';
          
          items.forEach((item, index) => {
            const itemElement = document.createElement("div");
            itemElement.className = "bm-item";
            
            const title = document.createElement("div");
            title.className = "bm-item-title";
            title.textContent = \`\${index + 1}. \${item.senderName} - \${item.code}\`;
            
            const details = document.createElement("div");
            details.className = "bm-item-detail";
            details.innerHTML = \`
              رقم الهاتف: \${item.phoneNumber}<br>
              المحافظة: \${item.province}<br>
              \${item.price ? 'السعر: ' + item.price : ''}
            \`;
            
            const actionBtn = document.createElement("button");
            actionBtn.className = "bm-btn bm-btn-secondary";
            actionBtn.textContent = "إدخال هذا الوصل";
            actionBtn.style.marginTop = "8px";
            actionBtn.onclick = function(e) {
              e.preventDefault();
              fillForm(item);
            };
            
            itemElement.appendChild(title);
            itemElement.appendChild(details);
            itemElement.appendChild(actionBtn);
            container.appendChild(itemElement);
          });
        } else {
          container.style.display = "none";
          fillAllButton.innerHTML = '<span>إظهار جميع العناصر</span>';
        }
      }
      
      // وظيفة للتحقق مما إذا كانت أي قيمة تطابق أحد المفاتيح
      function matchesAny(values, keys) {
        for (const value of values) {
          if (!value) continue;
          for (const key of keys) {
            if (value.includes(key)) {
              return true;
            }
          }
        }
        return false;
      }
      
    } catch (error) {
      console.error("خطأ في تنفيذ البوكماركلت:", error);
      alert("حدث خطأ في تنفيذ الأداة: " + error.message);
    }
  })();
  `;
  
  // تنظيف الكود وإزالة المسافات الزائدة للحصول على حجم أصغر
  const cleanedCode = code
    .replace(/\s{2,}/g, ' ')
    .replace(/\n/g, '')
    .trim();
  
  return `javascript:(${encodeURIComponent('function(){' + cleanedCode + '}')})()`;
};

/**
 * الحصول على معلومات حول البيانات المخزنة للعرض
 */
export const getStorageStats = () => {
  const data = getFromLocalStorage();
  if (!data) {
    return {
      total: 0,
      ready: 0,
      success: 0,
      error: 0,
      lastUpdate: null
    };
  }
  
  return {
    total: data.items.length,
    ready: data.items.filter(item => item.status === "ready").length,
    success: data.items.filter(item => item.status === "success").length,
    error: data.items.filter(item => item.status === "error").length,
    lastUpdate: new Date(data.exportDate)
  };
};

