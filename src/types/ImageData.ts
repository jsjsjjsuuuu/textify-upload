
export interface ImageData {
  id: string;
  file: File;
  previewUrl: string;
  extractedText: string;
  confidence?: number;
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  date: Date;
  status: "processing" | "pending" | "completed" | "error";
  submitted?: boolean;
  number?: number;
  extractionMethod?: "ocr" | "gemini";
  // حقول جديدة لدعم التكامل مع المستخدمين
  user_id?: string;
  // حقل جديد لتتبع مجموعة الصور المرفوعة معًا
  batch_id?: string;
  // حقول لدعم عملية Bookmarklet
  bookmarkletStatus?: "ready" | "pending" | "success" | "error";
  bookmarkletMessage?: string;
  bookmarkletDate?: Date;
  // حقول إضافية لوصف البيانات
  notes?: string;
  category?: string;
  priority?: "low" | "medium" | "high";
  // حقول إضافية مخصصة للموقع المستهدف
  address?: string;
  productType?: string;
  orderNumber?: string;
  delegateName?: string; // اسم المندوب
  region?: string;      // المنطقة
  packageCount?: string; // عدد القطع
  customerCode?: string; // كود العميل
  recipientName?: string; // اسم المستلم
  reference?: string;   // المرجع
  destination?: string; // الوجهة
  shippingType?: string; // نوع الشحن
  paymentType?: string; // نوع الدفع
  shipmentStatus?: string; // حالة الشحنة
  deliveryTime?: string; // وقت التسليم
  deliveryDate?: string; // تاريخ التسليم
  // حقول جديدة مطابقة للموقع المستهدف
  customerName?: string; // اسم العميل/الزبون
  customerPhone?: string; // هاتف الزبون
  totalAmount?: string; // المبلغ الكلي
  receiverName?: string; // اسم المستلم
  area?: string; // المنطقة
  packageType?: string; // نوع البضاعة
  pieceCount?: string; // عدد القطع
  customerFee?: string; // زيادة أجرة العميل
  deliveryAgentFee?: string; // زيادة أجرة المندوب
  notes1?: string; // ملاحظات
  notes2?: string; // ملاحظات خاصة
  status1?: string; // الحالة
  exchangeStatus?: string; // استبدال
  orderStatus?: string; // حالة الطلب
  paymentStatus?: string; // حالة الدفع
}

// واجهة لتصدير البيانات إلى Bookmarklet
export interface BookmarkletExportData {
  version: string;
  exportDate: string;
  items: BookmarkletItem[];
}

// بيانات وصل للاستخدام في Bookmarklet
export interface BookmarkletItem {
  id: string;
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  companyName: string;
  exportDate: string;
  status: "ready" | "pending" | "success" | "error";
  message?: string;
  // حقول إضافية اختيارية للاستخدامات المستقبلية
  notes?: string;
  category?: string;
  priority?: string;
  // حقول إضافية مخصصة للموقع المستهدف
  address?: string;
  productType?: string;
  orderNumber?: string;
  delegateName?: string;
  region?: string;
  packageCount?: string;
  customerCode?: string;
  recipientName?: string;
  reference?: string;
  destination?: string;
  shippingType?: string;
  paymentType?: string;
  shipmentStatus?: string;
  deliveryTime?: string;
  deliveryDate?: string;
  // حقول جديدة مطابقة للموقع المستهدف
  customerName?: string; // اسم العميل/الزبون
  customerPhone?: string; // هاتف الزبون
  totalAmount?: string; // المبلغ الكلي
  receiverName?: string; // اسم المستلم
  area?: string; // المنطقة
  packageType?: string; // نوع البضاعة
  pieceCount?: string; // عدد القطع
  customerFee?: string; // زيادة أجرة العميل
  deliveryAgentFee?: string; // زيادة أجرة المندوب
  notes1?: string; // ملاحظات
  notes2?: string; // ملاحظات خاصة
  status1?: string; // الحالة
  exchangeStatus?: string; // استبدال
  paymentStatus?: string; // حالة الدفع
  orderStatus?: string; // حالة الطلب
}

// إحصائيات البيانات المخزنة
export interface StorageStats {
  total: number;
  ready: number;
  success: number;
  error: number;
  lastUpdate: Date | null;
}
