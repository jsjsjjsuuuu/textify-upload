
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
    
    // تعبئة الحقول في النموذج
    function fillFormFields(item) {
      // تضمين تنفيذ دالة fillFormFields هنا مباشرة
      if (!item) return { filled: [], failed: [], message: 'لا توجد بيانات', success: false, attempted: 0 };
      
      console.log("بدء ملء النموذج بالبيانات:", item);
      
      // تعريف خريطة الحقول
      const fieldMappings = [
        {
          key: 'code',
          label: 'رقم الوصل',
          value: item.code || '',
          selectors: [
            'input[name*="code"]',
            'input[id*="code"]',
            'input[placeholder*="رقم الوصل"]',
            'input[placeholder*="رقم البوليصة"]'
          ]
        },
        {
          key: 'phoneNumber',
          label: 'رقم الهاتف',
          value: item.phoneNumber ? item.phoneNumber.replace(/\\D/g, '') : '',
          selectors: [
            'input[name*="phone"]',
            'input[id*="phone"]',
            'input[type="tel"]',
            'input[placeholder*="رقم الهاتف"]',
            'input[placeholder*="موبايل"]'
          ]
        },
        {
          key: 'senderName',
          label: 'اسم المرسل',
          value: item.senderName || item.customerName || '',
          selectors: [
            'input[name*="sender"]',
            'input[name*="customer"]',
            'input[id*="sender"]',
            'input[placeholder*="اسم المرسل"]',
            'input[placeholder*="اسم العميل"]'
          ]
        },
        {
          key: 'recipientName',
          label: 'اسم المستلم',
          value: item.recipientName || '',
          selectors: [
            'input[name*="recipient"]',
            'input[name*="receiver"]',
            'input[id*="recipient"]',
            'input[placeholder*="اسم المستلم"]'
          ]
        },
        {
          key: 'province',
          label: 'المحافظة',
          value: item.province || '',
          selectors: [
            'select[name*="province"]',
            'select[id*="province"]',
            'select[name*="city"]',
            'select[placeholder*="المحافظة"]'
          ]
        },
        {
          key: 'price',
          label: 'المبلغ',
          value: item.price ? item.price.replace(/[^\\d.]/g, '') : '',
          selectors: [
            'input[name*="price"]',
            'input[name*="amount"]',
            'input[id*="price"]',
            'input[placeholder*="المبلغ"]',
            'input[type="number"]'
          ]
        }
      ];
      
      // تتبع الحقول المملوءة والفاشلة
      const results = {
        filled: [],
        failed: [],
        message: '',
        success: false,
        attempted: 0
      };
      
      // البحث في عناصر الصفحة ومحاولة ملئها
      fieldMappings.forEach(mapping => {
        results.attempted++;
        
        // البحث عن العنصر في الصفحة
        let foundElement = null;
        
        for (const selector of mapping.selectors) {
          try {
            const element = document.querySelector(selector);
            if (element) {
              foundElement = element;
              break;
            }
          } catch (error) {
            console.warn(\`خطأ في البحث عن العنصر: \${selector}\`, error);
          }
        }
        
        // إذا وجدنا عنصرًا وكان لدينا قيمة، نحاول ملئه
        if (foundElement && mapping.value) {
          try {
            // تحديد نوع العنصر وملئه بالطريقة المناسبة
            const tagName = foundElement.tagName.toLowerCase();
            
            if (tagName === 'select') {
              // للقوائم المنسدلة
              const options = Array.from(foundElement.options);
              
              // البحث عن تطابق دقيق أو جزئي
              const exactMatch = options.find(opt => 
                opt.text.trim().toLowerCase() === mapping.value.toLowerCase() || 
                opt.value.toLowerCase() === mapping.value.toLowerCase()
              );
              
              if (exactMatch) {
                // تعيين القيمة باستخدام قيمة الخيار
                foundElement.value = exactMatch.value;
                console.log(\`تم ملء القائمة المنسدلة: \${mapping.key} بالقيمة: \${exactMatch.text}\`);
                results.filled.push(mapping.key);
              } else {
                // البحث عن تطابق جزئي
                const partialMatch = options.find(opt => 
                  opt.text.trim().toLowerCase().includes(mapping.value.toLowerCase()) || 
                  mapping.value.toLowerCase().includes(opt.text.trim().toLowerCase())
                );
                
                if (partialMatch) {
                  foundElement.value = partialMatch.value;
                  console.log(\`تم ملء القائمة المنسدلة (تطابق جزئي): \${mapping.key} بالقيمة: \${partialMatch.text}\`);
                  results.filled.push(mapping.key);
                } else {
                  console.log(\`لم يتم العثور على خيار مطابق للقيمة: \${mapping.value}\`);
                  results.failed.push(mapping.key);
                }
              }
              
              // إطلاق حدث التغيير
              const event = new Event('change', { bubbles: true });
              foundElement.dispatchEvent(event);
            } else if (tagName === 'input' || tagName === 'textarea') {
              // للحقول النصية
              if (foundElement.type === 'checkbox' || foundElement.type === 'radio') {
                // للمربعات أو أزرار الاختيار
                const shouldCheck = mapping.value === 'true' || mapping.value === '1' || mapping.value.toLowerCase() === 'نعم';
                foundElement.checked = shouldCheck;
              } else {
                // للحقول النصية العادية
                foundElement.value = mapping.value;
              }
              
              // إطلاق أحداث التغيير والإدخال
              ['input', 'change', 'blur'].forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                foundElement.dispatchEvent(event);
              });
              
              console.log(\`تم ملء الحقل: \${mapping.key} بالقيمة: \${mapping.value}\`);
              results.filled.push(mapping.key);
            } else {
              // لأنواع الحقول الأخرى
              console.log(\`نوع حقل غير معروف: \${tagName}\`);
              results.failed.push(mapping.key);
            }
          } catch (error) {
            console.error(\`خطأ في ملء الحقل \${mapping.key}:\`, error);
            results.failed.push(mapping.key);
          }
        } else {
          // إذا لم نجد العنصر أو لم تكن هناك قيمة
          if (!foundElement) {
            console.log(\`لم يتم العثور على عنصر للحقل: \${mapping.key}\`);
          } else {
            console.log(\`لا توجد قيمة للحقل: \${mapping.key}\`);
          }
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
