
import { FieldMapping } from "./types";

/**
 * تعريفات حقول الإدخال المشتركة في مواقع الشحن العراقية
 * هذه التعريفات تساعد في العثور على الحقول وملئها بشكل صحيح
 */
export const COMMON_FIELD_MAPPINGS: FieldMapping[] = [
  // كود الشحنة أو رقم الوصل
  {
    key: "code",
    selectors: [
      "input[name*='code']", 
      "input[id*='code']",
      "input[name*='reference']",
      "input[id*='reference']",
      "input[placeholder*='الكود']",
      "input[placeholder*='رقم الوصل']",
      "input[placeholder*='رقم البوليصة']",
      "input[placeholder*='رقم الشحنة']",
      "input[placeholder*='رقم الطلب']",
      "input[name*='order']", 
      "input[id*='order']",
      "input[name*='tracking']",
      "input[id*='tracking']",
      "input[placeholder*='الرقم المرجعي']",
      "input[data-field='code']",
      "input[name='bill_number']",
      "input[id='bill_number']",
      "input[name='shipment_number']",
      "input[id='shipment_number']"
    ],
    aliases: ["reference", "orderCode", "orderNumber", "shipmentCode", "bill_number", "waybill", "shipment_number"],
    required: false
  },
  
  // حقول العميل/المرسل
  {
    key: "customerName",
    selectors: [
      "input[name*='customer'][name*='name']", 
      "input[id*='customer'][id*='name']",
      "select[name*='customer']",
      "select[id*='customer']",
      "input[name*='sender']", 
      "input[id*='sender']",
      "select[name*='sender']",
      "select[id*='sender']",
      "input[placeholder*='اسم العميل']",
      "input[placeholder*='اسم المرسل']",
      "input[aria-label*='اسم العميل']",
      "input[name='name']",
      "input[name='customer']",
      "input[id='client_name']",
      "input[name='client_name']",
      "select[name='client_id']",
      "select[id='client_id']",
      "input[data-field='customer_name']"
    ],
    aliases: ["sender", "client", "name", "clientName", "senderName", "client_name", "client_id", "customer_id"],
    required: true
  },
  
  // رقم هاتف العميل/المرسل
  {
    key: "customerPhone",
    selectors: [
      "input[name*='customer'][name*='phone']", 
      "input[id*='customer'][id*='phone']",
      "input[name*='sender'][name*='phone']",
      "input[name*='phone']",
      "input[id*='phone']",
      "input[placeholder*='رقم الهاتف']",
      "input[placeholder*='الهاتف']",
      "input[placeholder*='موبايل']",
      "input[type='tel']",
      "input[data-field='phone']",
      "input[name='mobile']",
      "input[id='mobile']",
      "input[name='client_phone']",
      "input[id='client_phone']",
      "input[name='customer_mobile']",
      "input[id='customer_mobile']"
    ],
    aliases: ["phone", "mobile", "telephone", "senderPhone", "clientPhone", "client_phone", "customer_mobile"],
    required: true,
    transform: (value) => {
      // تحسين معالجة أرقام الهواتف العراقية
      const digitsOnly = value.replace(/[^\d]/g, '');
      
      // إضافة إصلاح لأرقام الهواتف العراقية
      if (digitsOnly.length === 10 && digitsOnly.startsWith('7')) {
        return '0' + digitsOnly; // إضافة الصفر في البداية
      } else if (digitsOnly.length === 11 && digitsOnly.startsWith('07')) {
        return digitsOnly; // الحفاظ على الرقم كما هو
      } else if (digitsOnly.length === 13 && digitsOnly.startsWith('9647')) {
        return '0' + digitsOnly.substring(3); // تحويل الرقم الدولي إلى محلي
      } else if (digitsOnly.length === 14 && digitsOnly.startsWith('00964')) {
        return '0' + digitsOnly.substring(5); // تحويل الرقم الدولي بصيغة 00 إلى محلي
      }
      
      return value;
    }
  },
  
  // اسم المستلم
  {
    key: "receiverName",
    selectors: [
      "input[name*='receiver']", 
      "input[id*='receiver']",
      "input[name*='recipient']",
      "input[id*='recipient']",
      "input[placeholder*='اسم المستلم']",
      "input[aria-label*='المستلم']",
      "input[data-field='receiver_name']",
      "input[name='consignee']",
      "input[id='consignee']"
    ],
    aliases: ["receiver", "recipient", "receivingParty", "consignee"],
    required: false
  },
  
  // المنطقة أو المحافظة
  {
    key: "area",
    selectors: [
      "select[name*='area']", 
      "select[id*='area']",
      "select[name*='city']",
      "select[id*='city']",
      "select[name*='province']",
      "select[id*='province']",
      "select[placeholder*='المحافظة']",
      "select[placeholder*='المنطقة']",
      "select[name*='governorate']",
      "select[id*='governorate']",
      "select[name='destination']",
      "select[id='destination']",
      "select[data-field='area']",
      "input[name*='province']",
      "input[id*='province']",
      "input[placeholder*='المحافظة']",
      "input[name='city']",
      "input[id='city']"
    ],
    aliases: ["province", "city", "governorate", "region", "destination"],
    required: true
  },
  
  // المبلغ
  {
    key: "totalAmount",
    selectors: [
      "input[name*='amount']", 
      "input[id*='amount']",
      "input[name*='price']",
      "input[id*='price']",
      "input[name*='total']",
      "input[id*='total']",
      "input[placeholder*='المبلغ']",
      "input[placeholder*='السعر']",
      "input[type='number'][name*='amount']",
      "input[data-field='amount']",
      "input[name='total_amount']",
      "input[id='total_amount']",
      "input[name='cod_amount']",
      "input[id='cod_amount']",
      "input[name='grand_total']",
      "input[id='grand_total']"
    ],
    aliases: ["price", "amount", "cost", "fee", "orderAmount", "cod_amount", "total_amount", "grand_total"],
    required: true,
    transform: (value) => {
      // تحسين معالجة المبالغ
      if (!value || value.toLowerCase() === 'مجاني' || value.toLowerCase() === 'free' || 
          value.toLowerCase() === 'واصل' || value.toLowerCase() === 'توصيل') {
        return '0';
      }
      
      // إزالة كل شيء ما عدا الأرقام والنقطة العشرية
      const numericValue = value.replace(/[^\d.]/g, '');
      
      // التحقق من وجود قيمة صالحة
      if (!numericValue || isNaN(Number(numericValue))) {
        return '0';
      }
      
      return numericValue;
    }
  },
  
  // اسم المندوب
  {
    key: "delegateName",
    selectors: [
      "select[name*='delegate']", 
      "select[id*='delegate']",
      "select[name*='agent']",
      "select[id*='agent']",
      "select[placeholder*='المندوب']",
      "select[placeholder*='الموظف']",
      "select[name='employee_id']",
      "select[id='employee_id']",
      "select[name='driver_id']",
      "select[id='driver_id']",
      "select[data-field='delegate']"
    ],
    aliases: ["delegate", "agent", "employee", "deliveryAgent", "driver", "employee_id", "driver_id"],
    required: false
  },
  
  // نوع البضاعة
  {
    key: "packageType",
    selectors: [
      "select[name*='type']", 
      "select[id*='type']",
      "input[name*='product']",
      "input[id*='product']",
      "input[placeholder*='نوع البضاعة']",
      "select[placeholder*='نوع البضاعة']",
      "select[data-field='package_type']",
      "textarea[placeholder*='نوع البضاعة']",
      "select[name='goods_type']",
      "select[id='goods_type']",
      "input[name='content']",
      "input[id='content']"
    ],
    aliases: ["goodsType", "productType", "parcelType", "itemType", "content", "goods_type"],
    required: false,
    transform: (value) => value || "بضائع متنوعة"
  },
  
  // عدد القطع
  {
    key: "pieceCount",
    selectors: [
      "input[name*='count']", 
      "input[id*='count']",
      "input[name*='quantity']",
      "input[id*='quantity']",
      "input[name*='pieces']",
      "input[id*='pieces']",
      "input[placeholder*='عدد القطع']",
      "input[type='number'][aria-label*='قطع']",
      "input[data-field='piece_count']",
      "input[name='items_count']",
      "input[id='items_count']",
      "input[name='qty']",
      "input[id='qty']"
    ],
    aliases: ["count", "quantity", "pcs", "itemCount", "items_count", "qty"],
    required: false,
    transform: (value) => value || "1"
  },
  
  // الملاحظات
  {
    key: "notes",
    selectors: [
      "textarea[name*='note']", 
      "textarea[id*='note']",
      "textarea[name*='comment']",
      "textarea[id*='comment']",
      "textarea[placeholder*='ملاحظات']",
      "textarea[placeholder*='تعليق']",
      "textarea[data-field='notes']",
      "input[name*='note']",
      "input[id*='note']",
      "input[placeholder*='ملاحظات']",
      "textarea[name='description']",
      "textarea[id='description']"
    ],
    aliases: ["comments", "description", "details", "additionalInformation"],
    required: false
  }
];

