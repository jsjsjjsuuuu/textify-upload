
// المفاتيح المستخدمة للتخزين في localStorage
export const STORAGE_KEY = "bookmarklet_data";
export const STORAGE_VERSION = "1.0";

// واجهات نقل البيانات
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
}

export interface BookmarkletExportData {
  version: string;
  exportDate: string;
  items: BookmarkletItem[];
}

export interface StorageStats {
  total: number;
  ready: number;
  success: number;
  error: number;
  lastUpdate: Date | null;
}
