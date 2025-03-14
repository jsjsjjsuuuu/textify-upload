
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
  lastUpdated?: string;
  // حقول إضافية اختيارية للاستخدامات المستقبلية
  notes?: string;
  category?: string;
  priority?: string;
  address?: string;
  recipientName?: string;
  // حقول إضافية مخصصة للموقع المستهدف
  productType?: string;
  orderNumber?: string;
  delegateName?: string;
  region?: string;
  packageCount?: string;
  customerCode?: string;
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
  lastUpdated?: string;
  items: BookmarkletItem[];
}

export interface StorageStats {
  total: number;
  ready: number;
  success: number;
  error: number;
  lastUpdate: Date | null;
}

// واجهة لتتبع العمليات في Bookmarklet
export interface BookmarkletUsageStats {
  totalExports: number;
  successfulFills: number;
  failedFills: number;
  lastUsed: Date | null;
}
