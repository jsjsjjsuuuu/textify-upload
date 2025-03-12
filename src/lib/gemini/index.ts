
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

/**
 * وظيفة لإنشاء وتصدير بيانات متعددة دفعة واحدة
 */
export const createBatchBookmarkletCode = (imagesData: any[]) => {
  // تحويل البيانات إلى مصفوفة منظمة
  const exportDataArray = imagesData.map(imageData => ({
    code: imageData.code || "",
    senderName: imageData.senderName || "",
    phoneNumber: imageData.phoneNumber || "",
    province: imageData.province || "",
    price: imageData.price || "",
    companyName: imageData.companyName || ""
  }));

  // إنشاء كود الـ bookmarklet
  const bookmarkletCode = `
    (function() {
      try {
        // البيانات المستخرجة (مصفوفة من البيانات)
        const dataArray = ${JSON.stringify(exportDataArray)};
        let currentIndex = 0;
        
        // وظيفة البحث عن الحقول وملئها
        function fillFields(data) {
          // أنماط أسماء الحقول المحتملة
          const fieldPatterns = {
            code: ['code', 'الكود', 'رمز', 'رقم'],
            name: ['name', 'الاسم', 'اسم', 'sender'],
            phone: ['phone', 'هاتف', 'رقم الهاتف', 'جوال', 'موبايل'],
            province: ['province', 'محافظة', 'المحافظة', 'city', 'مدينة'],
            price: ['price', 'سعر', 'السعر', 'المبلغ', 'التكلفة'],
            company: ['company', 'شركة', 'اسم الشركة', 'الشركة']
          };
          
          let filledFields = 0;
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
                filledFields++;
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
                        filledFields++;
                        break;
                      }
                    }
                  }
                }
                if (found) break;
              }
            }
          });
          
          return filledFields > 0;
        }
        
        // وظيفة للبحث عن زر الإرسال والضغط عليه
        function findAndClickSubmitButton() {
          const submitPatterns = ['submit', 'إرسال', 'حفظ', 'تأكيد', 'ارسال', 'save', 'ok', 'نشر'];
          
          // البحث عن زر الإرسال
          for (const pattern of submitPatterns) {
            // البحث في أزرار التقديم
            const submitButtons = document.querySelectorAll('input[type="submit"]');
            for (const button of submitButtons) {
              if (button.value.toLowerCase().includes(pattern)) {
                button.click();
                return true;
              }
            }
            
            // البحث في الأزرار العادية
            const buttons = document.querySelectorAll('button');
            for (const button of buttons) {
              if (button.textContent.toLowerCase().includes(pattern)) {
                button.click();
                return true;
              }
            }
            
            // البحث في عناصر a التي تبدو كأزرار
            const links = document.querySelectorAll('a.btn, a.button');
            for (const link of links) {
              if (link.textContent.toLowerCase().includes(pattern)) {
                link.click();
                return true;
              }
            }
          }
          
          return false;
        }
        
        // وظيفة لمعالجة النموذج الحالي والانتقال للتالي
        function processCurrentForm() {
          if (currentIndex >= dataArray.length) {
            alert('تم الانتهاء من معالجة جميع البيانات (' + dataArray.length + ' سجل)');
            return;
          }
          
          const data = dataArray[currentIndex];
          const success = fillFields(data);
          
          if (success) {
            alert('تم ملء البيانات للسجل ' + (currentIndex + 1) + ' من ' + dataArray.length);
            // محاولة النقر على زر الإرسال
            const submitted = findAndClickSubmitButton();
            
            // زيادة المؤشر للعنصر التالي
            currentIndex++;
            
            // إذا تم النقر على زر الإرسال، ننتظر قليلاً قبل محاولة معالجة النموذج التالي
            if (submitted) {
              setTimeout(() => {
                alert('جاري الانتقال للسجل التالي...');
                processCurrentForm();
              }, 2000);
            }
          } else {
            if (confirm('لم يتم العثور على حقول لملئها. هل تريد الانتقال للسجل التالي؟')) {
              currentIndex++;
              processCurrentForm();
            }
          }
        }
        
        // بدء معالجة النماذج
        processCurrentForm();
        
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
