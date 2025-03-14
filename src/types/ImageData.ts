
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
  // حقول إضافية مخصصة للموقع المستهدف
  address?: string;
  productType?: string;
  orderNumber?: string;
  delegateName?: string; // اسم المندوب
  region?: string;      // المنطقة
  packageCount?: string; // عدد القطع
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
}

// إحصائيات البيانات المخزنة
export interface StorageStats {
  total: number;
  ready: number;
  success: number;
  error: number;
  lastUpdate: Date | null;
}

