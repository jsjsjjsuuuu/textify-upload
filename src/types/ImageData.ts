
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
  status: "processing" | "completed" | "error";
  submitted?: boolean;
  number?: number;
  extractionMethod?: "ocr" | "gemini";
  // حقول لدعم عملية Bookmarklet
  bookmarkletStatus?: "ready" | "pending" | "success" | "error";
  bookmarkletMessage?: string;
  bookmarkletDate?: Date;
  // حقول إضافية لوصف البيانات
  notes?: string;
  category?: string;
  priority?: "low" | "medium" | "high";
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
}

// إحصائيات البيانات المخزنة
export interface StorageStats {
  total: number;
  ready: number;
  success: number;
  error: number;
  lastUpdate: Date | null;
}

