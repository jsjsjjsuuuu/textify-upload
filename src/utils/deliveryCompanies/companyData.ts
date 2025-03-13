
import { DeliveryCompany } from "@/types/DeliveryCompany";

// قائمة بشركات التوصيل المدعومة مع أنماط البحث عن الحقول المخصصة لكل شركة
export const DELIVERY_COMPANIES: DeliveryCompany[] = [
  {
    id: "aramex",
    name: "أرامكس",
    logoUrl: "/companies/aramex.png",
    websiteUrl: "https://www.aramex.com",
    color: "#CF0A2C",
    loginRequired: true,
    loginUrl: "https://www.aramex.com/login",
    formUrl: "https://www.aramex.com/shipment-entry",
    fields: [
      {
        name: "senderName",
        selectors: [
          'input[name*="sender"]', 
          'input[id*="sender"]',
          'input[placeholder*="اسم المرسل"]'
        ],
        description: "اسم المرسل"
      },
      {
        name: "phoneNumber",
        selectors: [
          'input[name*="phone"]', 
          'input[id*="mobile"]',
          'input[type="tel"]'
        ],
        description: "رقم الهاتف"
      },
      {
        name: "province",
        selectors: [
          'select[name*="city"]', 
          'select[id*="province"]',
          'input[name*="city"]'
        ],
        description: "المحافظة"
      },
      {
        name: "code",
        selectors: [
          'input[name*="reference"]', 
          'input[id*="reference"]',
          'input[name*="AWB"]'
        ],
        description: "رقم الطلب"
      },
      {
        name: "price",
        selectors: [
          'input[name*="amount"]', 
          'input[id*="COD"]',
          'input[name*="cash"]'
        ],
        description: "المبلغ"
      }
    ],
    isActive: true,
    usageCount: 0,
    isCustomScript: false
  },
  {
    id: "dhl",
    name: "دي إتش إل",
    logoUrl: "/companies/dhl.png",
    websiteUrl: "https://www.dhl.com",
    color: "#FFCC00",
    loginRequired: true,
    loginUrl: "https://www.dhl.com/login",
    formUrl: "https://www.dhl.com/shipment-entry",
    fields: [
      {
        name: "senderName",
        selectors: [
          'input[name*="shipper"]', 
          'input[id*="sender"]'
        ],
        description: "اسم المرسل"
      },
      {
        name: "phoneNumber",
        selectors: [
          'input[name*="phone"]', 
          'input[id*="mobile"]'
        ],
        description: "رقم الهاتف"
      },
      {
        name: "province",
        selectors: [
          'select[name*="city"]', 
          'select[id*="destination"]'
        ],
        description: "المحافظة"
      },
      {
        name: "code",
        selectors: [
          'input[name*="reference"]', 
          'input[id*="tracking"]'
        ],
        description: "رقم الطلب"
      },
      {
        name: "price",
        selectors: [
          'input[name*="value"]', 
          'input[id*="amount"]'
        ],
        description: "المبلغ"
      }
    ],
    isActive: true,
    usageCount: 0,
    isCustomScript: false
  },
  {
    id: "fedex",
    name: "فيديكس",
    logoUrl: "/companies/fedex.png",
    websiteUrl: "https://www.fedex.com",
    color: "#4D148C",
    loginRequired: true,
    loginUrl: "https://www.fedex.com/login",
    formUrl: "https://www.fedex.com/shipping",
    fields: [
      {
        name: "senderName",
        selectors: [
          'input[name*="sender"]', 
          'input[id*="shipper"]'
        ],
        description: "اسم المرسل"
      },
      {
        name: "phoneNumber",
        selectors: [
          'input[name*="phone"]', 
          'input[id*="telephone"]'
        ],
        description: "رقم الهاتف"
      },
      {
        name: "province",
        selectors: [
          'select[name*="city"]', 
          'select[id*="city"]'
        ],
        description: "المحافظة"
      },
      {
        name: "code",
        selectors: [
          'input[name*="reference"]', 
          'input[id*="tracking"]'
        ],
        description: "رقم الطلب"
      },
      {
        name: "price",
        selectors: [
          'input[name*="value"]', 
          'input[id*="declared"]'
        ],
        description: "المبلغ"
      }
    ],
    isActive: true,
    usageCount: 0,
    isCustomScript: false
  },
  {
    id: "alshalal",
    name: "الشلال للتوصيل السريع",
    logoUrl: "/companies/alshalal.png",
    websiteUrl: "https://malshalal-exp.com",
    color: "#0078D7",
    loginRequired: true,
    loginUrl: "https://malshalal-exp.com/home.php",
    formUrl: "https://malshalal-exp.com/home.php",
    fields: [
      {
        name: "senderName",
        selectors: [
          'input[name*="receiver"]',
          'input[id*="receiver"]',
          'input[placeholder*="اسم المستلم"]'
        ],
        description: "اسم المستلم"
      },
      {
        name: "phoneNumber",
        selectors: [
          'input[name*="phone"]', 
          'input[id*="phone"]',
          'input[placeholder*="رقم الجوال"]'
        ],
        description: "رقم الهاتف"
      },
      {
        name: "province",
        selectors: [
          'select[name*="city"]',
          'select[id*="city"]',
          'select[placeholder*="المدينة"]'
        ],
        description: "المدينة"
      },
      {
        name: "code",
        selectors: [
          'input[name*="shipment"]',
          'input[id*="ref"]',
          'input[placeholder*="رقم الشحنة"]'
        ],
        description: "رقم الشحنة"
      },
      {
        name: "price",
        selectors: [
          'input[name*="amount"]',
          'input[id*="amount"]',
          'input[placeholder*="المبلغ"]'
        ],
        description: "المبلغ"
      },
      {
        name: "carrierId",
        selectors: [
          'select[name*="carrier"]',
          'select[id*="carrier"]',
          'select[placeholder*="الخط الناقل"]'
        ],
        description: "الخط الناقل"
      }
    ],
    isActive: true,
    usageCount: 0,
    isCustomScript: true,
    autofillScript: `
      (function() {
        try {
          console.log("بدء عملية الإدخال التلقائي لشركة الشلال للتوصيل السريع");
          
          // تفاصيل تسجيل الدخول
          const username = 'ساسكو';
          const password = '11331133';
          
          // التحقق مما إذا كنا في صفحة تسجيل الدخول
          if (window.location.href.includes('/home.php') && document.querySelector('input[name="username"]')) {
            console.log("تم اكتشاف صفحة تسجيل الدخول، جاري تسجيل الدخول...");
            
            // ملء نموذج تسجيل الدخول
            const usernameField = document.querySelector('input[name="username"]');
            const passwordField = document.querySelector('input[name="password"]');
            const loginForm = usernameField?.closest('form');
            
            if (usernameField && passwordField && loginForm) {
              usernameField.value = username;
              passwordField.value = password;
              
              // محاكاة أحداث إدخال للتأكد من تنشيط الحقول
              usernameField.dispatchEvent(new Event('input', { bubbles: true }));
              passwordField.dispatchEvent(new Event('input', { bubbles: true }));
              
              // تقديم النموذج
              setTimeout(() => {
                const loginButton = loginForm.querySelector('button[type="submit"], input[type="submit"]');
                if (loginButton) {
                  loginButton.click();
                } else {
                  loginForm.submit();
                }
                console.log("تم تقديم نموذج تسجيل الدخول");
              }, 500);
              
              // عرض إشعار للمستخدم
              const notification = document.createElement('div');
              notification.style = \`
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background-color: rgba(0, 150, 0, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                direction: rtl;
                font-family: Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              \`;
              
              notification.textContent = "جاري تسجيل الدخول بحساب ساسكو...";
              document.body.appendChild(notification);
              
              return {
                success: true,
                message: "جاري تسجيل الدخول"
              };
            }
          }
          
          // إذا كنا في صفحة إضافة طلب
          const addOrderLink = Array.from(document.querySelectorAll('a')).find(a => 
            a.textContent && a.textContent.includes('اضف طلب')
          );
          
          if (addOrderLink && !window.location.href.includes('add_order.php')) {
            console.log("تم العثور على رابط 'اضف طلب'، جاري النقر عليه...");
            addOrderLink.click();
            
            // عرض إشعار للمستخدم
            const notification = document.createElement('div');
            notification.style = \`
              position: fixed;
              top: 10px;
              right: 10px;
              z-index: 9999;
              background-color: rgba(0, 150, 0, 0.8);
              color: white;
              padding: 10px 15px;
              border-radius: 5px;
              direction: rtl;
              font-family: Arial, sans-serif;
              font-size: 14px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            \`;
            
            notification.textContent = "جاري الانتقال إلى صفحة اضافة طلب...";
            document.body.appendChild(notification);
            
            return {
              success: true,
              message: "جاري الانتقال إلى صفحة إضافة طلب"
            };
          }
          
          // بيانات الإدخال التلقائي
          const autofillData = {
            senderName: '{{senderName}}',
            phoneNumber: '{{phoneNumber}}',
            province: '{{province}}',
            code: '{{code}}',
            price: '{{price}}',
            carrierId: '{{carrierId}}'
          };
          
          // استبدال القيم الديناميكية في البيانات
          for (const key in autofillData) {
            if (autofillData[key] && autofillData[key].startsWith('{{') && autofillData[key].endsWith('}}')) {
              const dataKey = autofillData[key].slice(2, -2);
              autofillData[key] = window.autofillData && window.autofillData[dataKey] ? window.autofillData[dataKey] : '';
            }
          }
          
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
          
          // ملء جميع الحقول
          let totalFound = 0;
          let totalFilled = 0;
          
          // حقول الفورم
          const fields = [
            { name: 'senderName', selectors: ['input[name*="receiver"]', 'input[id*="receiver"]', 'input[placeholder*="اسم المستلم"]'] },
            { name: 'phoneNumber', selectors: ['input[name*="phone"]', 'input[id*="phone"]', 'input[placeholder*="رقم الجوال"]'] },
            { name: 'province', selectors: ['select[name*="city"]', 'select[id*="city"]', 'select[placeholder*="المدينة"]'] },
            { name: 'code', selectors: ['input[name*="shipment"]', 'input[id*="ref"]', 'input[placeholder*="رقم الشحنة"]'] },
            { name: 'price', selectors: ['input[name*="amount"]', 'input[id*="amount"]', 'input[placeholder*="المبلغ"]'] },
            { name: 'carrierId', selectors: ['select[name*="carrier"]', 'select[id*="carrier"]', 'select[placeholder*="الخط الناقل"]'] }
          ];
          
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
          
          // إرسال رسالة نجاح
          return {
            success: true,
            fieldsFound: totalFound,
            fieldsFilled: totalFilled,
            message: \`تم تنفيذ الإدخال التلقائي: \${totalFilled} حقل من أصل \${totalFound} حقل\`
          };
        } catch (error) {
          console.error("خطأ في تنفيذ الإدخال التلقائي:", error);
          
          // إظهار إشعار للمستخدم
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
          
          notification.textContent = "حدث خطأ أثناء محاولة ملء النموذج: " + error.message;
          document.body.appendChild(notification);
          
          return {
            success: false,
            error: error.message || "خطأ غير معروف",
            message: "فشل في تنفيذ الإدخال التلقائي"
          };
        }
      })();
    `
  }
  // يمكن إضافة المزيد من الشركات هنا
];

