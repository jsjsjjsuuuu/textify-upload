
import { useState, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { DeliveryCompany } from "@/types/DeliveryCompany";
import { getDeliveryCompanyById, updateCompanyUsageStats } from "@/utils/deliveryCompanies/companyData";
import { useToast } from "@/hooks/use-toast";

export interface AutofillResult {
  success: boolean;
  message: string;
  fieldsFound?: number;
  fieldsFilled?: number;
  error?: string;
}

export interface AutofillOptions {
  clickSubmitButton?: boolean;
}

export const useCompanyAutofill = () => {
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [lastResult, setLastResult] = useState<AutofillResult | null>(null);
  const { toast } = useToast();

  // إنشاء نص السكريبت للإدخال التلقائي
  const generateAutofillScript = useCallback((company: DeliveryCompany, imageData: ImageData, options?: AutofillOptions): string => {
    if (company.isCustomScript && company.autofillScript) {
      return company.autofillScript;
    }

    // إنشاء كائن البيانات المستخرجة
    const data = {
      companyName: imageData.companyName || "",
      code: imageData.code || "",
      senderName: imageData.senderName || "",
      phoneNumber: imageData.phoneNumber || "",
      province: imageData.province || "",
      price: imageData.price || ""
    };

    // إنشاء السكريبت الأساسي للإدخال التلقائي مع إضافة وظيفة للنقر على زر الحفظ
    return `
      (function() {
        try {
          console.log("بدء عملية الإدخال التلقائي لشركة ${company.name}");
          
          // بيانات الإدخال التلقائي
          const autofillData = ${JSON.stringify(data)};
          
          // وظيفة البحث عن وملء الحقول
          function fillFields(field, selectors, value) {
            if (!value) return { found: false, filled: false };
            
            let fieldFound = false;
            let fieldFilled = false;
            
            selectors.forEach(selector => {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) fieldFound = true;
              
              elements.forEach(element => {
                if (element && !element.disabled && !element.readOnly) {
                  element.value = value;
                  element.dispatchEvent(new Event('input', { bubbles: true }));
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  fieldFilled = true;
                  console.log(\`تم ملء الحقل: \${field} (\${selector}) بالقيمة: \${value}\`);
                }
              });
            });
            
            return { found: fieldFound, filled: fieldFilled };
          }
          
          // وظيفة للبحث عن وضغط زر الحفظ/الإرسال
          function findAndClickSubmitButton() {
            // كلمات مفتاحية محتملة لأزرار الحفظ بالعربية والإنجليزية
            const submitKeywords = ['حفظ', 'إرسال', 'ارسال', 'تسجيل', 'إضافة', 'اضافة', 'أضف', 'اضف', 'submit', 'save', 'add', 'create', 'send'];
            
            // البحث في الأزرار
            const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
            for (const button of buttons) {
              // الحصول على النص من السمة value أو innerText
              const buttonText = button.value || button.innerText || button.textContent || '';
              
              // البحث عن كلمة مفتاحية في نص الزر
              const matchesKeyword = submitKeywords.some(keyword => 
                buttonText.toLowerCase().includes(keyword.toLowerCase())
              );
              
              if (matchesKeyword) {
                console.log("تم العثور على زر الحفظ:", buttonText);
                button.click();
                return true;
              }
            }
            
            // البحث في الروابط التي تشبه الأزرار
            const links = document.querySelectorAll('a.btn, a.button, a[role="button"]');
            for (const link of links) {
              const linkText = link.innerText || link.textContent || '';
              
              const matchesKeyword = submitKeywords.some(keyword => 
                linkText.toLowerCase().includes(keyword.toLowerCase())
              );
              
              if (matchesKeyword) {
                console.log("تم العثور على رابط الحفظ:", linkText);
                link.click();
                return true;
              }
            }
            
            console.log("لم يتم العثور على زر الحفظ");
            return false;
          }
          
          // ملء جميع الحقول
          let totalFound = 0;
          let totalFilled = 0;
          const fields = ${JSON.stringify(company.fields)};
          
          fields.forEach(fieldConfig => {
            const value = autofillData[fieldConfig.name];
            const result = fillFields(fieldConfig.name, fieldConfig.selectors, value);
            if (result.found) totalFound++;
            if (result.filled) totalFilled++;
          });
          
          // ملء القوائم المنسدلة للمحافظة
          if (autofillData.province) {
            const selects = document.querySelectorAll('select');
            selects.forEach(select => {
              const options = select.querySelectorAll('option');
              options.forEach(option => {
                const text = option.textContent || option.innerText;
                if (text && text.indexOf(autofillData.province) !== -1) {
                  select.value = option.value;
                  select.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log(\`تم اختيار المحافظة من القائمة المنسدلة: \${text}\`);
                  totalFilled++;
                }
              });
            });
          }
          
          // إظهار إشعار للمستخدم
          const notification = document.createElement('div');
          notification.style = \`
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background-color: \${totalFilled > 0 ? 'rgba(0, 150, 0, 0.8)' : 'rgba(255, 150, 0, 0.8)'};
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            direction: rtl;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          \`;
          
          notification.textContent = \`تم تنفيذ الإدخال التلقائي: \${totalFilled} حقل من أصل \${totalFound} حقل تم العثور عليه\`;
          document.body.appendChild(notification);
          
          // ضغط زر الحفظ بعد تأخير قصير للسماح للصفحة بالاستجابة للتغييرات في الحقول
          ${options?.clickSubmitButton ? `
          setTimeout(() => {
            const submitResult = findAndClickSubmitButton();
            if (submitResult) {
              const submitNotification = document.createElement('div');
              submitNotification.style = \`
                position: fixed;
                top: 50px;
                right: 10px;
                z-index: 9999;
                background-color: rgba(0, 100, 200, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                direction: rtl;
                font-family: Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              \`;
              
              submitNotification.textContent = "تم الضغط على زر الحفظ/الإرسال تلقائياً";
              document.body.appendChild(submitNotification);
              
              setTimeout(() => {
                submitNotification.style.opacity = '0';
                submitNotification.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                  submitNotification.parentNode?.removeChild(submitNotification);
                }, 500);
              }, 3000);
            }
          }, 1000);` : ''}
          
          setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => {
              notification.parentNode?.removeChild(notification);
            }, 500);
          }, 5000);
          
          // إرسال رسالة نجاح
          const result = {
            success: true,
            fieldsFound: totalFound,
            fieldsFilled: totalFilled,
            message: \`تم تنفيذ الإدخال التلقائي: \${totalFilled} حقل من أصل \${totalFound} حقل\`
          };
          
          window.parent.postMessage({
            type: 'autofill-result',
            data: result
          }, '*');
          
          return result;
        } catch (error) {
          console.error("خطأ في تنفيذ الإدخال التلقائي:", error);
          
          // إرسال رسالة خطأ
          const errorResult = {
            success: false,
            error: error.message || "خطأ غير معروف",
            message: "فشل في تنفيذ الإدخال التلقائي"
          };
          
          window.parent.postMessage({
            type: 'autofill-result',
            data: errorResult
          }, '*');
          
          // إظهار إشعار للمستخدم
          alert("حدث خطأ أثناء محاولة ملء النموذج: " + error.message);
          
          return errorResult;
        }
      })();
    `;
  }, []);

  // وظيفة تنفيذ الإدخال التلقائي
  const executeAutofill = useCallback(async (companyId: string, imageData: ImageData, targetUrl?: string, options?: AutofillOptions): Promise<AutofillResult> => {
    setIsAutofilling(true);
    setLastResult(null);
    
    try {
      // البحث عن الشركة حسب المعرف
      const company = getDeliveryCompanyById(companyId);
      if (!company) {
        const error = `لم يتم العثور على شركة التوصيل بالمعرف: ${companyId}`;
        setLastResult({ success: false, message: error, error });
        toast({
          title: "خطأ في الإدخال التلقائي",
          description: error,
          variant: "destructive"
        });
        return { success: false, message: error, error };
      }
      
      // إنشاء سكريبت الإدخال التلقائي مع الخيارات
      const script = generateAutofillScript(company, imageData, options);
      
      // التحقق من وجود عنوان URL للهدف
      const url = targetUrl || company.formUrl || company.websiteUrl;
      if (!url) {
        const error = `لم يتم تحديد عنوان URL للشركة: ${company.name}`;
        setLastResult({ success: false, message: error, error });
        toast({
          title: "خطأ في الإدخال التلقائي",
          description: error,
          variant: "destructive"
        });
        return { success: false, message: error, error };
      }
      
      // تنفيذ السكريبت
      let result: AutofillResult;
      
      // طريقة تنفيذ 1: فتح نافذة جديدة
      const newWindow = window.open(url, `autofill-${company.id}-${Date.now()}`);
      if (!newWindow) {
        const error = "تم منع فتح النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة وإعادة المحاولة.";
        setLastResult({ success: false, message: error, error });
        toast({
          title: "خطأ في الإدخال التلقائي",
          description: error,
          variant: "destructive"
        });
        return { success: false, message: error, error };
      }
      
      // الانتظار حتى يتم تحميل الصفحة
      await new Promise<void>((resolve) => {
        const checkLoadInterval = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkLoadInterval);
            resolve();
          } else if (newWindow.document?.readyState === 'complete') {
            clearInterval(checkLoadInterval);
            // تنفيذ السكريبت بعد تأخير صغير للتأكد من تحميل الصفحة بالكامل
            setTimeout(() => {
              try {
                // إنشاء عنصر script وإضافته إلى النافذة المستهدفة
                const scriptElement = newWindow.document.createElement('script');
                scriptElement.textContent = script;
                newWindow.document.head.appendChild(scriptElement);
                resolve();
              } catch (e) {
                console.error("خطأ في تنفيذ السكريبت:", e);
                resolve();
              }
            }, 1500);
          }
        }, 500);
        
        // وضع وقت انتهاء محدود
        setTimeout(() => {
          clearInterval(checkLoadInterval);
          resolve();
        }, 30000); // الانتظار 30 ثانية كحد أقصى
      });
      
      // اعتبار العملية ناجحة إذا تم فتح النافذة
      result = {
        success: true,
        message: `تم فتح موقع ${company.name} وتنفيذ الإدخال التلقائي${options?.clickSubmitButton ? ' مع محاولة الضغط على زر الحفظ' : ''}`
      };
      
      // تحديث إحصائيات الاستخدام
      updateCompanyUsageStats(companyId);
      
      // حفظ آخر عنوان URL مستخدم
      localStorage.setItem('lastAutoFillUrl', url);
      
      // حفظ وإظهار النتيجة
      setLastResult(result);
      toast({
        title: "الإدخال التلقائي",
        description: result.message,
        variant: "default"
      });
      
      return result;
    } catch (error) {
      console.error("خطأ عام في تنفيذ الإدخال التلقائي:", error);
      const errorMsg = error instanceof Error ? error.message : "خطأ غير معروف";
      const result = { 
        success: false, 
        message: "فشل في تنفيذ الإدخال التلقائي", 
        error: errorMsg 
      };
      
      setLastResult(result);
      toast({
        title: "خطأ في الإدخال التلقائي",
        description: errorMsg,
        variant: "destructive"
      });
      
      return result;
    } finally {
      setIsAutofilling(false);
    }
  }, [generateAutofillScript, toast]);

  // إنشاء رابط bookmarklet
  const generateBookmarkletUrl = useCallback((companyId: string, imageData: ImageData, options?: AutofillOptions): string => {
    const company = getDeliveryCompanyById(companyId);
    if (!company) return "";
    
    const script = generateAutofillScript(company, imageData, { ...options, clickSubmitButton: true });
    return `javascript:${encodeURIComponent(script)}`;
  }, [generateAutofillScript]);

  return {
    isAutofilling,
    lastResult,
    executeAutofill,
    generateBookmarkletUrl
  };
};
