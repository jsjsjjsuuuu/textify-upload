
import { useEffect, useState, useCallback } from "react";
import { createBookmarkletCode, createBatchBookmarkletCode } from "@/lib/gemini";
import { ImageData } from "@/types/ImageData";

interface BookmarkletOptions {
  clickSubmitButton?: boolean;
  waitBeforeClick?: number;
  retryCount?: number;
}

// Hook خاص بإنشاء الـ bookmarklet
export const useBookmarkletGenerator = (
  imageData: ImageData | null,
  multipleImages: ImageData[] = [],
  isMultiMode = false,
  isOpen = false
) => {
  const [bookmarkletUrl, setBookmarkletUrl] = useState<string>("");
  const [bookmarkletCode, setBookmarkletCode] = useState<string>("");
  const [rawDataObject, setRawDataObject] = useState<Record<string, any>>({});

  // تحديث الـ bookmarklet عند فتح مربع الحوار أو عند تغيير البيانات
  useEffect(() => {
    if (!isOpen) return;
    
    if (isMultiMode && multipleImages.length > 0) {
      generateBatchBookmarklet(multipleImages);
    } else if (imageData) {
      generateSingleBookmarklet(imageData);
    }
  }, [isOpen, imageData, multipleImages, isMultiMode]);

  // إنشاء bookmarklet للصورة الواحدة
  const generateSingleBookmarklet = (data: ImageData) => {
    // تحضير كائن البيانات للسكريبت
    const exportData = {
      code: data.code || "",
      senderName: data.senderName || "",
      phoneNumber: data.phoneNumber || "",
      province: data.province || "",
      price: data.price || "",
      companyName: data.companyName || ""
    };
    
    // حفظ البيانات الخام للاستخدام المباشر
    setRawDataObject(exportData);
    
    try {
      // إنشاء الكود مع وظيفة ضغط زر الحفظ بخيارات محسنة
      const code = createBookmarkletCode({
        ...data,
        options: { 
          clickSubmitButton: true,
          waitBeforeClick: 1000,  // انتظار ثانية واحدة قبل النقر
          retryCount: 3           // محاولة النقر على الزر 3 مرات
        }
      });
      setBookmarkletCode(code);
      
      // إنشاء الرابط
      const url = `javascript:${encodeURIComponent(code)}`;
      setBookmarkletUrl(url);
    } catch (error) {
      console.error("خطأ في إنشاء الـ bookmarklet:", error);
      setBookmarkletUrl(`javascript:alert('حدث خطأ في إنشاء الـ bookmarklet: ${error}')`);
    }
  };

  // إنشاء bookmarklet لمجموعة من الصور
  const generateBatchBookmarklet = (images: ImageData[]) => {
    // فلترة البيانات لاستبعاد الصور بدون بيانات
    const filteredImages = images.filter(img => 
      img.code || img.senderName || img.phoneNumber || img.province || img.price
    );
    
    if (filteredImages.length === 0) {
      setBookmarkletUrl(`javascript:alert('لا توجد بيانات كافية لإنشاء الـ bookmarklet')`);
      return;
    }
    
    // حفظ مصفوفة البيانات
    setRawDataObject({ multipleImages: filteredImages });
    
    try {
      // إنشاء الكود للبيانات المتعددة مع وظيفة ضغط زر الحفظ المحسنة
      const code = createBatchBookmarkletCode(filteredImages.map(img => ({
        ...img,
        options: { 
          clickSubmitButton: true,
          waitBeforeClick: 1000,
          retryCount: 3
        }
      })));
      setBookmarkletCode(code);
      
      // إنشاء الرابط
      const url = `javascript:${encodeURIComponent(code)}`;
      setBookmarkletUrl(url);
    } catch (error) {
      console.error("خطأ في إنشاء الـ bookmarklet للبيانات المتعددة:", error);
      setBookmarkletUrl(`javascript:alert('حدث خطأ في إنشاء الـ bookmarklet: ${error}')`);
    }
  };

  // تنفيذ السكريبت مباشرة في الموقع المستهدف
  const executeScript = useCallback((targetUrl: string, options?: BookmarkletOptions) => {
    // التحقق من وجود إطار عرض الموقع
    const previewFrame = document.querySelector('iframe') as HTMLIFrameElement;
    if (!previewFrame) {
      console.error("لم يتم العثور على إطار عرض الموقع");
      
      // فتح نافذة جديدة وتنفيذ السكريبت فيها
      const newWindow = window.open(targetUrl, '_blank');
      if (newWindow) {
        // تأخير لضمان تحميل الصفحة
        setTimeout(() => {
          try {
            const scriptElement = newWindow.document.createElement('script');
            // تحسين السكريبت لضمان النقر على الزر
            const enhancedScript = `
              (function() {
                ${bookmarkletCode}
                
                // وظيفة محسنة للنقر على زر الحفظ أو الإضافة
                function clickSubmitButtonWithRetry(retryCount = 3, waitTime = 1500) {
                  console.log("محاولة النقر على زر الحفظ...");
                  
                  let submitClicked = false;
                  let retries = 0;
                  
                  function attemptClick() {
                    if (submitClicked || retries >= retryCount) return;
                    retries++;
                    
                    // الطريقة 1: البحث عن الزر عن طريق النص
                    const buttonTexts = [
                      'حفظ', 'اضف', 'اضافة', 'إضافة', 'تسجيل', 'ارسال', 'إرسال', 'تأكيد', 'التالي',
                      'save', 'add', 'submit', 'send', 'confirm', 'next', 'ok', 'create'
                    ];
                    
                    // البحث عن زر بنص محدد
                    for (const text of buttonTexts) {
                      // النص المطابق تماماً
                      const exactButtons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.button, .btn, [role="button"]'))
                        .filter(el => el.textContent && el.textContent.trim().toLowerCase() === text.toLowerCase());
                      
                      // النص الذي يحتوي على الكلمة
                      const containsButtons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.button, .btn, [role="button"]'))
                        .filter(el => el.textContent && el.textContent.toLowerCase().includes(text.toLowerCase()));
                      
                      const buttonToClick = exactButtons[0] || containsButtons[0];
                      
                      if (buttonToClick) {
                        console.log("وجدت زر بالنص:", text, buttonToClick);
                        buttonToClick.click();
                        submitClicked = true;
                        
                        // إظهار إشعار
                        showNotification("تم النقر على زر: " + text);
                        return;
                      }
                    }
                    
                    // الطريقة 2: البحث عن الزر عن طريق النوع
                    const submitButtons = document.querySelectorAll('input[type="submit"], button[type="submit"]');
                    if (submitButtons.length > 0) {
                      console.log("وجدت زر إرسال:", submitButtons[0]);
                      (submitButtons[0] as HTMLElement).click();
                      submitClicked = true;
                      showNotification("تم النقر على زر الإرسال");
                      return;
                    }
                    
                    // الطريقة 3: البحث عن الزر في نهاية النموذج
                    const forms = document.querySelectorAll('form');
                    for (const form of forms) {
                      const buttons = form.querySelectorAll('button, input[type="button"], input[type="submit"]');
                      const lastButton = buttons[buttons.length - 1];
                      if (lastButton) {
                        console.log("وجدت آخر زر في النموذج:", lastButton);
                        (lastButton as HTMLElement).click();
                        submitClicked = true;
                        showNotification("تم النقر على آخر زر في النموذج");
                        return;
                      }
                    }
                    
                    // إذا لم يتم العثور على أي زر، حاول مرة أخرى بعد تأخير
                    if (!submitClicked && retries < retryCount) {
                      console.log("لم يتم العثور على زر، محاولة أخرى بعد", waitTime, "مللي ثانية. محاولة", retries, "من", retryCount);
                      setTimeout(attemptClick, waitTime);
                    } else if (!submitClicked) {
                      console.warn("فشلت جميع محاولات النقر على زر الحفظ!");
                      showNotification("فشل في العثور على زر الحفظ. يرجى النقر يدوياً.", "warning");
                    }
                  }
                  
                  function showNotification(message, type = "success") {
                    const notification = document.createElement('div');
                    notification.style.position = 'fixed';
                    notification.style.top = '10px';
                    notification.style.right = '10px';
                    notification.style.zIndex = '9999';
                    notification.style.backgroundColor = type === "success" ? 'rgba(0, 150, 0, 0.9)' : 'rgba(200, 100, 0, 0.9)';
                    notification.style.color = 'white';
                    notification.style.padding = '12px 20px';
                    notification.style.borderRadius = '5px';
                    notification.style.fontWeight = 'bold';
                    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                    notification.style.direction = 'rtl';
                    notification.style.fontFamily = 'Arial, sans-serif';
                    notification.textContent = message;
                    
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                      notification.style.opacity = '0';
                      notification.style.transition = 'opacity 0.5s';
                      setTimeout(() => notification.remove(), 500);
                    }, 5000);
                  }
                  
                  // بدء أول محاولة بعد تأخير للسماح للصفحة بالتحميل الكامل
                  setTimeout(attemptClick, waitTime);
                }
                
                // تنفيذ وظيفة النقر على الزر مع محاولات متعددة
                clickSubmitButtonWithRetry(5, 2000);
              })();
            `;
            
            scriptElement.textContent = enhancedScript;
            newWindow.document.head.appendChild(scriptElement);
          } catch (error) {
            console.error("خطأ في تنفيذ السكريبت في النافذة الجديدة:", error);
          }
        }, 2500); // زيادة وقت الانتظار لضمان تحميل الصفحة
      }
      return;
    }
    
    try {
      // تنفيذ السكريبت في الإطار مع توفير البيانات والخيارات المحسنة
      const enhancedOptions = {
        ...options,
        clickSubmitButton: true,
        waitBeforeClick: 2000,  // انتظار ثانيتين قبل النقر
        retryCount: 5           // محاولة النقر على الزر 5 مرات
      };
      
      previewFrame.contentWindow?.postMessage({
        type: 'execute-script',
        script: bookmarkletCode,
        data: { 
          ...rawDataObject,
          options: enhancedOptions
        }
      }, '*');
      
      console.log("تم إرسال طلب تنفيذ السكريبت إلى الإطار مع خيارات محسنة:", enhancedOptions);
      
      // حفظ آخر URL مستخدم
      localStorage.setItem('lastAutoFillUrl', targetUrl);
    } catch (error) {
      console.error("خطأ في تنفيذ السكريبت:", error);
      throw error;
    }
  }, [bookmarkletCode, rawDataObject]);

  return {
    bookmarkletUrl,
    bookmarkletCode,
    rawDataObject,
    executeScript
  };
};
