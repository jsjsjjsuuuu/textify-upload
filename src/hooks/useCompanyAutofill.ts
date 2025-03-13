
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
  retryCount?: number;
  delayBetweenRetries?: number;
  timeout?: number;
}

export const useCompanyAutofill = () => {
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [lastResult, setLastResult] = useState<AutofillResult | null>(null);
  const { toast } = useToast();

  // إنشاء نص السكريبت للإدخال التلقائي
  const generateAutofillScript = useCallback((company: DeliveryCompany, imageData: ImageData, options?: AutofillOptions): string => {
    if (company.isCustomScript && company.autofillScript) {
      // إذا كان هناك سكريبت مخصص للشركة، نستخدمه مباشرة
      return company.autofillScript
        .replace(/\{\{senderName\}\}/g, imageData.senderName || '')
        .replace(/\{\{phoneNumber\}\}/g, imageData.phoneNumber || '')
        .replace(/\{\{province\}\}/g, imageData.province || '')
        .replace(/\{\{code\}\}/g, imageData.code || '')
        .replace(/\{\{price\}\}/g, imageData.price || '')
        .replace(/\{\{carrierId\}\}/g, '');
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

    // إعدادات الإدخال التلقائي الافتراضية
    const settings = {
      retryCount: options?.retryCount || 3,
      delayBetweenRetries: options?.delayBetweenRetries || 5000,
      clickSubmitButton: options?.clickSubmitButton || false,
      timeout: options?.timeout || 10000
    };

    // إنشاء السكريبت الأساسي للإدخال التلقائي مع إضافة وظيفة للنقر على زر الحفظ
    return `
      (function() {
        try {
          console.log("بدء عملية الإدخال التلقائي لشركة ${company.name}");
          
          // بيانات الإدخال التلقائي
          const autofillData = ${JSON.stringify(data)};
          
          // إعدادات الإدخال التلقائي
          const settings = ${JSON.stringify(settings)};
          
          // تهيئة متغيرات المحاولة
          let currentRetry = 0;
          let fieldsFound = 0;
          let fieldsFilled = 0;
          
          // وظيفة البحث عن وملء الحقول
          function fillFields(field, selectors, value) {
            if (!value) return { found: false, filled: false };
            
            let fieldFound = false;
            let fieldFilled = false;
            
            selectors.forEach(selector => {
              try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) fieldFound = true;
                
                elements.forEach(element => {
                  if (element && !element.disabled && !element.readOnly) {
                    // محاولة تطبيق القيمة بعدة طرق
                    try {
                      element.value = value;
                      element.dispatchEvent(new Event('input', { bubbles: true }));
                      element.dispatchEvent(new Event('change', { bubbles: true }));
                      fieldFilled = true;
                      console.log(\`تم ملء الحقل: \${field} (\${selector}) بالقيمة: \${value}\`);
                    } catch (e) {
                      console.warn(\`فشل ملء الحقل: \${field}\`, e);
                    }
                  }
                });
              } catch (error) {
                console.error(\`خطأ أثناء البحث عن الحقل \${field} بواسطة \${selector}\`, error);
              }
            });
            
            return { found: fieldFound, filled: fieldFilled };
          }
          
          // وظيفة للبحث عن وضغط زر الحفظ/الإرسال
          function findAndClickSubmitButton() {
            // كلمات مفتاحية محتملة لأزرار الحفظ بالعربية والإنجليزية
            const submitKeywords = ['حفظ', 'إرسال', 'ارسال', 'تسجيل', 'إضافة', 'اضافة', 'أضف', 'اضف', 'submit', 'save', 'add', 'create', 'send'];
            
            try {
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
            
              // البحث في العناصر التي تحتوي على كلمات دالة على أنها أزرار
              const allElements = document.querySelectorAll('*');
              for (const element of allElements) {
                if (element.tagName === 'INPUT' || element.tagName === 'BUTTON' || element.tagName === 'A' || element.hasAttribute('role')) {
                  const elementText = element.value || element.innerText || element.textContent || element.getAttribute('title') || '';
                  
                  const matchesKeyword = submitKeywords.some(keyword => 
                    elementText.toLowerCase().includes(keyword.toLowerCase())
                  );
                  
                  if (matchesKeyword) {
                    console.log("تم العثور على عنصر يشبه زر الحفظ:", elementText);
                    element.click();
                    return true;
                  }
                }
              }
              
              // البحث في نماذج الإدخال
              const forms = document.querySelectorAll('form');
              if (forms.length === 1) {
                console.log("تم العثور على نموذج واحد، محاولة تقديمه");
                forms[0].submit();
                return true;
              }
              
              console.log("لم يتم العثور على زر الحفظ");
              return false;
            } catch (error) {
              console.error("خطأ أثناء البحث عن زر الحفظ", error);
              return false;
            }
          }
          
          // وظيفة تكرار المحاولة إذا فشلت
          function retryFill() {
            if (currentRetry >= settings.retryCount) {
              console.warn(\`تم استنفاد عدد المحاولات (\${settings.retryCount})\`);
              
              // إنشاء إشعار بفشل المحاولات
              const notification = document.createElement('div');
              notification.style = \`
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background-color: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                direction: rtl;
                font-family: Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              \`;
              
              notification.textContent = \`فشل الإدخال التلقائي بعد \${settings.retryCount} محاولات\`;
              document.body.appendChild(notification);
              
              // إعادة النتيجة مع معلومات الفشل
              const result = {
                success: false,
                fieldsFound: fieldsFound,
                fieldsFilled: fieldsFilled,
                retryCount: currentRetry,
                message: \`فشل الإدخال التلقائي بعد \${currentRetry} محاولات\`,
                error: "تم استنفاد عدد المحاولات"
              };
              
              // إرسال النتيجة للنافذة الأم
              window.parent.postMessage({
                type: 'autofill-result',
                data: result
              }, '*');
              
              return result;
            }
            
            currentRetry++;
            console.log(\`محاولة رقم \${currentRetry} من \${settings.retryCount}\`);
            
            // إنشاء إشعار بإعادة المحاولة
            const notification = document.createElement('div');
            notification.style = \`
              position: fixed;
              top: 10px;
              right: 10px;
              z-index: 9999;
              background-color: rgba(255, 150, 0, 0.8);
              color: white;
              padding: 10px 15px;
              border-radius: 5px;
              direction: rtl;
              font-family: Arial, sans-serif;
              font-size: 14px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            \`;
            
            notification.textContent = \`جاري إعادة المحاولة رقم \${currentRetry} من \${settings.retryCount}...\`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
              executeAutoFill();
            }, settings.delayBetweenRetries);
          }
          
          // وظيفة تنفيذ الإدخال التلقائي
          function executeAutoFill() {
            try {
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
              
              fieldsFound = totalFound;
              fieldsFilled = totalFilled;
              
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
                      fieldsFilled++;
                    }
                  });
                });
              }
              
              // إذا لم يتم ملء أي حقل، إعادة المحاولة
              if (totalFilled === 0 && currentRetry < settings.retryCount) {
                console.warn("لم يتم ملء أي حقل، إعادة المحاولة...");
                return retryFill();
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
              ${settings.clickSubmitButton ? `
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
                } else if (currentRetry < settings.retryCount) {
                  console.warn("لم يتم العثور على زر الحفظ، إعادة المحاولة...");
                  return retryFill();
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
                retryCount: currentRetry,
                message: \`تم تنفيذ الإدخال التلقائي: \${totalFilled} حقل من أصل \${totalFound} حقل\`
              };
              
              window.parent.postMessage({
                type: 'autofill-result',
                data: result
              }, '*');
              
              return result;
            } catch (error) {
              console.error("خطأ في تنفيذ الإدخال التلقائي:", error);
              
              if (currentRetry < settings.retryCount) {
                console.warn("حدث خطأ، إعادة المحاولة...");
                return retryFill();
              }
              
              // إرسال رسالة خطأ
              const errorResult = {
                success: false,
                error: error.message || "خطأ غير معروف",
                fieldsFound: fieldsFound,
                fieldsFilled: fieldsFilled,
                retryCount: currentRetry,
                message: "فشل في تنفيذ الإدخال التلقائي"
              };
              
              window.parent.postMessage({
                type: 'autofill-result',
                data: errorResult
              }, '*');
              
              // إظهار إشعار للمستخدم
              const errorNotification = document.createElement('div');
              errorNotification.style = \`
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background-color: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                direction: rtl;
                font-family: Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              \`;
              
              errorNotification.textContent = "حدث خطأ أثناء محاولة ملء النموذج: " + (error.message || "خطأ غير معروف");
              document.body.appendChild(errorNotification);
              
              return errorResult;
            }
          }
          
          // بدء تنفيذ الإدخال التلقائي بعد تأخير للتأكد من تحميل الصفحة
          setTimeout(executeAutoFill, 1000);
          
          // إعداد مؤقت للتوقف في حالة تجاوز المهلة
          setTimeout(() => {
            if (fieldsFound === 0 && fieldsFilled === 0) {
              console.error("تم تجاوز الوقت المسموح للإدخال التلقائي");
              
              // إرسال رسالة خطأ
              const timeoutResult = {
                success: false,
                error: "تم تجاوز الوقت المسموح للإدخال التلقائي",
                fieldsFound: 0,
                fieldsFilled: 0,
                message: "فشل في تنفيذ الإدخال التلقائي - انتهت المهلة"
              };
              
              window.parent.postMessage({
                type: 'autofill-result',
                data: timeoutResult
              }, '*');
              
              // إظهار إشعار للمستخدم
              const timeoutNotification = document.createElement('div');
              timeoutNotification.style = \`
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background-color: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                direction: rtl;
                font-family: Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              \`;
              
              timeoutNotification.textContent = "تم تجاوز الوقت المسموح للإدخال التلقائي";
              document.body.appendChild(timeoutNotification);
            }
          }, settings.timeout);
          
          return true;
        } catch (error) {
          console.error("خطأ عام في تنفيذ الإدخال التلقائي:", error);
          
          // إرسال رسالة خطأ
          const criticalError = {
            success: false,
            error: error.message || "خطأ غير معروف",
            message: "فشل في تنفيذ الإدخال التلقائي - خطأ عام"
          };
          
          try {
            window.parent.postMessage({
              type: 'autofill-result',
              data: criticalError
            }, '*');
          } catch (e) {
            // تجاهل الخطأ
          }
          
          // محاولة إظهار إشعار للمستخدم
          try {
            alert("حدث خطأ أثناء محاولة ملء النموذج: " + (error.message || "خطأ غير معروف"));
          } catch (e) {
            // تجاهل الخطأ
          }
          
          return criticalError;
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
        }, options?.timeout || 30000); // الانتظار 30 ثانية كحد أقصى
      });
      
      // تسجيل الاستماع لرسائل النافذة
      const autoFillResultPromise = new Promise<AutofillResult>((resolve) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.type === 'autofill-result') {
            window.removeEventListener('message', messageHandler);
            resolve(event.data.data);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // تحديد مهلة زمنية للاستماع للرسائل
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          resolve({
            success: true,
            message: `تم فتح موقع ${company.name} وتنفيذ الإدخال التلقائي. لم يتم تلقي تأكيد.`,
            fieldsFound: 0,
            fieldsFilled: 0
          });
        }, options?.timeout || 60000); // انتظار دقيقة كحد أقصى للحصول على رد
      });
      
      // الحصول على نتائج الإدخال التلقائي
      const autoFillResult = await autoFillResultPromise;
      
      // تحديث البيانات المحلية
      const timestamp = new Date().toISOString();
      const result: AutofillResult = {
        ...autoFillResult,
        message: autoFillResult.message || `تم تنفيذ الإدخال التلقائي في موقع ${company.name}`
      };
      
      // إضافة نتيجة الإدخال التلقائي إلى البيانات
      const autoFillResultWithMeta = {
        ...result,
        company: company.name,
        timestamp
      };
      
      // تحديث بيانات الصورة
      const currentAutoFillResults = imageData.autoFillResult || [];
      const updatedImageData: Partial<ImageData> = {
        autoFillResult: [...currentAutoFillResults, autoFillResultWithMeta]
      };
      
      // تحديث إحصائيات الاستخدام
      updateCompanyUsageStats(companyId);
      
      // حفظ آخر عنوان URL مستخدم
      localStorage.setItem('lastAutoFillUrl', url);
      
      // حفظ وإظهار النتيجة
      setLastResult(result);
      
      // إظهار إشعار بنتيجة الإدخال التلقائي
      const toastVariant = result.success ? "default" : "destructive";
      toast({
        title: result.success ? "الإدخال التلقائي" : "خطأ في الإدخال التلقائي",
        description: result.message,
        variant: toastVariant
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
  
  // وظيفة إدخال البيانات تلقائيًا لمجموعة من الطلبات
  const executeBatchAutofill = useCallback(async (
    companyId: string, 
    imagesData: ImageData[], 
    options?: AutofillOptions & { 
      delayBetweenRequests?: number, 
      maxConcurrent?: number,
      onProgress?: (progress: number, total: number) => void,
      onItemComplete?: (imageId: string, result: AutofillResult) => void
    }
  ): Promise<{ success: boolean, results: Record<string, AutofillResult> }> => {
    const company = getDeliveryCompanyById(companyId);
    if (!company) {
      const error = `لم يتم العثور على شركة التوصيل بالمعرف: ${companyId}`;
      toast({
        title: "خطأ في الإدخال التلقائي المجمع",
        description: error,
        variant: "destructive"
      });
      return { 
        success: false, 
        results: imagesData.reduce((acc, img) => ({ 
          ...acc, 
          [img.id]: { success: false, message: error, error } 
        }), {})
      };
    }
    
    // الإعدادات الافتراضية
    const settings = {
      delayBetweenRequests: options?.delayBetweenRequests || 5000,
      maxConcurrent: options?.maxConcurrent || 2,
      ...options
    };
    
    setIsAutofilling(true);
    
    try {
      // تحديد عدد العناصر الكلي
      const total = imagesData.length;
      let completed = 0;
      const results: Record<string, AutofillResult> = {};
      
      // إنشاء مجموعات للمعالجة المتوازية
      const chunks: ImageData[][] = [];
      for (let i = 0; i < total; i += settings.maxConcurrent) {
        chunks.push(imagesData.slice(i, i + settings.maxConcurrent));
      }
      
      // معالجة المجموعات واحدة تلو الأخرى
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // معالجة عناصر المجموعة بالتوازي
        const chunkPromises = chunk.map(async (imageData) => {
          try {
            // تنفيذ الإدخال التلقائي
            const result = await executeAutofill(companyId, imageData, undefined, options);
            
            // تسجيل النتيجة
            results[imageData.id] = result;
            
            // استدعاء دالة التقدم
            completed++;
            if (settings.onProgress) {
              settings.onProgress(completed, total);
            }
            
            // استدعاء دالة اكتمال العنصر
            if (settings.onItemComplete) {
              settings.onItemComplete(imageData.id, result);
            }
            
            return result;
          } catch (error) {
            console.error(`خطأ في معالجة العنصر ${imageData.id}:`, error);
            
            const errorResult: AutofillResult = {
              success: false,
              message: "حدث خطأ أثناء تنفيذ الإدخال التلقائي",
              error: error instanceof Error ? error.message : "خطأ غير معروف"
            };
            
            // تسجيل النتيجة
            results[imageData.id] = errorResult;
            
            // استدعاء دالة التقدم
            completed++;
            if (settings.onProgress) {
              settings.onProgress(completed, total);
            }
            
            // استدعاء دالة اكتمال العنصر
            if (settings.onItemComplete) {
              settings.onItemComplete(imageData.id, errorResult);
            }
            
            return errorResult;
          }
        });
        
        // انتظار اكتمال المجموعة الحالية
        await Promise.all(chunkPromises);
        
        // الانتظار قبل بدء المجموعة التالية
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, settings.delayBetweenRequests));
        }
      }
      
      // التحقق من نجاح جميع العمليات
      const allSuccess = Object.values(results).every(result => result.success);
      
      // عرض إشعار بنتيجة العملية
      toast({
        title: allSuccess ? "تم اكتمال الإدخال التلقائي المجمع" : "اكتمال الإدخال التلقائي المجمع مع وجود أخطاء",
        description: `تم معالجة ${completed} من أصل ${total} عنصر`,
        variant: allSuccess ? "success" : "warning"
      });
      
      return {
        success: allSuccess,
        results
      };
    } catch (error) {
      console.error("خطأ عام في تنفيذ الإدخال التلقائي المجمع:", error);
      
      toast({
        title: "خطأ في الإدخال التلقائي المجمع",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
      
      return {
        success: false,
        results: {}
      };
    } finally {
      setIsAutofilling(false);
    }
  }, [executeAutofill, toast]);

  return {
    isAutofilling,
    lastResult,
    executeAutofill,
    executeBatchAutofill,
    generateBookmarkletUrl
  };
};
