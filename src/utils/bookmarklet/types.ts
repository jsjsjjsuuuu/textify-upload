
export const STORAGE_KEY = "bookmarklet_data";
export const STORAGE_VERSION = "1.0";

// نوع بيانات عنصر البوكماركلت
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
  lastUpdated?: string;
  
  // حقول إضافية اختيارية
  address?: string;
  notes?: string;
  customerCode?: string;
  recipientName?: string;
  category?: string;
  region?: string;
  
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
}

// نوع بيانات التصدير
export interface BookmarkletExportData {
  version: string;
  exportDate: string;
  lastUpdated?: string;
  items: BookmarkletItem[];
}

// نوع بيانات إحصائيات التخزين
export interface StorageStats {
  total: number;
  ready: number;
  success: number;
  error: number;
  lastUpdate: Date | null;
}
