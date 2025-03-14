
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
    
    const title = document.createElement("h3");
    title.textContent = "أداة ملء البيانات";
    title.style.marginBottom = "10px";
    controlPanel.appendChild(title);
    
    const info = document.createElement("p");
    info.textContent = "عدد العناصر المخزنة: " + items.length;
    info.style.fontSize = "12px";
    info.style.color = "#666";
    controlPanel.appendChild(info);
    
    const fillButton = document.createElement("button");
    fillButton.textContent = "املأ النموذج";
    fillButton.style.backgroundColor = "#4CAF50";
    fillButton.style.color = "white";
    fillButton.style.border = "none";
    fillButton.style.padding = "8px 12px";
    fillButton.style.borderRadius = "4px";
    fillButton.style.cursor = "pointer";
    fillButton.style.marginTop = "10px";
    fillButton.addEventListener("click", function() {
      if (items.length > 0) {
        const result = fillFormFields(items[0]);
        alert(result.message);
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
    closeButton.style.marginLeft = "10px";
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
