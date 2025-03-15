
// أنواع البيانات المشتركة للبوكماركلت

// المتغيرات الثابتة
export const STORAGE_KEY = "bookmarklet_data_v1";
export const STORAGE_VERSION = "1.0";

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
  lastUpdate: Date | null;
}

// خيارات الإرسال الخارجي
export interface ExternalSubmitOptions {
  enabled: boolean;
  url: string;
  method: 'GET' | 'POST' | 'PUT';  // تأكيد إضافة 'GET' كقيمة محتملة
  headers?: Record<string, string>;
  mapFields?: Record<string, string>;
}

// استجابة الإرسال الخارجي
export interface ExternalSubmitResponse {
  success: boolean;
  message: string;
  code: number;
  responseData?: any;
  timestamp: string;
}
