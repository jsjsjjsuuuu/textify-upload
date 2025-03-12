export interface ApiResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface TextSubmission {
  imageId: string;
  text: string;
  source: string;
  date: string;
}

/**
 * Convert a file to base64 encoded string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        console.log("File converted to base64 successfully, length:", reader.result.length);
        resolve(reader.result);
      } else {
        console.error("FileReader did not return a string");
        reject(new Error("FileReader did not return a string"));
      }
    };
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
      reject(reader.error);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Mock function to simulate sending data to an external API
 * In a real application, this would make an actual HTTP request to your backend
 */
export async function submitTextToApi(data: TextSubmission): Promise<ApiResult> {
  console.log("Submitting data to API:", data);
  
  // Simulate API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        resolve({
          success: true,
          message: "تم إرسال البيانات بنجاح",
          data: {
            id: `submission-${Date.now()}`,
            status: "processed",
            timestamp: new Date().toISOString()
          }
        });
      } else {
        resolve({
          success: false,
          message: "فشل في إرسال البيانات إلى الخادم"
        });
      }
    }, 1500);
  });
}

/**
 * In a real application, you would implement actual API integrations
 * For example, connecting to a specific website or service API
 */
export async function authenticateWithExternalApi(apiKey: string): Promise<ApiResult> {
  // This would be a real API call in production
  return new Promise((resolve) => {
    setTimeout(() => {
      if (apiKey && apiKey.length > 5) {
        resolve({
          success: true,
          message: "تم التحقق من مفتاح API بنجاح",
          data: {
            token: "mock-jwt-token-" + Date.now(),
            expiresIn: 3600
          }
        });
      } else {
        resolve({
          success: false,
          message: "مفتاح API غير صالح"
        });
      }
    }, 1000);
  });
}

/**
 * تحسين وظيفة الإدخال التلقائي مع إضافة وظائف إضافية للتعرف على العناصر وملئها
 */
