
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
 * إنشاء كود Bookmarklet للاستخدام في المتصفح
 */
export const generateBookmarkletCode = (): string => {
  // الكود الأساسي للـ Bookmarklet - سيتم تحسينه لاحقًا
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
      
      // إنشاء واجهة التحكم
      const controlPanel = document.createElement("div");
      controlPanel.style.position = "fixed";
      controlPanel.style.top = "10px";
      controlPanel.style.right = "10px";
      controlPanel.style.backgroundColor = "white";
      controlPanel.style.border = "1px solid #ddd";
      controlPanel.style.borderRadius = "5px";
      controlPanel.style.padding = "10px";
      controlPanel.style.zIndex = "9999";
      controlPanel.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
      controlPanel.style.minWidth = "300px";
      controlPanel.style.direction = "rtl";
      controlPanel.style.fontFamily = "system-ui, -apple-system, sans-serif";
      
      // إضافة العنوان
      const title = document.createElement("h3");
      title.style.margin = "0 0 10px 0";
      title.style.fontSize = "16px";
      title.textContent = "أداة إدخال البيانات التلقائي";
      controlPanel.appendChild(title);
      
      // إضافة معلومات العناصر
      const info = document.createElement("p");
      info.style.margin = "0 0 10px 0";
      info.style.fontSize = "14px";
      info.textContent = "العناصر المتاحة: " + items.length;
      controlPanel.appendChild(info);
      
      // إضافة زر الإغلاق
      const closeButton = document.createElement("button");
      closeButton.style.position = "absolute";
      closeButton.style.top = "5px";
      closeButton.style.left = "5px";
      closeButton.style.background = "none";
      closeButton.style.border = "none";
      closeButton.style.cursor = "pointer";
      closeButton.style.fontSize = "16px";
      closeButton.textContent = "×";
      closeButton.onclick = function() {
        document.body.removeChild(controlPanel);
      };
      controlPanel.appendChild(closeButton);
      
      // إضافة زر "إدخال بيانات أول عنصر"
      const fillFirstButton = document.createElement("button");
      fillFirstButton.style.display = "block";
      fillFirstButton.style.width = "100%";
      fillFirstButton.style.padding = "8px";
      fillFirstButton.style.margin = "5px 0";
      fillFirstButton.style.backgroundColor = "#4CAF50";
      fillFirstButton.style.color = "white";
      fillFirstButton.style.border = "none";
      fillFirstButton.style.borderRadius = "4px";
      fillFirstButton.style.cursor = "pointer";
      fillFirstButton.textContent = "إدخال بيانات أول عنصر";
      fillFirstButton.onclick = function() {
        if (items.length > 0) {
          fillForm(items[0]);
        }
      };
      controlPanel.appendChild(fillFirstButton);
      
      document.body.appendChild(controlPanel);
      
      // وظيفة تعبئة النموذج
      function fillForm(item) {
        // البحث عن حقول النموذج استنادًا إلى السمات والأسماء الشائعة
        const fields = document.querySelectorAll('input, select, textarea');
        console.log("وجدت", fields.length, "حقل إدخال");
        
        fields.forEach(field => {
          const name = field.name.toLowerCase();
          const id = field.id.toLowerCase();
          const placeholderText = field.placeholder ? field.placeholder.toLowerCase() : '';
          const labelText = field.labels && field.labels[0] ? field.labels[0].textContent.toLowerCase() : '';
          
          // مطابقة الحقول استنادًا إلى الاسم أو السمة
          if (name.includes('code') || id.includes('code') || placeholderText.includes('code') || labelText.includes('كود')) {
            field.value = item.code;
          }
          else if (name.includes('name') || id.includes('name') || placeholderText.includes('name') || labelText.includes('اسم المرسل')) {
            field.value = item.senderName;
          }
          else if (name.includes('phone') || id.includes('phone') || placeholderText.includes('phone') || labelText.includes('هاتف')) {
            field.value = item.phoneNumber;
          }
          else if (name.includes('province') || id.includes('province') || placeholderText.includes('province') || labelText.includes('محافظة')) {
            if (field.tagName === 'SELECT') {
              // محاولة مطابقة قيمة المحافظة مع الخيارات المتاحة
              Array.from(field.options).forEach(option => {
                if (option.text.includes(item.province)) {
                  field.value = option.value;
                }
              });
            } else {
              field.value = item.province;
            }
          }
          else if (name.includes('price') || id.includes('price') || placeholderText.includes('price') || labelText.includes('سعر')) {
            field.value = item.price;
          }
          else if (name.includes('company') || id.includes('company') || placeholderText.includes('company') || labelText.includes('شركة')) {
            field.value = item.companyName;
          }
          
          // إطلاق حدث تغيير للحقل
          const event = new Event('input', { bubbles: true });
          field.dispatchEvent(event);
          field.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        alert("تم ملء النموذج بنجاح!");
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
    .replace(/\/\/.+?(?=\s|$)/g, '')
    .trim();
  
  return `javascript:(${encodeURIComponent('function(){' + cleanedCode + '}')})()`;
};