/**
 * تعريفات محددة لبعض المواقع المعروفة
 */
export const SITE_SPECIFIC_MAPPINGS: Record<string, FieldMapping[]> = {
  "alryanydelivery.com": [
    { 
      key: "customerName", 
      selectors: ["input#yourname"], 
      aliases: ["sender"], 
      required: true 
    },
    { 
      key: "customerPhone", 
      selectors: ["input#yourmobile"], 
      aliases: ["phone"], 
      required: true 
    },
    { 
      key: "receiverName", 
      selectors: ["input#theirname"], 
      aliases: ["recipient"], 
      required: true 
    },
    { 
      key: "totalAmount", 
      selectors: ["input#amount"], 
      aliases: ["price"], 
      required: true 
    },
    { 
      key: "area", 
      selectors: ["select#city"], 
      aliases: ["province"], 
      required: true 
    }
  ],
  
  "express-box.net": [
    { 
      key: "customerName", 
      selectors: ["input[name='data[Customer][name]']"], 
      aliases: ["sender"], 
      required: true 
    },
    { 
      key: "customerPhone", 
      selectors: ["input[name='data[Customer][phone]']"], 
      aliases: ["phone"], 
      required: true 
    },
    { 
      key: "totalAmount", 
      selectors: ["input[name='data[Shipment][cod_amount]']"], 
      aliases: ["price"], 
      required: true 
    }
  ],
  
  "connect.io": [
    { 
      key: "customerName", 
      selectors: ["input#senderName"], 
      aliases: ["sender"], 
      required: true 
    },
    { 
      key: "customerPhone", 
      selectors: ["input#senderPhone"], 
      aliases: ["phone"], 
      required: true 
    }
  ]
};