// وظيفة للحصول على شركة توصيل حسب المعرف
export const getDeliveryCompanyById = (id: string): DeliveryCompany | undefined => {
  return DELIVERY_COMPANIES.find(company => company.id === id);
};

// وظيفة للحصول على الشركات النشطة فقط
export const getActiveDeliveryCompanies = (): DeliveryCompany[] => {
  return DELIVERY_COMPANIES.filter(company => company.isActive);
};

// حفظ بيانات الشركات في التخزين المحلي
export const saveDeliveryCompanies = (): void => {
  localStorage.setItem('deliveryCompanies', JSON.stringify(DELIVERY_COMPANIES));
};

// استرجاع بيانات الشركات من التخزين المحلي
export const loadDeliveryCompanies = (): void => {
  const savedCompanies = localStorage.getItem('deliveryCompanies');
  if (savedCompanies) {
    const companies = JSON.parse(savedCompanies) as DeliveryCompany[];
    
    // تحديث القائمة الرئيسية مع الحفاظ على المراجع
    for (let i = 0; i < DELIVERY_COMPANIES.length; i++) {
      const savedCompany = companies.find(c => c.id === DELIVERY_COMPANIES[i].id);
      if (savedCompany) {
        // تحديث الخصائص القابلة للتعديل فقط
        DELIVERY_COMPANIES[i].isActive = savedCompany.isActive;
        DELIVERY_COMPANIES[i].lastUsed = savedCompany.lastUsed ? new Date(savedCompany.lastUsed) : undefined;
        DELIVERY_COMPANIES[i].usageCount = savedCompany.usageCount;
        DELIVERY_COMPANIES[i].autofillScript = savedCompany.autofillScript;
        DELIVERY_COMPANIES[i].isCustomScript = savedCompany.isCustomScript;
        DELIVERY_COMPANIES[i].notes = savedCompany.notes;
      }
    }
    
    // إضافة أي شركات جديدة تمت إضافتها من قبل المستخدم
    companies.forEach(company => {
      if (!DELIVERY_COMPANIES.some(c => c.id === company.id) && company.id.startsWith('custom-')) {
        DELIVERY_COMPANIES.push(company);
      }
    });
  }
};

