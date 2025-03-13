
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
