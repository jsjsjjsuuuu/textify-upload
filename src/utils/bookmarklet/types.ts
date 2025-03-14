
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
