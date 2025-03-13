import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import DraggableImage from "./DraggableImage";
import ImageDataForm from "./ImageDataForm";
import ActionButtons from "./ActionButtons";
import BookmarkletGenerator from "@/components/BookmarkletGenerator";
import { autoFillWebsiteForm } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Send, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CardItemProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

interface SavedCredential {
  domain: string;
  username: string;
  password: string;
  date: string;
}

const CardItem = ({ 
  image, 
  isSubmitting, 
  onImageClick, 
  onTextChange, 
  onDelete, 
  onSubmit, 
  formatDate 
}: CardItemProps) => {
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleExport = (imageId: string) => {
    if (imageId === image.id) {
      setIsBookmarkletOpen(true);
    }
  };

  const isGoogleUrl = (url: string) => {
    return url.includes('google.com') || url.includes('docs.google.com');
  };

  // تحسين وظيفة الإدخال التلقائي
  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    
    try {
      // استعادة آخر URL مستخدم من التخزين المحلي
      const lastUsedUrl = localStorage.getItem('lastAutoFillUrl') || localStorage.getItem('lastPreviewUrl');
      
      // إذا لم يكن هناك URL سابق، نطلب من المستخدم إدخاله
      let targetUrl = lastUsedUrl;
      if (!targetUrl) {
        targetUrl = prompt("أدخل عنوان URL للموقع الذي تريد ملء البيانات فيه:", "https://");
        if (!targetUrl) {
          setIsAutoFilling(false);
          return;
        }
        // حفظ URL في التخزين المحلي للاستخدام القادم
        localStorage.setItem('lastAutoFillUrl', targetUrl);
      }
      
      localStorage.setItem('lastPreviewUrl', targetUrl);
      
      // التحقق مما إذا كان عنوان URL هو Google Sheets أو مستندات Google
      const isGoogleSite = isGoogleUrl(targetUrl);
      if (isGoogleSite) {
        toast({
          title: "تنبيه - مواقع Google",
          description: "سنقوم بفتح نافذة مباشرة مع سكريبت الإدخال التلقائي لموقع Google.",
          variant: "warning",
          duration: 3000
        });
      }
      
      // إعداد البيانات للإرسال
      const formData = {
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || "",
        companyName: image.companyName || "",
        code: image.code || "",
        extractedText: image.extractedText || ""
      };
      
      // فحص ما إذا كان هناك بيانات كافية للإدخال التلقائي
      const dataFields = Object.values(formData).filter(Boolean);
      if (dataFields.length <= 1) { // إذا كان هناك حقل واحد فقط أو لا يوجد حقول
        toast({
          title: "لا توجد بيانات كافية",
          description: "لا يوجد ما يكفي من البيانات المستخرجة للإدخال التلقائي. الرجاء استخراج المزيد من البيانات أولاً.",
          variant: "destructive"
        });
        setIsAutoFilling(false);
        return;
      }
      
      // استرجاع بيانات تسجيل الدخول المحفوظة
      const storedCredentials = localStorage.getItem("savedLoginCredentials");
      let savedCredentials: SavedCredential[] = [];
      
      if (storedCredentials) {
        try {
          savedCredentials = JSON.parse(storedCredentials);
        } catch (error) {
          console.error("خطأ في استرجاع بيانات تسجيل الدخول:", error);
        }
      }
      
      // البحث عن بيانات تسجيل الدخول للموقع المستهدف
      let loginCredential: SavedCredential | null = null;
      if (savedCredentials.length > 0 && targetUrl) {
        try {
          const urlObj = new URL(targetUrl);
          const domain = urlObj.hostname;
          loginCredential = savedCredentials.find(cred => cred.domain === domain) || null;
        } catch (error) {
          console.error("خطأ في تحليل URL:", error);
        }
      }
      
      // تنفيذ الإدخال التلقائي - طريقة معدلة أكثر موثوقية
      if (isGoogleSite) {
        // لمواقع Google: فتح نافذة جديدة مع سكريبت الإدخال التلقائي
        const autoFillScript = createAutoFillScript(formData, loginCredential);
        window.open(`javascript:${encodeURIComponent(autoFillScript)}`, '_blank');
        
        toast({
          title: "تم فتح موقع Google",
          description: "تم فتح Google في نافذة جديدة وتنفيذ الإدخال التلقائي.",
          variant: "default"
        });
      } else {
        // فتح نافذة الـ Bookmarklet لإمكانية التنفيذ المباشر
        setIsBookmarkletOpen(true);
        
        toast({
          title: "جاهز للإدخال التلقائي",
          description: "يمكنك الآن النقر على 'تنفيذ مباشرة' لملء البيانات في الموقع الحالي أو سحب الزر إلى شريط المفضلة.",
          variant: "default"
        });
        
        // بديل: التنقل إلى صفحة المعاينة مع سكريبت الإدخال التلقائي
        // const autoFillScript = createAutoFillScript(formData, loginCredential);
        // navigate('/preview?url=' + encodeURIComponent(targetUrl) + '&autoFill=true&script=' + encodeURIComponent('javascript:' + encodeURIComponent(autoFillScript)));
      }
    } catch (error) {
      console.error("خطأ في الإدخال التلقائي:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة الإدخال التلقائي: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  // دالة مساعدة لإنشاء النص البرمجي للإدخال التلقائي
  const createAutoFillScript = (formData: any, loginCredential: SavedCredential | null) => {
    return `
      (function() {
        try {
          const data = ${JSON.stringify(formData)};
          ${loginCredential ? `const savedLogin = ${JSON.stringify(loginCredential)};` : 'const savedLogin = null;'}
          console.log("بدء الإدخال التلقائي للبيانات:", data);
          
          // إظهار إشعار للمستخدم
          const showNotification = (message, isSuccess = true) => {
            const notification = document.createElement('div');
            notification.style.cssText = \`
              position: fixed;
              top: 20px;
              right: 20px;
              background: \${isSuccess ? '#4CAF50' : '#F44336'};
              color: white;
              padding: 15px 20px;
              border-radius: 5px;
              z-index: 10000;
              direction: rtl;
              font-family: Arial, sans-serif;
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
              font-size: 14px;
              min-width: 250px;
              animation: slideIn 0.3s ease-out;
            \`;
            notification.innerHTML = \`<div style="font-weight: bold; margin-bottom: 5px;">أداة الإدخال التلقائي</div>\${message}\`;
            document.body.appendChild(notification);
            
            // تحريك الإشعار
            notification.style.transition = 'all 0.5s ease';
            setTimeout(() => notification.style.opacity = '0', 4500);
            setTimeout(() => notification.remove(), 5000);
          };
          
          // إضافة شريط تقدم
          const addProgressBar = () => {
            const bar = document.createElement('div');
            bar.id = 'autofill-progress-bar';
            bar.style.cssText = \`
              position: fixed;
              top: 0;
              left: 0;
              height: 4px;
              width: 0%;
              background: linear-gradient(90deg, #4CAF50, #8BC34A);
              z-index: 10000;
              transition: width 0.3s ease;
            \`;
            document.body.appendChild(bar);
            return bar;
          };
          
          // تحديث شريط التقدم
          const updateProgress = (percent) => {
            const bar = document.getElementById('autofill-progress-bar') || addProgressBar();
            bar.style.width = percent + '%';
            if (percent >= 100) {
              setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => bar.remove(), 500);
              }, 1000);
            }
          };
          
          // التحقق من الحاجة لتسجيل الدخول
          const checkForLoginForm = () => {
            updateProgress(10);
            showNotification("جاري تحليل الصفحة...");
            
            const possibleLoginSelectors = [
              'input[type="password"]',
              'form[action*="login"]', 
              'form[action*="signin"]', 
              'form[id*="login"]', 
              'form[id*="signin"]', 
              'form[class*="login"]', 
              'form[class*="signin"]'
            ];
            
            const loginForm = possibleLoginSelectors.some(selector => document.querySelector(selector));
            
            if (loginForm) {
              showNotification("تم اكتشاف صفحة تسجيل دخول.");
              updateProgress(20);
              
              // البحث عن حقول اسم المستخدم وكلمة المرور
              const possibleUsernameSelectors = [
                'input[name*="user"]', 'input[name*="email"]', 'input[id*="user"]', 
                'input[id*="email"]', 'input[type="email"]', 'input[placeholder*="بريد"]', 
                'input[placeholder*="اسم المستخدم"]', 'input[name*="name"]'
              ];
              
              const usernameField = possibleUsernameSelectors
                .map(selector => document.querySelector(selector))
                .find(field => field);
                
              const passwordField = document.querySelector('input[type="password"]');
              
              if (usernameField && passwordField) {
                // إذا كان لدينا بيانات دخول محفوظة، نستخدمها
                if (savedLogin) {
                  try {
                    console.log("تم العثور على بيانات تسجيل دخول محفوظة للموقع:", savedLogin.domain);
                    showNotification("تم العثور على بيانات تسجيل دخول محفوظة للموقع: " + savedLogin.domain);
                    
                    // إدخال اسم المستخدم وكلمة المرور
                    usernameField.value = savedLogin.username || '';
                    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    passwordField.value = savedLogin.password || '';
                    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    updateProgress(30);
                    
                    // البحث عن زر تسجيل الدخول
                    const loginButton = 
                      document.querySelector('button[type="submit"]') || 
                      document.querySelector('input[type="submit"]') ||
                      Array.from(document.querySelectorAll('button')).find(btn => 
                        btn.innerText.toLowerCase().includes('login') || 
                        btn.innerText.toLowerCase().includes('sign in') ||
                        btn.innerText.includes('تسجيل') || 
                        btn.innerText.includes('دخول')
                      );
                      
                    if (loginButton) {
                      // عرض رسالة للمستخدم وتنفيذ النقر بعد فترة
                      showNotification("سيتم تسجيل الدخول تلقائيًا خلال 2 ثوان. انقر أي مكان لإلغاء العملية.");
                      
                      const cancelClickHandler = () => {
                        clearTimeout(loginTimeout);
                        document.removeEventListener('click', cancelClickHandler);
                        showNotification("تم إلغاء تسجيل الدخول التلقائي", false);
                      };
                      
                      document.addEventListener('click', cancelClickHandler);
                      
                      const loginTimeout = setTimeout(() => {
                        document.removeEventListener('click', cancelClickHandler);
                        loginButton.click();
                        updateProgress(40);
                        
                        showNotification("جاري تسجيل الدخول، يرجى الانتظار...");
                        
                        // انتظار انتهاء تسجيل الدخول ثم محاولة ملء الحقول
                        setTimeout(() => {
                          fillFields();
                        }, 3000);
                      }, 2000);
                      
                      return true;
                    }
                  } catch (e) {
                    console.error("خطأ في استخدام بيانات تسجيل الدخول:", e);
                    showNotification("حدث خطأ أثناء محاولة تسجيل الدخول: " + e.message, false);
                  }
                } else {
                  // اقتراح حفظ بيانات الدخول
                  showNotification("لم يتم العثور على بيانات تسجيل دخول محفوظة. قم بتسجيل الدخول يدويًا ثم استخدم زر 'حفظ بيانات الدخول'.", false);
                  return true;
                }
              }
            }
            return false;
          };
          
          // ملء الحقول بالبيانات
          const fillFields = () => {
            updateProgress(50);
            showNotification("جاري البحث عن الحقول المناسبة للإدخال...");
            console.log("بدء البحث عن الحقول المناسبة للإدخال");
            
            // تعريف الحقول وأنماط البحث المناسبة
            const fields = {
              'senderName': ['sender', 'name', 'الاسم', 'المرسل', 'إسم', 'customer', 'client', 'العميل', 'full'],
              'phoneNumber': ['phone', 'tel', 'mobile', 'هاتف', 'موبايل', 'جوال', 'رقم', 'number'],
              'province': ['province', 'city', 'region', 'محافظة', 'المحافظة', 'المدينة', 'منطقة', 'address', 'عنوان', 'البلد', 'المنطقة'],
              'price': ['price', 'cost', 'amount', 'سعر', 'المبلغ', 'التكلفة', 'قيمة', 'total', 'المجموع', 'التكلفة'],
              'companyName': ['company', 'vendor', 'شركة', 'المورد', 'البائع', 'supplier', 'provider', 'اسم الشركة'],
              'code': ['code', 'id', 'number', 'رقم', 'كود', 'معرف', 'reference', 'order', 'رقم الطلب', 'رقم العميل']
            };
            
            let filledCount = 0;
            const totalFields = Object.keys(fields).length;
            
            const findAllInputElements = () => {
              return [
                ...document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([readonly]):not([disabled])'),
                ...document.querySelectorAll('textarea:not([readonly]):not([disabled])'),
                ...document.querySelectorAll('select:not([disabled])'),
                ...document.querySelectorAll('div[role="textbox"]:not([aria-readonly="true"])')
              ];
            };
            
            // البحث عن وسوم الإدخال ذات الصلة بكل نمط
            const findRelevantElements = (selector) => {
              return [
                ...document.querySelectorAll(\`input[id*="\${selector}"i]:not([type="hidden"]):not([type="submit"]):not([readonly]):not([disabled])\`),
                ...document.querySelectorAll(\`input[name*="\${selector}"i]:not([type="hidden"]):not([type="submit"]):not([readonly]):not([disabled])\`),
                ...document.querySelectorAll(\`input[placeholder*="\${selector}"i]:not([readonly]):not([disabled])\`),
                ...document.querySelectorAll(\`textarea[id*="\${selector}"i]:not([readonly]):not([disabled])\`),
                ...document.querySelectorAll(\`textarea[name*="\${selector}"i]:not([readonly]):not([disabled])\`),
                ...document.querySelectorAll(\`textarea[placeholder*="\${selector}"i]:not([readonly]):not([disabled])\`),
                ...document.querySelectorAll(\`select[id*="\${selector}"i]:not([disabled])\`),
                ...document.querySelectorAll(\`select[name*="\${selector}"i]:not([disabled])\`),
                ...document.querySelectorAll(\`div[role="textbox"][aria-label*="\${selector}"i]:not([aria-readonly="true"])\`)
              ];
            };
            
            const getAllInputs = findAllInputElements();
            console.log("تم العثور على" + getAllInputs.length + " عنصر إدخال في الصفحة");
            
            // ملء الحقول بالبيانات
            for (const [dataKey, selectors] of Object.entries(fields)) {
              if (!data[dataKey]) continue;
              
              console.log("محاولة ملء حقل:" + dataKey + " بالقيمة:" + data[dataKey]);
              let fieldFilled = false;
              
              // طريقة 1: البحث باستخدام السمات (id, name, placeholder)
              for (const selector of selectors) {
                const elements = findRelevantElements(selector);
                
                if (elements.length > 0) {
                  console.log("تم العثور على عناصر للنمط:" + selector + ", العدد:" + elements.length);
                }
                
                for (const element of elements) {
                  if (element.disabled || element.readOnly) continue;
                  
                  try {
                    if (element instanceof HTMLSelectElement) {
                      const options = Array.from(element.options);
                      const bestMatch = options.find(opt => 
                        opt.text.toLowerCase().includes(data[dataKey].toLowerCase()) ||
                        data[dataKey].toLowerCase().includes(opt.text.toLowerCase())
                      );
                      
                      if (bestMatch) {
                        element.value = bestMatch.value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log("تم ملء حقل القائمة المنسدلة:" + selector);
                        fieldFilled = true;
                        break;
                      }
                    } else if (element.getAttribute('role') === 'textbox') {
                      // للتعامل مع حقول النص في Google Docs/Sheets
                      element.textContent = data[dataKey];
                      element.dispatchEvent(new Event('input', { bubbles: true }));
                      console.log("تم ملء حقل النص في Google:" + selector);
                      fieldFilled = true;
                      break;
                    } else {
                      element.value = data[dataKey];
                      element.dispatchEvent(new Event('input', { bubbles: true }));
                      element.dispatchEvent(new Event('change', { bubbles: true }));
                      console.log("تم ملء الحقل العادي:" + selector);
                      fieldFilled = true;
                      break;
                    }
                  } catch (e) {
                    console.error("خطأ في ملء الحقل:", e);
                  }
                }
                
                if (fieldFilled) {
                  filledCount++;
                  updateProgress(50 + (filledCount / totalFields) * 30);
                  break;
                }
              }
              
              // طريقة 2: البحث بناءً على التسميات (labels)
              if (!fieldFilled) {
                const labels = document.querySelectorAll('label');
                
                for (const selector of selectors) {
                  for (const label of labels) {
                    if (label.textContent.toLowerCase().includes(selector.toLowerCase())) {
                      const forAttr = label.getAttribute('for');
                      if (forAttr) {
                        const input = document.getElementById(forAttr);
                        if (input && !input.disabled && !input.readOnly) {
                          try {
                            input.value = data[dataKey];
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            console.log("تم ملء الحقل عبر التسمية:" + selector);
                            filledCount++;
                            fieldFilled = true;
                            updateProgress(50 + (filledCount / totalFields) * 30);
                            break;
                          } catch (e) {
                            console.error("خطأ في ملء الحقل عبر التسمية:", e);
                          }
                        }
                      }
                    }
                  }
                  if (fieldFilled) break;
                }
              }
              
              // طريقة 3: البحث عن طريق النص المحيط
              if (!fieldFilled) {
                // البحث عن العناصر النصية المحيطة بحقول الإدخال
                getAllInputs.forEach(input => {
                  if (fieldFilled || input.disabled || input.readOnly || input.value) return;
                  
                  // الحصول على كل النص في parent node مع تجنب النص في الحقول نفسها
                  const parentElement = input.parentElement;
                  if (!parentElement) return;
                  
                  // استخراج النص من العنصر الأبوي
                  let parentText = "";
                  for (const node of parentElement.childNodes) {
                    if (node.nodeType === 3) { // نص
                      parentText += node.textContent?.toLowerCase() || "";
                    }
                  }
                  
                  // التحقق مع انماط الحقل
                  for (const selector of selectors) {
                    if (parentText.includes(selector.toLowerCase())) {
                      try {
                        input.value = data[dataKey];
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log("تم ملء الحقل عبر النص المحيط:" + selector);
                        filledCount++;
                        fieldFilled = true;
                        updateProgress(50 + (filledCount / totalFields) * 30);
                        break;
                      } catch (e) {
                        console.error("خطأ في ملء الحقل عبر النص المحيط:", e);
                      }
                    }
                  }
                });
              }
            }
            
            updateProgress(85);
            
            // البحث عن أزرار الإرسال أو حفظ النموذج
            setTimeout(() => {
              if (filledCount > 0) {
                showNotification(\`تم ملء \${filledCount} من الحقول بنجاح\`);
              } else {
                showNotification("لم يتم العثور على حقول متطابقة في هذه الصفحة", false);
                updateProgress(100);
                return;
              }
              
              // البحث عن زر الإرسال
              const submitButtonSelectors = [
                'button[type="submit"]',
                'input[type="submit"]'
              ];
              
              const submitKeywords = [
                'حفظ', 'إرسال', 'تأكيد', 'إضافة', 'أضف', 'submit', 'save', 'confirm', 'add', 'إدخال', 'تسجيل'
              ];
              
              // 1. البحث عن أزرار الإرسال المباشرة
              let submitButton = null;
              for (const selector of submitButtonSelectors) {
                submitButton = document.querySelector(selector);
                if (submitButton) break;
              }
              
              // 2. البحث عن أزرار تحتوي على نصوص معينة
              if (!submitButton) {
                const allButtons = [
                  ...document.querySelectorAll('button'),
                  ...document.querySelectorAll('input[type="button"]'),
                  ...document.querySelectorAll('a.btn, a.button')
                ];
                
                submitButton = allButtons.find(btn => {
                  const text = btn.textContent?.toLowerCase() || btn.value?.toLowerCase() || '';
                  return submitKeywords.some(keyword => text.includes(keyword.toLowerCase()));
                });
              }
              
              updateProgress(95);
              
              // إذا تم العثور على زر الإرسال
              if (submitButton) {
                // عرض مربع تأكيد للإرسال
                const confirmDiv = document.createElement('div');
                confirmDiv.style.cssText = \`
                  position: fixed;
                  bottom: 20px;
                  right: 20px;
                  background: rgba(0, 0, 0, 0.85);
                  color: white;
                  padding: 20px;
                  border-radius: 8px;
                  z-index: 10001;
                  font-family: Arial, sans-serif;
                  direction: rtl;
                  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                  width: 300px;
                \`;
                
                confirmDiv.innerHTML = \`
                  <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">تأكيد الإرسال</div>
                  <p style="margin-bottom: 15px; font-size: 14px;">هل تريد إرسال النموذج تلقائياً خلال 3 ثوان؟</p>
                  <div style="display: flex; gap: 10px; justify-content: flex-start;">
                    <button id="autofill-cancel" style="padding: 8px 15px; background: #F44336; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 14px;">إلغاء</button>
                    <button id="autofill-confirm" style="padding: 8px 15px; background: #4CAF50; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 14px;">إرسال الآن</button>
                  </div>
                \`;
                
                document.body.appendChild(confirmDiv);
                
                // إعداد عداد تنازلي
                let countdown = 3;
                const countdownInterval = setInterval(() => {
                  countdown--;
                  if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    // النقر تلقائياً بعد انتهاء العد التنازلي
                    if (document.body.contains(confirmDiv)) {
                      confirmDiv.remove();
                      submitButton.click();
                      updateProgress(100);
                      showNotification("تم إرسال النموذج بنجاح");
                    }
                  } else {
                    // تحديث العداد التنازلي
                    const pElement = confirmDiv.querySelector('p');
                    if (pElement) {
                      pElement.textContent = \`هل تريد إرسال النموذج تلقائياً خلال \${countdown} ثوان؟\`;
                    }
                  }
                }, 1000);
                
                // أزرار التأكيد والإلغاء
                document.getElementById('autofill-cancel')?.addEventListener('click', () => {
                  clearInterval(countdownInterval);
                  confirmDiv.remove();
                  updateProgress(100);
                  showNotification("تم إلغاء إرسال النموذج", false);
                });
                
                document.getElementById('autofill-confirm')?.addEventListener('click', () => {
                  clearInterval(countdownInterval);
                  confirmDiv.remove();
                  submitButton.click();
                  updateProgress(100);
                  showNotification("تم إرسال النموذج بنجاح");
                });
              } else {
                // لم يتم العثور على زر الإرسال
                updateProgress(100);
                showNotification(\`تم ملء \${filledCount} حقول بنجاح، لكن لم يتم العثور على زر إرسال\`);
              }
            }, 1000);
            
            return filledCount;
          };
          
          // تنفيذ الإدخال التلقائي
          const isLoginPage = checkForLoginForm();
          if (!isLoginPage) {
            setTimeout(fillFields, 500);
          }
        } catch (error) {
          console.error("حدث خطأ أثناء تنفيذ الإدخال التلقائي:", error);
          alert("حدث خطأ أثناء تنفيذ الإدخال التلقائي: " + error.message);
        }
      })();
    `.trim();
  };

  const navigateToPreview = () => {
    const lastUsedUrl = localStorage.getItem('lastAutoFillUrl') || localStorage.getItem('lastPreviewUrl');
    if (lastUsedUrl) {
      localStorage.setItem('lastPreviewUrl', lastUsedUrl);
      navigate('/preview');
    } else {
      toast({
        title: "لم يتم تحديد موقع",
        description: "الرجاء استخدام خاصية الإدخال التلقائي أولاً لتحديد الموقع",
        variant: "default"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto"
    >
      <Card className="overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow border-border/60 dark:border-gray-700/60 rounded-xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* صورة العنصر (55% العرض) */}
            <div className="md:col-span-7 border-b md:border-b-0 md:border-l border-border/30 dark:border-gray-700/30">
              <DraggableImage 
                image={image} 
                onImageClick={onImageClick} 
                formatDate={formatDate} 
              />
            </div>
            
            {/* بيانات العنصر (45% العرض) */}
            <div className="md:col-span-5">
              <ImageDataForm 
                image={image} 
                onTextChange={onTextChange} 
              />
            </div>
          </div>
          
          <div className="px-4 pb-4 border-t border-border/30 dark:border-gray-700/30 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ActionButtons 
                imageId={image.id}
                isSubmitting={isSubmitting}
                isCompleted={image.status === "completed"}
                isSubmitted={!!image.submitted}
                isPhoneNumberValid={isPhoneNumberValid}
                onDelete={onDelete}
                onSubmit={onSubmit}
                onExport={handleExport}
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30"
                  onClick={handleAutoFill}
                  disabled={isAutoFilling || !image.extractedText}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isAutoFilling ? "جاري الإدخال..." : "إدخال تلقائي"}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                  onClick={navigateToPreview}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  معاينة الموقع
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <BookmarkletGenerator 
        isOpen={isBookmarkletOpen} 
        onClose={() => setIsBookmarkletOpen(false)} 
        imageData={isBookmarkletOpen ? image : null}
      />
    </motion.div>
  );
};

export default CardItem;
