
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
            // التحقق مما إذا كانت هناك بيانات مخزنة لهذا الموقع
            if (typeof localStorage !== 'undefined') {
              try {
                const savedCredentials = localStorage.getItem('savedLoginCredentials');
                if (savedCredentials) {
                  const credentials = JSON.parse(savedCredentials);
                  const domain = window.location.hostname;
                  
                  // البحث عن بيانات تسجيل الدخول للنطاق الحالي
                  const domainCredentials = credentials.find(cred => cred.domain === domain);
                  
                  if (domainCredentials) {
                    showNotification('تم العثور على بيانات تسجيل الدخول المحفوظة، جاري تسجيل الدخول...', 'info');
                    
                    // البحث عن حقول اسم المستخدم وكلمة المرور
                    const usernameField = 
                      document.querySelector('input[type="text"][name*="user"]') ||
                      document.querySelector('input[type="email"]') ||
                      document.querySelector('input[name*="email"]') ||
                      document.querySelector('input[name*="login"]') ||
                      document.querySelector('input[id*="user"]') ||
                      document.querySelector('input[id*="email"]') ||
                      document.querySelector('input[id*="login"]');
                      
                    const passwordField = document.querySelector('input[type="password"]');
                    
                    if (usernameField && passwordField) {
                      // ملء الحقول
                      usernameField.value = domainCredentials.username;
                      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                      
                      passwordField.value = domainCredentials.password;
                      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                      
                      // البحث عن زر تسجيل الدخول
                      setTimeout(() => {
                        const submitButton = 
                          document.querySelector('button[type="submit"]') ||
                          document.querySelector('input[type="submit"]') ||
                          document.querySelector('button:contains("تسجيل")') ||
                          document.querySelector('button:contains("دخول")') ||
                          document.querySelector('button:contains("Login")') ||
                          document.querySelector('button:contains("Sign in")');
                          
                        if (submitButton) {
                          submitButton.click();
                          showNotification('تم تسجيل الدخول، جاري تحميل الصفحة...', 'success');
                          return true;
                        }
                      }, 500);
                    }
                  }
                }
              } catch (error) {
                console.error('خطأ في استرجاع بيانات تسجيل الدخول:', error);
              }
            }
            return false;
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
              
              form.innerHTML = \`
                <h3 style="margin-top: 0; text-align: center; margin-bottom: 15px;">حفظ بيانات تسجيل الدخول</h3>
                <div style="margin-bottom: 10px;">
                  <label style="display: block; margin-bottom: 5px;">اسم المستخدم / البريد الإلكتروني:</label>
                  <input type="text" id="save-username" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 20px;">
                  <label style="display: block; margin-bottom: 5px;">كلمة المرور:</label>
                  <input type="password" id="save-password" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <button id="save-credentials-cancel" style="padding: 8px 16px; background-color: #f1f1f1; border: none; border-radius: 4px; cursor: pointer;">إلغاء</button>
                  <button id="save-credentials-submit" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">حفظ</button>
                </div>
              \`;
              
              document.body.appendChild(form);
              
              // إضافة المستمعين للأزرار
              document.getElementById('save-credentials-cancel').addEventListener('click', () => {
                document.body.removeChild(form);
              });
              
              document.getElementById('save-credentials-submit').addEventListener('click', () => {
                const username = (document.getElementById('save-username') as HTMLInputElement).value;
                const password = (document.getElementById('save-password') as HTMLInputElement).value;
                
                if (username && password) {
                  try {
                    const domain = window.location.hostname;
                    const newCredential = {
                      domain,
                      username,
                      password,
                      date: new Date().toISOString()
                    };
                    
                    let savedCredentials = [];
                    const existing = localStorage.getItem('savedLoginCredentials');
                    
                    if (existing) {
                      savedCredentials = JSON.parse(existing);
                      // التحقق من وجود النطاق وتحديثه
                      const index = savedCredentials.findIndex(cred => cred.domain === domain);
                      if (index >= 0) {
                        savedCredentials[index] = newCredential;
                      } else {
                        savedCredentials.push(newCredential);
                      }
                    } else {
                      savedCredentials = [newCredential];
                    }
                    
                    localStorage.setItem('savedLoginCredentials', JSON.stringify(savedCredentials));
                    showNotification('تم حفظ بيانات تسجيل الدخول بنجاح', 'success');
                  } catch (error) {
                    console.error('خطأ في حفظ بيانات تسجيل الدخول:', error);
                    showNotification('حدث خطأ أثناء حفظ بيانات تسجيل الدخول', 'error');
                  }
                } else {
                  showNotification('الرجاء إدخال اسم المستخدم وكلمة المرور', 'error');
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
                `input[name*="${label}"]`,
                `input[id*="${label}"]`,
                `input[placeholder*="${label}"]`,
                `textarea[name*="${label}"]`,
                `textarea[id*="${label}"]`,
                `textarea[placeholder*="${label}"]`,
                `input[name*="${lowerLabel}"]`,
                `input[id*="${lowerLabel}"]`,
                `input[placeholder*="${lowerLabel}"]`,
                `textarea[name*="${lowerLabel}"]`,
                `textarea[id*="${lowerLabel}"]`,
                `textarea[placeholder*="${lowerLabel}"]`,
                `input[data-input-type*="${label}"]`,
                `input[data-input-type*="${lowerLabel}"]`,
                `input[data-id*="${label}"]`,
                `input[data-id*="${lowerLabel}"]`,
                `input[name*="${arabicLabel}"]`,
                `input[id*="${arabicLabel}"]`
              ];
              
              fieldSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                  allInputs.push(...elements);
                }
              });
            }
            
            // البحث عن التسميات
            const allLabels = document.querySelectorAll('label');
            for (const labelElement of allLabels) {
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
            
            // إضافة البحث في العناصر النموذجية
            const formGroups = document.querySelectorAll('.form-group, .input-group, .field');
            formGroups.forEach(group => {
              const groupLabels = group.querySelectorAll('label, .label, .field-label');
              groupLabels.forEach(label => {
                const labelText = label.textContent.toLowerCase().trim();
                if (labels.some(l => labelText.includes(l.toLowerCase()))) {
                  const inputs = group.querySelectorAll('input, textarea, select');
                  if (inputs.length > 0) {
                    allInputs.push(...inputs);
                  }
                }
              });
            });
            
            // إزالة العناصر المكررة
            const uniqueInputs = Array.from(new Set(allInputs));
            
            // ملء الحقل المناسب
            for (const input of uniqueInputs) {
              if (input.disabled || input.readOnly) continue;
              
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
                  console.log(\`تم ملء حقل القائمة المنسدلة: \${input.name || input.id}\`);
                  showNotification(\`تم ملء حقل: \${labels[0]}\`, 'success');
                  return true;
                }
              } else {
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(\`تم ملء الحقل: \${input.name || input.id}\`);
                showNotification(\`تم ملء حقل: \${labels[0]}\`, 'success');
                return true;
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
            showNotification(\`تم ملء \${filledCount} من \${totalFields} حقول\`, 'success');
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
    // تجميع بيانات الصور
    const allExportData = images.map(img => ({
      code: img.code || "",
      senderName: img.senderName || "",
      phoneNumber: img.phoneNumber || "",
      province: img.province || "",
      price: img.price || "",
      companyName: img.companyName || "",
      number: img.number || 0
    }));
    
    // إنشاء كود جافاسكريبت للـ bookmarklet متعدد البيانات مع تحسينات
    const bookmarkletScript = `
      (function() {
        try {
          // تخزين آخر URL تم استخدامه
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lastAutoFillUrl', window.location.href);
          }
          
          // جميع البيانات المستخرجة من الصور
          const allExportData = ${JSON.stringify(allExportData)};
          console.log("تم استيراد البيانات لـ", allExportData.length, "صورة");
          
          // الفهرس الحالي للصورة التي سيتم ملء بياناتها
          let currentIndex = 0;
          
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
            // التحقق مما إذا كانت هناك بيانات مخزنة لهذا الموقع
            if (typeof localStorage !== 'undefined') {
              try {
                const savedCredentials = localStorage.getItem('savedLoginCredentials');
                if (savedCredentials) {
                  const credentials = JSON.parse(savedCredentials);
                  const domain = window.location.hostname;
                  
                  // البحث عن بيانات تسجيل الدخول للنطاق الحالي
                  const domainCredentials = credentials.find(cred => cred.domain === domain);
                  
                  if (domainCredentials) {
                    showNotification('تم العثور على بيانات تسجيل الدخول المحفوظة، جاري تسجيل الدخول...', 'info');
                    
                    // البحث عن حقول اسم المستخدم وكلمة المرور
                    const usernameField = 
                      document.querySelector('input[type="text"][name*="user"]') ||
                      document.querySelector('input[type="email"]') ||
                      document.querySelector('input[name*="email"]') ||
                      document.querySelector('input[name*="login"]') ||
                      document.querySelector('input[id*="user"]') ||
                      document.querySelector('input[id*="email"]') ||
                      document.querySelector('input[id*="login"]');
                      
                    const passwordField = document.querySelector('input[type="password"]');
                    
                    if (usernameField && passwordField) {
                      // ملء الحقول
                      usernameField.value = domainCredentials.username;
                      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                      
                      passwordField.value = domainCredentials.password;
                      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                      
                      // البحث عن زر تسجيل الدخول
                      setTimeout(() => {
                        const loginButton = 
                          document.querySelector('button[type="submit"]') ||
                          document.querySelector('input[type="submit"]') ||
                          document.querySelector('button:contains("تسجيل")') ||
                          document.querySelector('button:contains("دخول")') ||
                          document.querySelector('button:contains("Login")') ||
                          document.querySelector('button:contains("Sign in")');
                          
                        if (loginButton) {
                          loginButton.click();
                          showNotification('تم تسجيل الدخول، جاري تحميل الصفحة...', 'success');
                          return true;
                        }
                      }, 500);
                    }
                  }
                }
              } catch (error) {
                console.error('خطأ في استرجاع بيانات تسجيل الدخول:', error);
              }
            }
            return false;
          }
          
          // التحقق من صفحة تسجيل الدخول ومحاولة تسجيل الدخول
          if (isLoginPage()) {
            const loginSuccess = attemptLogin();
            if (loginSuccess) {
              return;
            }
          }
          
          // دالة للبحث عن الحقول وملئها
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
                \`input[name*="\${label}"]\`,
                \`input[id*="\${label}"]\`,
                \`input[placeholder*="\${label}"]\`,
                \`textarea[name*="\${label}"]\`,
                \`textarea[id*="\${label}"]\`,
                \`textarea[placeholder*="\${label}"]\`,
                \`input[name*="\${lowerLabel}"]\`,
                \`input[id*="\${lowerLabel}"]\`,
                \`input[placeholder*="\${lowerLabel}"]\`,
                \`textarea[name*="\${lowerLabel}"]\`,
                \`textarea[id*="\${lowerLabel}"]\`,
                \`textarea[placeholder*="\${lowerLabel}"]\`,
                \`input[data-input-type*="\${label}"]\`,
                \`input[data-input-type*="\${lowerLabel}"]\`,
                \`input[data-id*="\${label}"]\`,
                \`input[data-id*="\${lowerLabel}"]\`,
                \`input[name*="\${arabicLabel}"]\`,
                \`input[id*="\${arabicLabel}"]\`
              ];
              
              fieldSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                  allInputs.push(...elements);
                }
              });
            }
            
            // البحث عن التسميات
            const allLabels = document.querySelectorAll('label');
            for (const labelElement of allLabels) {
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
            
            // إضافة البحث في العناصر النموذجية
            const formGroups = document.querySelectorAll('.form-group, .input-group, .field');
            formGroups.forEach(group => {
              const groupLabels = group.querySelectorAll('label, .label, .field-label');
              groupLabels.forEach(label => {
                const labelText = label.textContent.toLowerCase().trim();
                if (labels.some(l => labelText.includes(l.toLowerCase()))) {
                  const inputs = group.querySelectorAll('input, textarea, select');
                  if (inputs.length > 0) {
                    allInputs.push(...inputs);
                  }
                }
              });
            });
            
            // إزالة العناصر المكررة
            const uniqueInputs = Array.from(new Set(allInputs));
            
            // ملء الحقل المناسب
            for (const input of uniqueInputs) {
              if (input.disabled || input.readOnly) continue;
              
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
                  console.log(\`تم ملء حقل القائمة المنسدلة: \${input.name || input.id}\`);
                  return true;
                }
              } else {
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(\`تم ملء الحقل: \${input.name || input.id}\`);
                return true;
              }
            }
            
            return false;
          }
          
          // دالة لملء بيانات صورة واحدة
          function fillData(data) {
            showNotification(\`جاري ملء بيانات السجل رقم \${currentIndex + 1}\`, 'info');
            
            const filledFields = {
              code: findAndFillField(['code', 'الكود', 'رمز', 'رقم_الطلب', 'رقم', 'orderid', 'order', 'order-number', 'orderNumber', 'ordernumber', 'shipment', 'tracking'], data.code),
              name: findAndFillField(['name', 'الاسم', 'اسم', 'اسم المرسل', 'sender', 'customer', 'fullname', 'full-name', 'full_name', 'العميل', 'المستلم'], data.senderName),
              phone: findAndFillField(['phone', 'هاتف', 'رقم الهاتف', 'جوال', 'موبايل', 'mobile', 'tel', 'telephone', 'contact', 'رقم', 'phone-number', 'phonenumber'], data.phoneNumber),
              province: findAndFillField(['province', 'محافظة', 'المحافظة', 'city', 'مدينة', 'المدينة', 'region', 'area', 'location', 'address', 'العنوان'], data.province),
              price: findAndFillField(['price', 'سعر', 'السعر', 'المبلغ', 'التكلفة', 'amount', 'total', 'cost', 'value', 'القيمة'], data.price),
              company: findAndFillField(['company', 'شركة', 'اسم الشركة', 'الشركة', 'vendor', 'supplier', 'provider', 'merchant', 'store'], data.companyName)
            };
            
            // عدد الحقول التي تم ملؤها
            const filledCount = Object.values(filledFields).filter(Boolean).length;
            const totalFields = Object.values(data).filter(Boolean).length;
            
            if (filledCount > 0) {
              showNotification(\`تم ملء \${filledCount} من \${totalFields} حقول\`, 'success');
              return true;
            } else {
              // إذا لم يتم العثور على أي حقول، عرض رسالة
              showNotification('لم يتم العثور على حقول مطابقة لملء البيانات', 'error');
              return false;
            }
          }
          
          // إنشاء لوحة تحكم متحركة
          const createPanel = () => {
            const panel = document.createElement('div');
            panel.style.position = 'fixed';
            panel.style.top = '10px';
            panel.style.right = '10px';
            panel.style.backgroundColor = '#ffffff';
            panel.style.border = '1px solid #e0e0e0';
            panel.style.borderRadius = '8px';
            panel.style.padding = '12px';
            panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            panel.style.zIndex = '9999';
            panel.style.direction = 'rtl';
            panel.style.fontFamily = 'Arial, sans-serif';
            panel.style.minWidth = '280px';
            
            const title = document.createElement('div');
            title.innerHTML = \`
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; cursor: move;">
                <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">أداة ملء البيانات تلقائياً</h3>
                <span id="panel-close" style="cursor: pointer; font-size: 18px; color: #777;">&times;</span>
              </div>
            \`;
            panel.appendChild(title);
            
            const info = document.createElement('div');
            info.innerHTML = \`
              <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span>السجل: <span id="current-index" style="font-weight: bold;">\${currentIndex + 1}</span> من <span style="font-weight: bold;">\${allExportData.length}</span></span>
                <span id="progress-info" style="font-size: 12px; color: #777;"></span>
              </div>
            \`;
            panel.appendChild(info);
            
            const progressBar = document.createElement('div');
            progressBar.innerHTML = \`
              <div style="height: 6px; background-color: #f0f0f0; border-radius: 3px; margin-bottom: 12px; overflow: hidden;">
                <div id="progress-bar" style="height: 100%; width: \${((currentIndex + 1) / allExportData.length) * 100}%; background-color: #4CAF50; transition: width 0.3s;"></div>
              </div>
            \`;
            panel.appendChild(progressBar);
            
            const dataDisplay = document.createElement('div');
            dataDisplay.innerHTML = \`
              <div id="current-data" style="margin-bottom: 12px; font-size: 13px; background-color: #f9f9f9; padding: 8px; border-radius: 4px; max-height: 120px; overflow-y: auto;">
                <div><strong>الكود:</strong> <span id="data-code">\${allExportData[currentIndex].code || '-'}</span></div>
                <div><strong>الاسم:</strong> <span id="data-name">\${allExportData[currentIndex].senderName || '-'}</span></div>
                <div><strong>الهاتف:</strong> <span id="data-phone">\${allExportData[currentIndex].phoneNumber || '-'}</span></div>
                <div><strong>المحافظة:</strong> <span id="data-province">\${allExportData[currentIndex].province || '-'}</span></div>
                <div><strong>السعر:</strong> <span id="data-price">\${allExportData[currentIndex].price || '-'}</span></div>
                <div><strong>الشركة:</strong> <span id="data-company">\${allExportData[currentIndex].companyName || '-'}</span></div>
              </div>
            \`;
            panel.appendChild(dataDisplay);
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.gap = '8px';
            
            const controlButtons = \`
              <button id="prev-button" \${currentIndex === 0 ? 'disabled' : ''} style="flex: 1; padding: 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; opacity: \${currentIndex === 0 ? '0.5' : '1'};">السابق</button>
              <button id="fill-button" style="flex: 1; padding: 8px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">ملء</button>
              <button id="next-button" \${currentIndex >= allExportData.length - 1 ? 'disabled' : ''} style="flex: 1; padding: 8px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; opacity: \${currentIndex >= allExportData.length - 1 ? '0.5' : '1'};">التالي</button>
            \`;
            
            buttonsContainer.innerHTML = controlButtons;
            panel.appendChild(buttonsContainer);
            
            const submitContainer = document.createElement('div');
            submitContainer.style.marginTop = '8px';
            submitContainer.innerHTML = \`
              <button id="submit-button" style="width: 100%; padding: 8px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 4px;">حفظ/إرسال النموذج</button>
            \`;
            panel.appendChild(submitContainer);
            
            document.body.appendChild(panel);
            
            // إضافة أحداث الأزرار
            document.getElementById('panel-close').addEventListener('click', () => {
              document.body.removeChild(panel);
            });
            
            document.getElementById('prev-button').addEventListener('click', () => {
              if (currentIndex > 0) {
                currentIndex--;
                updatePanelInfo();
              }
            });
            
            document.getElementById('next-button').addEventListener('click', () => {
              if (currentIndex < allExportData.length - 1) {
                currentIndex++;
                updatePanelInfo();
              }
            });
            
            document.getElementById('fill-button').addEventListener('click', () => {
              fillData(allExportData[currentIndex]);
            });
            
            document.getElementById('submit-button').addEventListener('click', () => {
              if (findAndClickSubmitButton()) {
                showNotification('تم إرسال/حفظ النموذج بنجاح', 'success');
                
                // الانتقال إلى السجل التالي بعد الإرسال
                if (currentIndex < allExportData.length - 1) {
                  setTimeout(() => {
                    currentIndex++;
                    updatePanelInfo();
                    // إذا تم الانتقال لصفحة جديدة، قد نحتاج لإعادة إنشاء اللوحة
                    setTimeout(checkAndReapplyPanel, 1000);
                  }, 1000);
                } else {
                  showNotification('تم الانتهاء من جميع السجلات!', 'success');
                }
              } else {
                showNotification('لم يتم العثور على زر إرسال/حفظ', 'error');
              }
            });
            
            // جعل اللوحة قابلة للسحب
            let isDragging = false;
            let offsetX, offsetY;
            
            const headerElement = title.querySelector('div');
            headerElement.addEventListener('mousedown', (e) => {
              isDragging = true;
              offsetX = e.clientX - panel.getBoundingClientRect().left;
              offsetY = e.clientY - panel.getBoundingClientRect().top;
              headerElement.style.cursor = 'grabbing';
            });
            
            document.addEventListener('mousemove', (e) => {
              if (isDragging) {
                panel.style.right = 'auto';
                panel.style.left = (e.clientX - offsetX) + 'px';
                panel.style.top = (e.clientY - offsetY) + 'px';
              }
            });
            
            document.addEventListener('mouseup', () => {
              if (isDragging) {
                isDragging = false;
                headerElement.style.cursor = 'grab';
              }
            });
            
            // وظيفة تحديث معلومات اللوحة
            function updatePanelInfo() {
              document.getElementById('current-index').textContent = (currentIndex + 1).toString();
              document.getElementById('progress-bar').style.width = \`\${((currentIndex + 1) / allExportData.length) * 100}%\`;
              document.getElementById('progress-info').textContent = \`\${Math.round(((currentIndex + 1) / allExportData.length) * 100)}%\`;
              
              // تحديث بيانات السجل الحالي
              document.getElementById('data-code').textContent = allExportData[currentIndex].code || '-';
              document.getElementById('data-name').textContent = allExportData[currentIndex].senderName || '-';
              document.getElementById('data-phone').textContent = allExportData[currentIndex].phoneNumber || '-';
              document.getElementById('data-province').textContent = allExportData[currentIndex].province || '-';
              document.getElementById('data-price').textContent = allExportData[currentIndex].price || '-';
              document.getElementById('data-company').textContent = allExportData[currentIndex].companyName || '-';
              
              // تحديث حالة الأزرار
              const prevButton = document.getElementById('prev-button');
              const nextButton = document.getElementById('next-button');
              
              prevButton.disabled = currentIndex === 0;
              prevButton.style.opacity = currentIndex === 0 ? '0.5' : '1';
              
              nextButton.disabled = currentIndex >= allExportData.length - 1;
              nextButton.style.opacity = currentIndex >= allExportData.length - 1 ? '0.5' : '1';
            }
            
            return panel;
          };
          
          // وظيفة للبحث عن زر الإرسال والضغط عليه
          function findAndClickSubmitButton() {
            const submitPatterns = ['submit', 'إرسال', 'حفظ', 'تأكيد', 'ارسال', 'save', 'ok', 'نشر'];
            
            // البحث في أزرار التقديم
            const submitButtons = document.querySelectorAll('input[type="submit"], button[type="submit"]');
            for (const button of submitButtons) {
              button.click();
              return true;
            }
            
            // البحث في الأزرار حسب النص
            const allButtons = document.querySelectorAll('button');
            for (const pattern of submitPatterns) {
              for (const button of allButtons) {
                if (button.textContent.toLowerCase().includes(pattern)) {
                  button.click();
                  return true;
                }
              }
            }
            
            // البحث في عناصر a التي تبدو كأزرار
            const links = document.querySelectorAll('a.btn, a.button, .btn, .button');
            for (const pattern of submitPatterns) {
              for (const link of links) {
                if (link.textContent.toLowerCase().includes(pattern)) {
                  link.click();
                  return true;
                }
              }
            }
            
            return false;
          }
          
          // وظيفة للتحقق من وجود اللوحة وإعادة إنشائها إذا لزم الأمر
          function checkAndReapplyPanel() {
            if (!document.querySelector('#panel-close')) {
              const panel = createPanel();
              document.body.appendChild(panel);
            }
          }
          
          // إضافة لوحة التحكم إلى الصفحة
          const panel = createPanel();
          
          // ملء البيانات الأولى تلقائياً
          fillData(allExportData[currentIndex]);
          
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

  return {
    bookmarkletCode,
    bookmarkletUrl
  };
};
