import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";

export const useBookmarkletGenerator = (
  imageData: ImageData | null,
  multipleImages: ImageData[] = [],
  isMultiMode: boolean = false,
  isOpen: boolean = false
) => {
  const [bookmarkletCode, setBookmarkletCode] = useState("");
  const [bookmarkletUrl, setBookmarkletUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (isMultiMode && multipleImages.length > 0) {
        generateMultiBookmarklet(multipleImages);
      } else if (imageData) {
        generateBookmarklet(imageData);
      }
    }
  }, [imageData, multipleImages, isOpen, isMultiMode]);

  const generateBookmarklet = (data: ImageData) => {
    // إنشاء الأوبجكت الذي سيتم تصديره
    const exportData = {
      code: data.code || "",
      senderName: data.senderName || "",
      phoneNumber: data.phoneNumber || "",
      province: data.province || "",
      price: data.price || "",
      companyName: data.companyName || ""
    };
    
    // إنشاء كود جافاسكريبت للـ bookmarklet مع تحسينات للأداء
    const bookmarkletScript = `
      (function() {
        try {
          // التحقق من أن الصفحة ليست فارغة
          if (document.location.href === 'about:blank') {
            alert('يرجى الانتقال إلى الموقع المستهدف أولاً قبل تنفيذ الإدخال التلقائي');
            return;
          }
          
          // تخزين آخر URL تم استخدامه
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lastAutoFillUrl', window.location.href);
          }
          
          // البيانات المستخرجة من الصورة
          const exportData = ${JSON.stringify(exportData)};
          console.log("تم استيراد البيانات:", exportData);
          
          // إنشاء نافذة إشعار للمستخدم
          function showNotification(message, type = 'info') {
            const notif = document.createElement('div');
            notif.style.position = 'fixed';
            notif.style.top = '20px';
            notif.style.right = '20px';
            notif.style.padding = '12px 20px';
            notif.style.borderRadius = '4px';
            notif.style.zIndex = '9999';
            notif.style.fontFamily = 'Arial, sans-serif';
            notif.style.direction = 'rtl';
            notif.style.textAlign = 'right';
            notif.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            notif.style.transition = 'all 0.3s ease';
            
            if (type === 'success') {
              notif.style.backgroundColor = '#d4edda';
              notif.style.color = '#155724';
              notif.style.border = '1px solid #c3e6cb';
            } else if (type === 'error') {
              notif.style.backgroundColor = '#f8d7da';
              notif.style.color = '#721c24';
              notif.style.border = '1px solid #f5c6cb';
            } else {
              notif.style.backgroundColor = '#cce5ff';
              notif.style.color = '#004085';
              notif.style.border = '1px solid #b8daff';
            }
            
            notif.textContent = message;
            document.body.appendChild(notif);
            
            setTimeout(() => {
              notif.style.opacity = '0';
              setTimeout(() => document.body.removeChild(notif), 300);
            }, 3000);
          }
          
          // التحقق من صفحة تسجيل الدخول
          function isLoginPage() {
            const loginSignals = [
              document.querySelector('input[type="password"]'),
              document.querySelector('form[action*="login"]'),
              document.querySelector('form[action*="signin"]'),
              document.querySelector('form[action*="authenticate"]')
            ];
            
            // التحقق من وجود كلمات دلالية في العنوان أو الرابط
            const urlHasLoginWord = (
              window.location.href.toLowerCase().includes('login') ||
              window.location.href.toLowerCase().includes('signin') ||
              window.location.href.toLowerCase().includes('auth') ||
              document.title.toLowerCase().includes('login') ||
              document.title.toLowerCase().includes('sign in') ||
              document.title.toLowerCase().includes('تسجيل الدخول')
            );
            
            return loginSignals.some(signal => signal !== null) || urlHasLoginWord;
          }
          
          // محاولة تسجيل الدخول إذا كانت الصفحة تتطلب ذلك
          function attemptLogin() {
            // تحديد الحقول المطلوبة لتسجيل الدخول
            const usernameField = document.querySelector('input[name*="username"], input[name*="email"], input[id*="username"], input[id*="email"]');
            const passwordField = document.querySelector('input[type="password"]');
            
            // إذا لم يتم العثور على حقول تسجيل الدخول، نعرض رسالة خطأ
            if (!usernameField || !passwordField) {
              showNotification('لم يتم العثور على حقول اسم المستخدم أو كلمة المرور', 'error');
              return false;
            }
            
            // ملء بيانات تسجيل الدخول (إذا كانت متوفرة)
            const savedUsername = localStorage.getItem('savedUsername');
            const savedPassword = localStorage.getItem('savedPassword');
            
            if (savedUsername && savedPassword) {
              usernameField.value = savedUsername;
              passwordField.value = savedPassword;
              
              // محاولة إرسال النموذج
              const loginForm = usernameField.closest('form');
              if (loginForm) {
                loginForm.submit();
                showNotification('تم ملء بيانات تسجيل الدخول. جاري محاولة تسجيل الدخول...', 'info');
                return true;
              } else {
                showNotification('تم ملء بيانات تسجيل الدخول. يرجى الضغط على زر تسجيل الدخول', 'info');
                return false;
              }
            } else {
              showNotification('لم يتم العثور على بيانات تسجيل الدخول المحفوظة', 'info');
              return false;
            }
          }
          
          // التحقق من صفحة تسجيل الدخول ومحاولة تسجيل الدخول
          if (isLoginPage()) {
            const loginSuccess = attemptLogin();
            if (loginSuccess) {
              // إذا نجح تسجيل الدخول، نتوقف ونسمح للصفحة بالتحميل
              return;
            }
            
            // إذا لم ينجح تسجيل الدخول، نسأل المستخدم
            if (confirm('يبدو أن هذه صفحة تسجيل دخول. هل تريد حفظ بيانات تسجيل الدخول لاستخدامها لاحقاً؟')) {
              // إنشاء نموذج لإدخال بيانات تسجيل الدخول
              const form = document.createElement('div');
              form.style.position = 'fixed';
              form.style.top = '30%';
              form.style.left = '50%';
              form.style.transform = 'translate(-50%, -50%)';
              form.style.backgroundColor = 'white';
              form.style.padding = '20px';
              form.style.borderRadius = '8px';
              form.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              form.style.zIndex = '10000';
              form.style.minWidth = '300px';
              form.style.maxWidth = '400px';
              form.style.direction = 'rtl';
              
              form.innerHTML = '<h3 style="margin-top: 0; text-align: center; margin-bottom: 15px;">حفظ بيانات تسجيل الدخول</h3>' +
                '<div style="margin-bottom: 10px;">' +
                  '<label style="display: block; margin-bottom: 5px;">اسم المستخدم / البريد الإلكتروني:</label>' +
                  '<input type="text" id="save-username" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">' +
                '</div>' +
                '<div style="margin-bottom: 20px;">' +
                  '<label style="display: block; margin-bottom: 5px;">كلمة المرور:</label>' +
                  '<input type="password" id="save-password" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">' +
                '</div>' +
                '<div style="display: flex; justify-content: space-between;">' +
                  '<button id="save-credentials-cancel" style="padding: 8px 16px; background-color: #f1f1f1; border: none; border-radius: 4px; cursor: pointer;">إلغاء</button>' +
                  '<button id="save-credentials-submit" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">حفظ</button>' +
                '</div>';
              
              document.body.appendChild(form);
              
              // إضافة معالجات الأحداث لأزرار النموذج
              document.getElementById('save-credentials-cancel').addEventListener('click', function() {
                document.body.removeChild(form);
              });
              
              document.getElementById('save-credentials-submit').addEventListener('click', function() {
                const username = (document.getElementById('save-username') as HTMLInputElement).value;
                const password = (document.getElementById('save-password') as HTMLInputElement).value;
                
                if (username && password) {
                  localStorage.setItem('savedUsername', username);
                  localStorage.setItem('savedPassword', password);
                  showNotification('تم حفظ بيانات تسجيل الدخول', 'success');
                } else {
                  showNotification('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
                }
                
                document.body.removeChild(form);
              });
              
              return;
            }
          }
          
          // البحث عن الحقول في الصفحة الحالية
          function findAndFillField(labels, value) {
            if (!value) return false;
            
            // تحسين البحث عن الحقول بإضافة المزيد من المؤشرات
            let allInputs = [];
            
            // حسب الاسم والمعرف ونص التسمية
            for (const label of labels) {
              // البحث عن حقل الإدخال بعدة طرق (حساس لحالة الأحرف)
              const lowerLabel = label.toLowerCase();
              const arabicLabel = label.includes('_') || label.includes('-') ? label.replace(/[_-]/g, '') : label;
              
              const fieldSelectors = [
                'input[name*="' + label + '"]',
                'input[id*="' + label + '"]',
                'input[placeholder*="' + label + '"]',
                'textarea[name*="' + label + '"]',
                'textarea[id*="' + label + '"]',
                'textarea[placeholder*="' + label + '"]',
                'input[name*="' + lowerLabel + '"]',
                'input[id*="' + lowerLabel + '"]',
                'input[placeholder*="' + lowerLabel + '"]',
                'textarea[name*="' + lowerLabel + '"]',
                'textarea[id*="' + lowerLabel + '"]',
                'textarea[placeholder*="' + lowerLabel + '"]',
                'input[data-input-type*="' + label + '"]',
                'input[data-input-type*="' + lowerLabel + '"]',
                'input[data-id*="' + label + '"]',
                'input[data-id*="' + lowerLabel + '"]',
                'input[name*="' + arabicLabel + '"]',
                'input[id*="' + arabicLabel + '"]'
              ];
              
              fieldSelectors.forEach(selector => {
                try {
                  const elements = document.querySelectorAll(selector);
                  if (elements.length > 0) {
                    allInputs.push(...elements);
                  }
                } catch (e) {
                  console.error('خطأ في استخدام المحدد:', selector, e);
                }
              });
            }
            
            // البحث عن التسميات
            try {
              const allLabels = document.querySelectorAll('label');
              for (const labelElement of allLabels) {
                if (!labelElement || !labelElement.textContent) continue;
                const labelText = labelElement.textContent.toLowerCase().trim();
                if (labels.some(l => labelText.includes(l.toLowerCase()))) {
                  const labelFor = labelElement.getAttribute('for');
                  if (labelFor) {
                    const input = document.getElementById(labelFor);
                    if (input) {
                      allInputs.push(input);
                    }
                  } else {
                    // بحث عن الحقول داخل عنصر التسمية
                    const nestedInputs = labelElement.querySelectorAll('input, textarea, select');
                    if (nestedInputs.length > 0) {
                      allInputs.push(...nestedInputs);
                    }
                  }
                }
              }
            } catch (e) {
              console.error('خطأ في البحث عن التسميات:', e);
            }
            
            // إضافة البحث في العناصر النموذجية
            try {
              const formGroups = document.querySelectorAll('.form-group, .input-group, .field');
              formGroups.forEach(group => {
                const groupLabels = group.querySelectorAll('label, .label, .field-label');
                groupLabels.forEach(label => {
                  if (!label || !label.textContent) return;
                  const labelText = label.textContent.toLowerCase().trim();
                  if (labels.some(l => labelText.includes(l.toLowerCase()))) {
                    const inputs = group.querySelectorAll('input, textarea, select');
                    if (inputs.length > 0) {
                      allInputs.push(...inputs);
                    }
                  }
                });
              });
            } catch (e) {
              console.error('خطأ في البحث عن مجموعات النماذج:', e);
            }
            
            // إزالة العناصر المكررة
            const uniqueInputs = Array.from(new Set(allInputs));
            
            // ملء الحقل المناسب
            for (const input of uniqueInputs) {
              if (!input || input.disabled || input.readOnly) continue;
              
              try {
                if (input instanceof HTMLSelectElement) {
                  // للقوائم المنسدلة، ابحث عن الخيار الأقرب
                  const options = Array.from(input.options);
                  const bestMatch = options.find(opt => 
                    opt.text.toLowerCase().includes(value.toLowerCase()) ||
                    value.toLowerCase().includes(opt.text.toLowerCase())
                  );
                  if (bestMatch) {
                    input.value = bestMatch.value;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('تم ملء حقل القائمة المنسدلة: ' + (input.name || input.id));
                    showNotification('تم ملء حقل: ' + labels[0], 'success');
                    return true;
                  }
                } else {
                  input.value = value;
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log('تم ملء الحقل: ' + (input.name || input.id));
                  showNotification('تم ملء حقل: ' + labels[0], 'success');
                  return true;
                }
              } catch (e) {
                console.error('خطأ في ملء الحقل:', e);
              }
            }
            
            return false;
          }
          
          // محاولة ملء الحقول مع عدة محاولات للعثور على الأسماء المناسبة
          const filledFields = {
            code: findAndFillField(['code', 'الكود', 'رمز', 'رقم_الطلب', 'رقم', 'orderid', 'order', 'order-number', 'orderNumber', 'ordernumber', 'shipment', 'tracking'], exportData.code),
            name: findAndFillField(['name', 'الاسم', 'اسم', 'اسم المرسل', 'sender', 'customer', 'fullname', 'full-name', 'full_name', 'العميل', 'المستلم'], exportData.senderName),
            phone: findAndFillField(['phone', 'هاتف', 'رقم الهاتف', 'جوال', 'موبايل', 'mobile', 'tel', 'telephone', 'contact', 'رقم', 'phone-number', 'phonenumber'], exportData.phoneNumber),
            province: findAndFillField(['province', 'محافظة', 'المحافظة', 'city', 'مدينة', 'المدينة', 'region', 'area', 'location', 'address', 'العنوان'], exportData.province),
            price: findAndFillField(['price', 'سعر', 'السعر', 'المبلغ', 'التكلفة', 'amount', 'total', 'cost', 'value', 'القيمة'], exportData.price),
            company: findAndFillField(['company', 'شركة', 'اسم الشركة', 'الشركة', 'vendor', 'supplier', 'provider', 'merchant', 'store'], exportData.companyName)
          };
          
          // عدد الحقول التي تم ملؤها
          const filledCount = Object.values(filledFields).filter(Boolean).length;
          const totalFields = Object.values(exportData).filter(Boolean).length;
          
          if (filledCount > 0) {
            showNotification('تم ملء ' + filledCount + ' من ' + totalFields + ' حقول', 'success');
          } else {
            // إذا لم يتم العثور على أي حقول، عرض رسالة
            showNotification('لم يتم العثور على حقول مطابقة لملء البيانات', 'error');
          }
        } catch (error) {
          console.error('حدث خطأ أثناء ملء البيانات:', error);
          alert('حدث خطأ أثناء ملء البيانات: ' + error.message);
        }
      })();
    `;
    
    // تنظيف الكود وتحويله ليناسب الـ bookmarklet
    const cleanCode = bookmarkletScript
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\n\r]/g, '');
    
    // إنشاء رابط الـ bookmarklet
    const bookmarklet = `javascript:${encodeURIComponent(cleanCode)}`;
    
    setBookmarkletCode(cleanCode);
    setBookmarkletUrl(bookmarklet);
  };

  const generateMultiBookmarklet = (images: ImageData[]) => {
    // تحويل البيانات إلى مصفوفة منظمة
    const exportDataArray = images.map(imageData => ({
      code: imageData.code || "",
      senderName: imageData.senderName || "",
      phoneNumber: imageData.phoneNumber || "",
      province: imageData.province || "",
      price: imageData.price || "",
      companyName: imageData.companyName || ""
    }));

    // إنشاء كود الـ bookmarklet
    const bookmarkletScript = `
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
    
    const cleanCode = bookmarkletScript
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\n\r]/g, '');
    
    const bookmarklet = `javascript:${encodeURIComponent(cleanCode)}`;
    
    setBookmarkletCode(cleanCode);
    setBookmarkletUrl(bookmarklet);
  };

  return {
    bookmarkletCode,
    bookmarkletUrl
  };
};
