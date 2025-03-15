
/**
 * توليد شفرة البوكماركلت
 */

import { convertCodeToBookmarklet } from './converter';
import { STORAGE_KEY } from '../bookmarkletService';
import { initEnhancedFormFiller } from './enhancedFormFiller';
import { fillFormFields } from './fieldFiller';

// إنشاء شفرة البوكماركلت
export function generateBookmarkletCode(): string {
  const code = `
(function() {
  try {
    // التحقق من وجود البيانات
    const storageKey = "${STORAGE_KEY}";
    const data = localStorage.getItem(storageKey);
    
    if (!data) {
      alert("لا توجد بيانات مخزنة للاستخدام. يرجى تصدير البيانات أولاً من التطبيق.");
      return;
    }
    
    // تحليل البيانات
    const parsedData = JSON.parse(data);
    const items = parsedData.items || [];
    
    if (items.length === 0) {
      alert("لا توجد عناصر مخزنة للاستخدام.");
      return;
    }
    
    const fillFormFields = ${fillFormFields.toString()};
    
    // إنشاء واجهة التحكم
    const controlPanel = document.createElement("div");
    controlPanel.style.position = "fixed";
    controlPanel.style.top = "10px";
    controlPanel.style.left = "10px";
    controlPanel.style.backgroundColor = "white";
    controlPanel.style.border = "1px solid #ccc";
    controlPanel.style.padding = "10px";
    controlPanel.style.zIndex = "10000";
    controlPanel.style.borderRadius = "5px";
    controlPanel.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    controlPanel.style.direction = "rtl";
    controlPanel.style.fontFamily = "Arial, sans-serif";
    controlPanel.style.maxWidth = "350px";
    controlPanel.style.minWidth = "300px";
    
    const title = document.createElement("h3");
    title.textContent = "أداة ملء البيانات";
    title.style.marginBottom = "10px";
    title.style.fontSize = "16px";
    title.style.fontWeight = "bold";
    title.style.borderBottom = "1px solid #eee";
    title.style.paddingBottom = "5px";
    controlPanel.appendChild(title);
    
    const info = document.createElement("p");
    info.textContent = "عدد العناصر المخزنة: " + items.length;
    info.style.fontSize = "12px";
    info.style.color = "#666";
    info.style.margin = "5px 0";
    controlPanel.appendChild(info);
    
    // إضافة قائمة منسدلة للعناصر
    const selectContainer = document.createElement("div");
    selectContainer.style.margin = "10px 0";
    
    const selectLabel = document.createElement("label");
    selectLabel.textContent = "اختر العنصر:";
    selectLabel.style.display = "block";
    selectLabel.style.fontSize = "12px";
    selectLabel.style.marginBottom = "5px";
    selectContainer.appendChild(selectLabel);
    
    const select = document.createElement("select");
    select.style.width = "100%";
    select.style.padding = "5px";
    select.style.borderRadius = "4px";
    select.style.border = "1px solid #ccc";
    
    items.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = index.toString();
      option.textContent = \`\${item.code || ''} - \${item.senderName || ''}\`;
      select.appendChild(option);
    });
    
    selectContainer.appendChild(select);
    controlPanel.appendChild(selectContainer);
    
    const fillButton = document.createElement("button");
    fillButton.textContent = "املأ النموذج";
    fillButton.style.backgroundColor = "#4CAF50";
    fillButton.style.color = "white";
    fillButton.style.border = "none";
    fillButton.style.padding = "8px 12px";
    fillButton.style.borderRadius = "4px";
    fillButton.style.cursor = "pointer";
    fillButton.style.marginTop = "10px";
    fillButton.style.width = "100%";
    fillButton.addEventListener("click", function() {
      const selectedIndex = parseInt(select.value);
      if (!isNaN(selectedIndex) && items[selectedIndex]) {
        const result = fillFormFields(items[selectedIndex]);
        const notification = document.createElement("div");
        notification.textContent = result.message;
        notification.style.marginTop = "10px";
        notification.style.padding = "8px";
        notification.style.borderRadius = "4px";
        notification.style.fontSize = "12px";
        notification.style.backgroundColor = result.success ? "#e8f5e9" : "#ffebee";
        notification.style.color = result.success ? "#2e7d32" : "#c62828";
        notification.style.border = result.success ? "1px solid #a5d6a7" : "1px solid #ef9a9a";
        
        // إزالة الإشعارات السابقة
        const oldNotifications = controlPanel.querySelectorAll('.fill-notification');
        oldNotifications.forEach(n => controlPanel.removeChild(n));
        
        notification.className = "fill-notification";
        controlPanel.appendChild(notification);
      } else {
        alert("لا توجد عناصر لملء النموذج.");
      }
    });
    controlPanel.appendChild(fillButton);
    
    const closeButton = document.createElement("button");
    closeButton.textContent = "إغلاق";
    closeButton.style.backgroundColor = "#f44336";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.padding = "6px 10px";
    closeButton.style.borderRadius = "4px";
    closeButton.style.cursor = "pointer";
    closeButton.style.marginTop = "10px";
    closeButton.style.width = "100%";
    closeButton.addEventListener("click", function() {
      document.body.removeChild(controlPanel);
    });
    controlPanel.appendChild(closeButton);
    
    document.body.appendChild(controlPanel);
  } catch (error) {
    console.error("خطأ في تنفيذ البوكماركلت:", error);
    alert("حدث خطأ في تنفيذ الأداة: " + error.message);
  }
})();
`;

  // تحويل الشفرة إلى رابط JavaScript
  return convertCodeToBookmarklet(code);
}

// إنشاء شفرة البوكماركلت المحسّن
export function generateEnhancedBookmarkletCode(): string {
  const code = `
(function() {
  try {
    const initEnhancedFormFiller = ${initEnhancedFormFiller.toString()};
    
    // تشغيل محرك ملء النماذج المحسّن
    initEnhancedFormFiller();
  } catch (error) {
    console.error("خطأ في تنفيذ أداة الإدخال التلقائي المحسّنة:", error);
    alert("حدث خطأ في تنفيذ الأداة: " + error.message);
  }
})();
`;

  // تحويل الشفرة إلى رابط JavaScript
  return convertCodeToBookmarklet(code);
}
