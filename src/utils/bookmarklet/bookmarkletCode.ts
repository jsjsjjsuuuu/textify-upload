
import { fillFormFields } from './fieldFiller';
import { STORAGE_KEY, BookmarkletItem, BookmarkletExportData } from './types';
import { updateItemStatus } from './storage';

/**
 * إنشاء كود البوكماركلت الذي سيتم تنفيذه في المتصفح
 */
export const generateBookmarkletCode = (): string => {
  // كود البوكماركلت الأساسي
  const bookmarkletCode = `
  (function() {
    // وظائف مساعدة للتعامل مع التخزين المحلي
    const STORAGE_KEY = "${STORAGE_KEY}";
    
    // استخراج البيانات من التخزين المحلي
    function getStoredData() {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error("خطأ في قراءة البيانات المخزنة:", error);
        showMessage("خطأ في قراءة البيانات المخزنة. تأكد من تصدير البيانات أولاً.", "error");
        return null;
      }
    }
    
    // تحديث حالة عنصر في التخزين المحلي
    function updateItemStatus(id, status, message) {
      try {
        const data = getStoredData();
        if (!data) return;
        
        const updatedItems = data.items.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: status,
              message: message,
              lastUpdated: new Date().toISOString(),
              fieldsAttempted: item.fieldsAttempted || 0,
              fieldsFilled: item.fieldsFilled || 0
            };
          }
          return item;
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...data,
          items: updatedItems,
          lastUpdated: new Date().toISOString()
        }));
        
        return true;
      } catch (error) {
        console.error("خطأ في تحديث حالة العنصر:", error);
        return false;
      }
    }
    
    // تحديث معلومات عملية ملء الحقول لعنصر
    function updateFillInfo(id, fillInfo) {
      try {
        const data = getStoredData();
        if (!data) return;
        
        const updatedItems = data.items.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: fillInfo.success ? "success" : "error",
              message: fillInfo.message,
              lastUpdated: new Date().toISOString(),
              fieldsAttempted: (item.fieldsAttempted || 0) + fillInfo.attempted,
              fieldsFilled: (item.fieldsFilled || 0) + fillInfo.filled.length,
              errorFields: (item.errorFields || []).concat(fillInfo.failed),
              successFields: (item.successFields || []).concat(fillInfo.filled),
              fillAttemptDate: new Date().toISOString()
            };
          }
          return item;
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...data,
          items: updatedItems,
          lastUpdated: new Date().toISOString()
        }));
        
        return true;
      } catch (error) {
        console.error("خطأ في تحديث معلومات ملء الحقول:", error);
        return false;
      }
    }
    
    // إظهار رسالة للمستخدم
    function showMessage(message, type = "info") {
      // إزالة أي رسالة سابقة
      const existingMessage = document.getElementById("bookmarklet-message");
      if (existingMessage) {
        existingMessage.remove();
      }
      
      // إنشاء عنصر الرسالة
      const messageElement = document.createElement("div");
      messageElement.id = "bookmarklet-message";
      messageElement.style.position = "fixed";
      messageElement.style.top = "20px";
      messageElement.style.right = "20px";
      messageElement.style.zIndex = "9999";
      messageElement.style.maxWidth = "400px";
      messageElement.style.padding = "12px 16px";
      messageElement.style.borderRadius = "8px";
      messageElement.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      messageElement.style.fontFamily = "system-ui, -apple-system, sans-serif";
      messageElement.style.fontSize = "14px";
      messageElement.style.direction = "rtl";
      messageElement.style.transition = "opacity 0.3s ease-in-out";
      
      // تعيين الألوان حسب نوع الرسالة
      switch (type) {
        case "success":
          messageElement.style.backgroundColor = "#ecfdf5";
          messageElement.style.color = "#047857";
          messageElement.style.border = "1px solid #6ee7b7";
          break;
        case "error":
          messageElement.style.backgroundColor = "#fef2f2";
          messageElement.style.color = "#dc2626";
          messageElement.style.border = "1px solid #fca5a5";
          break;
        case "warning":
          messageElement.style.backgroundColor = "#fffbeb";
          messageElement.style.color = "#d97706";
          messageElement.style.border = "1px solid #fcd34d";
          break;
        default:
          messageElement.style.backgroundColor = "#eff6ff";
          messageElement.style.color = "#1d4ed8";
          messageElement.style.border = "1px solid #93c5fd";
      }
      
      messageElement.textContent = message;
      document.body.appendChild(messageElement);
      
      // إخفاء الرسالة بعد 5 ثواني
      setTimeout(() => {
        messageElement.style.opacity = "0";
        setTimeout(() => messageElement.remove(), 300);
      }, 5000);
    }
    
    // البحث عن عنصر واجهة المستخدم
    function findElement(selectors) {
      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element) return element;
        } catch (error) {
          console.warn(\`فشل في العثور على عنصر باستخدام المحدد: \${selector}\`, error);
        }
      }
      return null;
    }
    
    // التحقق من صحة القيمة لنوع الإدخال
    function checkInputTypeCompatibility(element, value) {
      if (element.tagName === 'INPUT') {
        const type = element.getAttribute('type')?.toLowerCase() || 'text';
        
        if (type === 'number' && isNaN(Number(value))) {
          return false;
        }
        
        if (type === 'tel' && !/^[\\d\\s+\\-()]+$/.test(value)) {
          return false;
        }
        
        if (type === 'email' && !value.includes('@')) {
          return false;
        }
        
        if (type === 'date' && isNaN(Date.parse(value))) {
          return false;
        }
      }
      return true;
    }
    
    // ملء حقل إدخال
    function fillInputField(element, value) {
      if (!element || !value) return false;
      
      try {
        if (!checkInputTypeCompatibility(element, value)) {
          return false;
        }
        
        // محاولة تعيين القيمة مباشرة
        element.value = value;
        
        // محاكاة كتابة المستخدم
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(element, value);
        }
        
        // إطلاق الأحداث
        ['input', 'change', 'blur'].forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          element.dispatchEvent(event);
        });
        
        return true;
      } catch (error) {
        console.error(\`خطأ في ملء الحقل: \${error}\`);
        return false;
      }
    }
    
    // البحث عن وملء الحقول
    function fillFormFields(item) {
      const fieldMappings = [
        {
          key: 'customerName',
          selectors: [
            'input[name*="customer"][name*="name"]',
            'input[id*="customer"][id*="name"]',
            'input[name*="sender"]',
            'input[placeholder*="اسم العميل"]',
            'input[placeholder*="اسم المرسل"]'
          ]
        },
        {
          key: 'customerPhone',
          selectors: [
            'input[name*="phone"]',
            'input[type="tel"]',
            'input[placeholder*="رقم الهاتف"]',
            'input[placeholder*="الموبايل"]'
          ]
        },
        {
          key: 'area',
          selectors: [
            'select[name*="area"]',
            'select[name*="city"]',
            'select[name*="province"]',
            'select[placeholder*="المحافظة"]'
          ]
        },
        {
          key: 'totalAmount',
          selectors: [
            'input[name*="amount"]',
            'input[name*="price"]',
            'input[placeholder*="المبلغ"]'
          ]
        }
      ];
      
      const results = {
        filled: [],
        failed: [],
        message: '',
        success: false
      };
      
      fieldMappings.forEach(mapping => {
        const element = findElement(mapping.selectors);
        if (element && item[mapping.key]) {
          const success = fillInputField(element, item[mapping.key]);
          if (success) {
            results.filled.push(mapping.key);
          } else {
            results.failed.push(mapping.key);
          }
        } else {
          results.failed.push(mapping.key);
        }
      });
      
      // تحديث حالة النتائج
      if (results.filled.length > 0) {
        results.success = true;
        results.message = \`تم ملء \${results.filled.length} حقول بنجاح\`;
      } else {
        results.success = false;
        results.message = "لم يتم العثور على حقول مطابقة أو ملؤها";
      }
      
      return results;
    }
    
    // البدء في تنفيذ البوكماركلت
    function init() {
      const data = getStoredData();
      if (!data || !data.items || data.items.length === 0) {
        showMessage("لا توجد بيانات مخزنة. يرجى تصدير البيانات أولاً.", "warning");
        return;
      }
      
      // البحث عن أول عنصر جاهز
      const readyItem = data.items.find(item => item.status === "ready");
      if (!readyItem) {
        showMessage("لا توجد عناصر جاهزة للإدخال.", "warning");
        return;
      }
      
      // تحديث حالة العنصر
      updateItemStatus(readyItem.id, "pending", "جاري ملء الحقول...");
      
      // محاولة ملء الحقول
      const fillResults = fillFormFields(readyItem);
      
      // تحديث معلومات الملء
      updateFillInfo(readyItem.id, {
        ...fillResults,
        attempted: fillResults.filled.length + fillResults.failed.length
      });
      
      // عرض النتيجة للمستخدم
      showMessage(fillResults.message, fillResults.success ? "success" : "error");
    }
    
    // تنفيذ البوكماركلت
    try {
      init();
    } catch (error) {
      console.error("خطأ في تنفيذ البوكماركلت:", error);
      showMessage("حدث خطأ أثناء تنفيذ البوكماركلت.", "error");
    }
  })();
  `;
  
  // إزالة السطور الفارغة والمسافات الزائدة وتشفير النص
  const cleanCode = bookmarkletCode
    .trim()
    .replace(/^\s+/gm, '')
    .replace(/\n/g, '');
  
  // إنشاء رابط البوكماركلت
  return `javascript:${encodeURIComponent(cleanCode)}`;
};