/**
 * الحصول على مجموعة المحددات المناسبة للموقع الحالي
 */
export const getFieldMappingsForSite = (hostName: string): FieldMapping[] => {
  // البحث عن تعريفات محددة للموقع
  for (const [sitePattern, mappings] of Object.entries(SITE_SPECIFIC_MAPPINGS)) {
    if (hostName.includes(sitePattern)) {
      console.log(`استخدام تعريفات مخصصة للموقع: ${sitePattern}`);
      return mappings;
    }
  }
  
  // استخدام التعريفات العامة
  console.log("استخدام تعريفات الحقول العامة");
  return COMMON_FIELD_MAPPINGS;
};

// البيانات الخاصة بالمحافظات العراقية
export const IRAQ_PROVINCE_MAP = {
  // قائمة جميع المحافظات العراقية بالعربية
  provinces: [
    'بغداد',
    'البصرة',
    'نينوى',
    'أربيل',
    'النجف',
    'كربلاء',
    'ذي قار',
    'الأنبار',
    'ديالى',
    'كركوك',
    'صلاح الدين',
    'بابل',
    'المثنى',
    'القادسية',
    'واسط',
    'ميسان',
    'دهوك',
    'السليمانية'
  ],
  
  // قائمة بالبدائل المختلفة لكل محافظة
  alternativeNames: {
    'بغداد': ['baghdad', 'بقداد', 'بغدات'],
    'البصرة': ['basra', 'basrah', 'البصره'],
    'نينوى': ['nineveh', 'mosul', 'الموصل', 'موصل', 'نينوه'],
    'أربيل': ['erbil', 'arbil', 'اربيل', 'اربل'],
    'النجف': ['najaf', 'نجف'],
    'كربلاء': ['karbala', 'كربلا'],
    'ذي قار': ['dhi qar', 'thi qar', 'ذيقار', 'ذى قار', 'الناصرية'],
    'الأنبار': ['anbar', 'الانبار', 'انبار', 'الرمادي'],
    'ديالى': ['diyala', 'ديالا', 'بعقوبة'],
    'كركوك': ['kirkuk', 'كرگوک'],
    'صلاح الدين': ['salah al-din', 'saladin', 'صلاحدين', 'صلاح دين', 'تكريت'],
    'بابل': ['babylon', 'babil', 'الحلة', 'hillah'],
    'المثنى': ['muthanna', 'مثنى', 'السماوة'],
    'القادسية': ['qadisiyyah', 'قادسية', 'الديوانية', 'diwaniyah'],
    'واسط': ['wasit', 'kut', 'الكوت'],
    'ميسان': ['maysan', 'missan', 'العمارة'],
    'دهوك': ['dhok', 'dohuk'],
    'السليمانية': ['sulaymaniyah', 'سليمانية', 'سلیمانیة']
  }
};
