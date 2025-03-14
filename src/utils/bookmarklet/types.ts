
// أنواع البيانات المشتركة للبوكماركلت

// نتائج ملء النموذج
export interface FormFillerResults {
  filled: string[];
  failed: string[];
  message: string;
  success: boolean;
  attempted: number;
}

// تعريف حقل إدخال
export interface FieldMapping {
  key: string;
  selectors: string[];
  aliases?: string[];
  required?: boolean;
  transform?: (value: string) => string;
}

// عنصر البوكماركلت (العناصر المخزنة في localStorage)
export interface BookmarkletItem {
  id: string;
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  companyName: string;
  exportDate: string;
  status: 'ready' | 'success' | 'error';
  address?: string;
  notes?: string;
  recipientName?: string;
  // بيانات إضافية يمكن استخدامها في ملء النماذج
  [key: string]: any;
}

// بيانات التصدير للبوكماركلت
export interface BookmarkletExportData {
  version: string;
  exportDate: string;
  items: BookmarkletItem[];
}

// إحصائيات التخزين
export interface StorageStats {
  total: number;
  ready: number;
  success: number;
  error: number;
  lastUpdate?: Date;
}