export async function autoFillWebsiteForm(websiteUrl: string, data: any): Promise<ApiResult> {
  console.log("محاولة ملء النموذج تلقائيًا على:", websiteUrl);
  console.log("البيانات للإدخال:", data);
  
  // التحقق من صحة URL
  if (!websiteUrl || !websiteUrl.startsWith('http')) {
    return {
      success: false,
      message: "يرجى إدخال عنوان URL صالح يبدأ بـ http:// أو https://"
    };
  }
  
  try {
    // تحضير البيانات التي سيتم حقنها في الصفحة المستهدفة
    const formData = {
      code: data.code || "",
      senderName: data.senderName || "",
      phoneNumber: data.phoneNumber || "",
      province: data.province || "",
      price: data.price || "",
      companyName: data.companyName || ""
    };
    
    // تحويل البيانات إلى نص يمكن تضمينه في الرابط
    const encodedData = encodeURIComponent(JSON.stringify(formData));
    
    // إنشاء رابط Bookmarklet للاستخدام المباشر (بدلاً من فتح نافذة جديدة)
    const bookmarkletScript = `
      (function() {
        try {
          // البيانات التي سيتم إدخالها
          const formData = ${JSON.stringify(formData)};
          console.log("تم استلام البيانات للإدخال:", formData);
          
          // دالة تأخير للانتظار قبل التنفيذ
          const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
          
          // وظيفة البحث عن الحقول وملئها
          const findAndFillField = async (selectors, value) => {
            if (!value) return false;
            
            for (const selector of selectors) {
              try {
                // محاولة العثور على العنصر باستخدام منتقي CSS
                const element = document.querySelector(selector);
                if (element) {
                  element.focus();
                  element.value = value;
                  element.dispatchEvent(new Event('input', { bubbles: true }));
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  await delay(100);
                  return true;
                }
              } catch (e) {
                console.warn("خطأ في ملء الحقل", selector, e);
              }
            }
            
            // البحث حسب التسميات والنصوص
            const labelTexts = [
              "name", "اسم", "الاسم", "sender", "مرسل", "المرسل",
              "phone", "هاتف", "رقم", "تلفون", "موبايل", "جوال",
              "province", "محافظة", "مدينة", "city", "منطقة", "موقع",
              "price", "سعر", "تكلفة", "مبلغ", "قيمة", "cost",
              "company", "شركة", "الشركة", "vendor", "مزود", "مؤسسة",
              "code", "رمز", "كود", "الرمز", "الكود", "رقم الطلب"
            ];
            
            // بحث شامل عن عناصر الإدخال بناءً على النصوص والتسميات
            try {
              // البحث عن جميع التسميات وعناصر الإدخال والنصوص
              const labels = document.querySelectorAll('label');
              for (const label of labels) {
                const labelText = label.textContent?.toLowerCase() || '';
                
                if (labelTexts.some(text => labelText.includes(text))) {
                  // محاولة العثور على عنصر الإدخال المرتبط بالتسمية
                  let input = null;
                  
                  // البحث باستخدام العلاقة for
                  if (label.htmlFor) {
                    input = document.getElementById(label.htmlFor);
                  }
                  
                  // البحث عن عناصر الإدخال داخل التسمية
                  if (!input) {
                    input = label.querySelector('input, textarea, select');
                  }
                  
                  // البحث عن عناصر الإدخال بعد التسمية
                  if (!input) {
                    const next = label.nextElementSibling;
                    if (next && (next.tagName === 'INPUT' || next.tagName === 'TEXTAREA' || next.tagName === 'SELECT')) {
                      input = next;
                    }
                  }
                  
                  if (input) {
                    input.focus();
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    await delay(100);
                    return true;
                  }
                }
              }
              
              // البحث عن عناصر الإدخال بناءً على السمات placeholder
              const inputs = document.querySelectorAll('input, textarea, select');
              for (const input of inputs) {
                const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
                const name = input.getAttribute('name')?.toLowerCase() || '';
                const id = input.getAttribute('id')?.toLowerCase() || '';
                
                if (labelTexts.some(text => placeholder.includes(text) || name.includes(text) || id.includes(text))) {
                  input.focus();
                  input.value = value;
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                  await delay(100);
                  return true;
                }
              }
            } catch (e) {
              console.warn("خطأ في البحث الشامل عن الحقول", e);
            }
            
            return false;
          };
          
          // وظيفة رئيسية تبدأ ملء البيانات
          const fillFormData = async () => {
            let filledFields = 0;
            const total = Object.keys(formData).filter(k => formData[k]).length;
            
            // محاولة ملء حقل الكود
            if (formData.code) {
              const filled = await findAndFillField([
                'input[name*="code"]', 'input[id*="code"]', 'input[placeholder*="code"]',
                'input[name*="رمز"]', 'input[id*="رمز"]', 'input[placeholder*="رمز"]',
                'input[name*="كود"]', 'input[id*="كود"]', 'input[placeholder*="كود"]',
                'input[name*="رقم_الطلب"]', 'input[id*="رقم_الطلب"]', 'input[placeholder*="رقم الطلب"]'
              ], formData.code);
              if (filled) filledFields++;
            }
            
            // محاولة ملء حقل اسم المرسل
            if (formData.senderName) {
              const filled = await findAndFillField([
                'input[name*="name"]', 'input[id*="name"]', 'input[placeholder*="name"]',
                'input[name*="اسم"]', 'input[id*="اسم"]', 'input[placeholder*="اسم"]',
                'input[name*="sender"]', 'input[id*="sender"]', 'input[placeholder*="sender"]',
                'input[name*="مرسل"]', 'input[id*="مرسل"]', 'input[placeholder*="مرسل"]'
              ], formData.senderName);
              if (filled) filledFields++;
            }
            
            // محاولة ملء حقل رقم الهاتف
            if (formData.phoneNumber) {
              const filled = await findAndFillField([
                'input[name*="phone"]', 'input[id*="phone"]', 'input[placeholder*="phone"]',
                'input[name*="هاتف"]', 'input[id*="هاتف"]', 'input[placeholder*="هاتف"]',
                'input[name*="mobile"]', 'input[id*="mobile"]', 'input[placeholder*="mobile"]',
                'input[name*="جوال"]', 'input[id*="جوال"]', 'input[placeholder*="جوال"]',
                'input[name*="تلفون"]', 'input[id*="تلفون"]', 'input[placeholder*="تلفون"]',
                'input[type="tel"]'
              ], formData.phoneNumber);
              if (filled) filledFields++;
            }
            
            // محاولة ملء حقل المحافظة
            if (formData.province) {
              const filled = await findAndFillField([
                'input[name*="province"]', 'input[id*="province"]', 'input[placeholder*="province"]',
                'select[name*="province"]', 'select[id*="province"]',
                'input[name*="محافظة"]', 'input[id*="محافظة"]', 'input[placeholder*="محافظة"]',
                'select[name*="محافظة"]', 'select[id*="محافظة"]',
                'input[name*="city"]', 'input[id*="city"]', 'input[placeholder*="city"]',
                'select[name*="city"]', 'select[id*="city"]',
                'input[name*="مدينة"]', 'input[id*="مدينة"]', 'input[placeholder*="مدينة"]',
                'select[name*="مدينة"]', 'select[id*="مدينة"]'
              ], formData.province);
              if (filled) filledFields++;
            }
            
            // محاولة ملء حقل السعر
            if (formData.price) {
              const filled = await findAndFillField([
                'input[name*="price"]', 'input[id*="price"]', 'input[placeholder*="price"]',
                'input[name*="سعر"]', 'input[id*="سعر"]', 'input[placeholder*="سعر"]',
                'input[name*="تكلفة"]', 'input[id*="تكلفة"]', 'input[placeholder*="تكلفة"]',
                'input[name*="مبلغ"]', 'input[id*="مبلغ"]', 'input[placeholder*="مبلغ"]',
                'input[name*="قيمة"]', 'input[id*="قيمة"]', 'input[placeholder*="قيمة"]',
                'input[type="number"]'
              ], formData.price);
              if (filled) filledFields++;
            }
            
            // محاولة ملء حقل اسم الشركة
            if (formData.companyName) {
              const filled = await findAndFillField([
                'input[name*="company"]', 'input[id*="company"]', 'input[placeholder*="company"]',
                'input[name*="شركة"]', 'input[id*="شركة"]', 'input[placeholder*="شركة"]',
                'input[name*="vendor"]', 'input[id*="vendor"]', 'input[placeholder*="vendor"]',
                'input[name*="مزود"]', 'input[id*="مزود"]', 'input[placeholder*="مزود"]'
              ], formData.companyName);
              if (filled) filledFields++;
            }
            
            return { filledFields, total };
          };
          
          // إنشاء عنصر إشعار بنتيجة الإدخال
          const createNotification = (result) => {
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '10px';
            notification.style.right = '10px';
            notification.style.backgroundColor = result.filledFields > 0 ? '#4caf50' : '#f44336';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            notification.style.zIndex = '9999';
            notification.style.direction = 'rtl';
            notification.style.fontFamily = 'Arial, sans-serif';
            notification.style.fontSize = '14px';
            
            if (result.filledFields > 0) {
              notification.textContent = \`تم ملء \${result.filledFields} من \${result.total} حقل بنجاح\`;
            } else {
              notification.textContent = 'لم يتم العثور على حقول مناسبة للملء';
            }
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 5000);
          };
          
          // تنفيذ ملء النموذج بعد تأخير قصير للتأكد من تحميل الصفحة
          setTimeout(async () => {
            const result = await fillFormData();
            createNotification(result);
          }, 1000);
          
        } catch (error) {
          console.error('خطأ:', error);
          
          // إنشاء إشعار بالخطأ
          const errorNotification = document.createElement('div');
          errorNotification.style.position = 'fixed';
          errorNotification.style.top = '10px';
          errorNotification.style.right = '10px';
          errorNotification.style.backgroundColor = '#f44336';
          errorNotification.style.color = 'white';
          errorNotification.style.padding = '10px 20px';
          errorNotification.style.borderRadius = '5px';
          errorNotification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          errorNotification.style.zIndex = '9999';
          errorNotification.style.direction = 'rtl';
          errorNotification.style.fontFamily = 'Arial, sans-serif';
          errorNotification.style.fontSize = '14px';
          errorNotification.textContent = 'حدث خطأ أثناء محاولة ملء النموذج';
          
          document.body.appendChild(errorNotification);
          
          setTimeout(() => {
            document.body.removeChild(errorNotification);
          }, 5000);
        }
      })();
    `;
    
    // تنظيف وترميز النص البرمجي
    const cleanCode = bookmarkletScript
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\n\r]/g, '');
    
    const bookmarkletUrl = `javascript:${encodeURIComponent(cleanCode)}`;
    
    // إنشاء رابط فعلي في الصفحة
    const linkElement = document.createElement('a');
    linkElement.href = bookmarkletUrl;
    linkElement.setAttribute('target', '_blank');
    linkElement.setAttribute('rel', 'noopener noreferrer');
    linkElement.style.display = 'none';
    document.body.appendChild(linkElement);
    
    // النقر على الرابط (سيعمل هذا بدون الحاجة إلى فتح نافذة جديدة)
    linkElement.click();
    
    // إزالة الرابط من DOM
    setTimeout(() => {
      document.body.removeChild(linkElement);
    }, 100);
    
    // النجاح في بدء عملية الإدخال
    return {
      success: true,
      message: "تم بدء عملية الإدخال التلقائي. اذهب إلى الموقع المطلوب وانقر على الرابط المحفوظ في المفضلة.",
      data: {
        bookmarkletUrl: bookmarkletUrl
      }
    };
    
  } catch (error) {
    console.error("خطأ أثناء تنفيذ عملية الإدخال التلقائي:", error);
    return {
      success: false,
      message: "حدث خطأ أثناء تنفيذ عملية الإدخال التلقائي"
    };
  }
}

// تصدير الدوال من geminiService
export * from './geminiService';