// استدعاء وظيفة تحميل البيانات عند بدء التطبيق
loadDeliveryCompanies();

// تحديث إحصائيات الاستخدام لشركة معينة
export const updateCompanyUsageStats = (companyId: string): void => {
  const company = getDeliveryCompanyById(companyId);
  if (company) {
    company.usageCount += 1;
    company.lastUsed = new Date();
    saveDeliveryCompanies();
  }
};

// إضافة شركة توصيل جديدة مخصصة
export const addCustomDeliveryCompany = (company: Omit<DeliveryCompany, 'id' | 'usageCount' | 'isActive'>): DeliveryCompany => {
  const id = `custom-${Date.now()}`;
  const newCompany: DeliveryCompany = {
    ...company,
    id,
    usageCount: 0,
    isActive: true
  };
  
  DELIVERY_COMPANIES.push(newCompany);
  saveDeliveryCompanies();
  return newCompany;
};

// تحديث شركة توصيل موجودة
export const updateDeliveryCompany = (companyId: string, updates: Partial<DeliveryCompany>): boolean => {
  const index = DELIVERY_COMPANIES.findIndex(c => c.id === companyId);
  if (index >= 0) {
    DELIVERY_COMPANIES[index] = { ...DELIVERY_COMPANIES[index], ...updates };
    saveDeliveryCompanies();
    return true;
  }
  return false;
};
