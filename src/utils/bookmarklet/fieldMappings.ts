
import { FieldMapping } from "./types";

/**
 * تعريفات حقول الإدخال المشتركة في مواقع الشحن العراقية
 * هذه التعريفات تساعد في العثور على الحقول وملئها بشكل صحيح
 */
export const COMMON_FIELD_MAPPINGS: FieldMapping[] = [
  // حقول العميل/المرسل
  {
    key: "customerName",
    selectors: [
      "input[name*='customer'][name*='name']", 
      "input[id*='customer'][id*='name']",
      "input[name*='sender']", 
      "input[id*='sender']",
      "input[placeholder*='اسم العميل']",
      "input[placeholder*='اسم المرسل']",
      "input[aria-label*='اسم العميل']",
      "select[name*='customer']",
      "input[name='name']",
      "input[name='customer']",
      "input[data-field='customer_name']"
    ],
    aliases: ["sender", "client", "name", "clientName", "senderName"],
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
      "input[data-field='phone']"
    ],
    aliases: ["phone", "mobile", "telephone", "senderPhone", "clientPhone"],
    required: true,
    transform: (value) => value.replace(/[^\d+]/g, '')
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
      "input[data-field='receiver_name']"
    ],
    aliases: ["receiver", "recipient", "receivingParty"],
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
      "select[data-field='area']"
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
      "input[data-field='amount']"
    ],
    aliases: ["price", "amount", "cost", "fee", "orderAmount"],
    required: true,
    transform: (value) => value.replace(/[^\d.]/g, '')
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
      "textarea[placeholder*='نوع البضاعة']"
    ],
    aliases: ["goodsType", "productType", "parcelType", "itemType"],
    required: false
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
      "input[data-field='piece_count']"
    ],
    aliases: ["count", "quantity", "pcs", "itemCount"],
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
      "textarea[data-field='notes']"
    ],
    aliases: ["comments", "description", "details", "additionalInformation"],
    required: false
  },
  
  // الكود
  {
    key: "code",
    selectors: [
      "input[name*='code']", 
      "input[id*='code']",
      "input[name*='reference']",
      "input[id*='reference']",
      "input[placeholder*='الكود']",
      "input[placeholder*='الرقم المرجعي']",
      "input[data-field='code']"
    ],
    aliases: ["reference", "orderCode", "orderNumber", "shipmentCode"],
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
