
/**
 * كود إنشاء واجهة المستخدم للبوكماركلت
 */

export const createUICode = `function() {
  console.log("[UI] إنشاء واجهة المستخدم للبوكماركلت");
  
  // التحقق من عدم وجود الواجهة مسبقًا
  if (document.getElementById("bookmarklet-ui-container")) {
    console.log("[UI] واجهة المستخدم موجودة بالفعل");
    return;
  }
  
  // الحصول على البيانات من التخزين
  const data = window.bookmarkletStorage.getFromStorage();
  if (!data || !data.items || data.items.length === 0) {
    alert("لا توجد بيانات متاحة. يرجى تصدير البيانات أولاً من التطبيق.");
    return;
  }
  
  // إنشاء عنصر الحاوية الرئيسية
  const container = document.createElement("div");
  container.id = "bookmarklet-ui-container";
  container.style.position = "fixed";
  container.style.top = "20px";
  container.style.right = "20px";
  container.style.width = "320px";
  container.style.backgroundColor = "#ffffff";
  container.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
  container.style.borderRadius = "8px";
  container.style.zIndex = "9999";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.direction = "rtl";
  
  // إنشاء الرأس
  const header = document.createElement("div");
  header.style.padding = "12px 16px";
  header.style.borderBottom = "1px solid #eee";
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  
  const title = document.createElement("h3");
  title.textContent = "أداة ملء البيانات";
  title.style.margin = "0";
  title.style.fontSize = "16px";
  title.style.fontWeight = "bold";
  
  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.style.background = "none";
  closeButton.style.border = "none";
  closeButton.style.fontSize = "20px";
  closeButton.style.cursor = "pointer";
  closeButton.style.padding = "0";
  closeButton.onclick = function() {
    document.body.removeChild(container);
  };
  
  header.appendChild(title);
  header.appendChild(closeButton);
  container.appendChild(header);
  
  // إنشاء محتوى الواجهة
  const content = document.createElement("div");
  content.style.padding = "16px";
  
  // عرض معلومات عن البيانات
  const info = document.createElement("div");
  info.style.marginBottom = "16px";
  info.style.fontSize = "14px";
  info.style.color = "#666";
  info.textContent = "عدد السجلات: " + data.items.length;
  content.appendChild(info);
  
  // إنشاء قائمة اختيار السجل
  const selectContainer = document.createElement("div");
  selectContainer.style.marginBottom = "16px";
  
  const selectLabel = document.createElement("label");
  selectLabel.textContent = "اختر السجل:";
  selectLabel.style.display = "block";
  selectLabel.style.marginBottom = "8px";
  selectLabel.style.fontSize = "14px";
  
  const select = document.createElement("select");
  select.style.width = "100%";
  select.style.padding = "8px 12px";
  select.style.borderRadius = "4px";
  select.style.border = "1px solid #ddd";
  select.style.boxSizing = "border-box";
  
  data.items.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index.toString();
    option.textContent = \`\${item.code || ""} - \${item.senderName || ""}\`;
    select.appendChild(option);
  });
  
  selectContainer.appendChild(selectLabel);
  selectContainer.appendChild(select);
  content.appendChild(selectContainer);
  
  // زر ملء النموذج
  const fillButton = document.createElement("button");
  fillButton.textContent = "ملء النموذج";
  fillButton.style.backgroundColor = "#4CAF50";
  fillButton.style.color = "white";
  fillButton.style.border = "none";
  fillButton.style.borderRadius = "4px";
  fillButton.style.padding = "10px 16px";
  fillButton.style.width = "100%";
  fillButton.style.cursor = "pointer";
  fillButton.style.fontSize = "14px";
  fillButton.style.marginBottom = "12px";
  
  fillButton.onclick = function() {
    const selectedIndex = parseInt(select.value);
    const selectedItem = data.items[selectedIndex];
    
    // استخدام نظام ملء النماذج المحسن إذا كان متاحًا
    if (window.bookmarkletControls && window.bookmarkletControls.enhancedFormFiller) {
      // استخدام النظام المحسن
      window.bookmarkletControls.enhancedFormFiller(selectedItem)
        .then(result => {
          showNotification(result.success, result.message);
          if (result.success) {
            window.bookmarkletStorage.updateItemStatus(selectedItem.id, "success", "تم ملء النموذج بنجاح");
          } else {
            window.bookmarkletStorage.updateItemStatus(selectedItem.id, "error", result.message);
          }
        })
        .catch(error => {
          showNotification(false, "حدث خطأ: " + error.message);
          window.bookmarkletStorage.updateItemStatus(selectedItem.id, "error", error.message);
        });
    } else {
      alert("نظام ملء النماذج المحسن غير متاح!");
    }
  };
  
  content.appendChild(fillButton);
  
  // زر التحكم في السيلينيوم (إذا كان متاحًا)
  if (window.bookmarkletControls && window.bookmarkletControls.createSeleniumController) {
    const seleniumButton = document.createElement("button");
    seleniumButton.textContent = "وضع التحكم المتقدم";
    seleniumButton.style.backgroundColor = "#2196F3";
    seleniumButton.style.color = "white";
    seleniumButton.style.border = "none";
    seleniumButton.style.borderRadius = "4px";
    seleniumButton.style.padding = "10px 16px";
    seleniumButton.style.width = "100%";
    seleniumButton.style.cursor = "pointer";
    seleniumButton.style.fontSize = "14px";
    seleniumButton.style.marginBottom = "12px";
    
    seleniumButton.onclick = function() {
      const selectedIndex = parseInt(select.value);
      const selectedItem = data.items[selectedIndex];
      
      const customCode = prompt(
        "أدخل شفرة التحكم المخصصة (يمكنك ضبط هذه الشفرة لتناسب الموقع الحالي):",
        \`const controller = window.bookmarkletControls.createSeleniumController(data.items[\${selectedIndex}]);
controller
  .setDebugMode(true)
  .waitForPageLoad()
  .typeText('#customerCode', data.items[\${selectedIndex}].code)
  .typeText('#customerName', data.items[\${selectedIndex}].senderName)
  .execute();\`
      );
      
      if (customCode) {
        try {
          console.log("[Selenium] تنفيذ الشفرة المخصصة:", customCode);
          eval(customCode);
        } catch (error) {
          console.error("[Selenium] خطأ في تنفيذ الشفرة المخصصة:", error);
          alert("حدث خطأ في تنفيذ الشفرة: " + error.message);
        }
      }
    };
    
    content.appendChild(seleniumButton);
  }
  
  // دالة إظهار الإشعارات
  const showNotification = function(success, message) {
    const notification = document.createElement("div");
    notification.style.padding = "12px";
    notification.style.borderRadius = "4px";
    notification.style.marginTop = "16px";
    notification.style.backgroundColor = success ? "#e8f5e9" : "#ffebee";
    notification.style.color = success ? "#388e3c" : "#d32f2f";
    notification.style.border = success ? "1px solid #c8e6c9" : "1px solid #ffcdd2";
    notification.textContent = message;
    
    // إزالة الإشعارات السابقة
    const oldNotifications = content.querySelectorAll(".notification");
    oldNotifications.forEach(n => content.removeChild(n));
    
    notification.className = "notification";
    content.appendChild(notification);
  };
  
  container.appendChild(content);
  document.body.appendChild(container);
}`;
