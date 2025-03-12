
// تصدير الوظائف والأنواع من كافة الملفات الفرعية

// Export main API functions
export { extractDataWithGemini, testGeminiConnection } from "./api";
export { testGeminiModels } from "./models";
export { fileToBase64 } from "./utils";

// Export types
export type { GeminiExtractParams, GeminiRequest, GeminiResponse } from "./types";

/**
 * وظيفة لإنشاء وتصدير البيانات المستخرجة إلى bookmarklet
 */
export const createBookmarkletCode = (imageData: any) => {
  // تصفية البيانات للأوبجكت المصدر
  const exportData = {
    code: imageData.code || "",
    senderName: imageData.senderName || "",
    phoneNumber: imageData.phoneNumber || "",
    province: imageData.province || "",
    price: imageData.price || "",
    companyName: imageData.companyName || ""
  };

  // إنشاء كود الـ bookmarklet
  const bookmarkletCode = `
    (function() {
      try {
        // البيانات المستخرجة
        const data = ${JSON.stringify(exportData)};
        
        // وظيفة البحث عن الحقول وملئها
        function fillFields() {
          // أنماط أسماء الحقول المحتملة
          const fieldPatterns = {
            code: ['code', 'الكود', 'رمز', 'رقم'],
            name: ['name', 'الاسم', 'اسم', 'sender'],
            phone: ['phone', 'هاتف', 'رقم الهاتف', 'جوال', 'موبايل'],
            province: ['province', 'محافظة', 'المحافظة', 'city', 'مدينة'],
            price: ['price', 'سعر', 'السعر', 'المبلغ', 'التكلفة'],
            company: ['company', 'شركة', 'اسم الشركة', 'الشركة']
          };
          
          // البحث عن الحقول وملئها
          Object.entries(data).forEach(([key, value]) => {
            if (!value) return;
            
            // تحديد نمط البحث المناسب
            let patterns = [];
            if (key === 'code') patterns = fieldPatterns.code;
            else if (key === 'senderName') patterns = fieldPatterns.name;
            else if (key === 'phoneNumber') patterns = fieldPatterns.phone;
            else if (key === 'province') patterns = fieldPatterns.province;
            else if (key === 'price') patterns = fieldPatterns.price;
            else if (key === 'companyName') patterns = fieldPatterns.company;
            
            // البحث عن الحقول المطابقة
            let found = false;
            for (const pattern of patterns) {
              const inputs = [
                ...document.querySelectorAll(\`input[name*="\${pattern}"]\`),
                ...document.querySelectorAll(\`input[id*="\${pattern}"]\`),
                ...document.querySelectorAll(\`input[placeholder*="\${pattern}"]\`),
                ...document.querySelectorAll(\`textarea[name*="\${pattern}"]\`),
                ...document.querySelectorAll(\`textarea[id*="\${pattern}"]\`),
                ...document.querySelectorAll(\`textarea[placeholder*="\${pattern}"]\`)
              ];
              
              if (inputs.length > 0) {
                inputs[0].value = value;
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                found = true;
                break;
              }
            }
            
            // إذا لم يتم العثور، ابحث عن التسميات
            if (!found) {
              const allLabels = document.querySelectorAll('label');
              for (const pattern of patterns) {
                for (const label of allLabels) {
                  if (label.textContent.toLowerCase().includes(pattern)) {
                    const inputId = label.getAttribute('for');
                    if (inputId) {
                      const input = document.getElementById(inputId);
                      if (input) {
                        input.value = value;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        found = true;
                        break;
                      }
                    }
                  }
                }
                if (found) break;
              }
            }
          });
        }
        
        // تنفيذ عملية الملء
        fillFields();
        alert('تم محاولة ملء البيانات في الصفحة الحالية');
      } catch (error) {
        alert('حدث خطأ: ' + error.message);
      }
    })();
  `;
  
  return bookmarkletCode
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\n\r]/g, '');
};
