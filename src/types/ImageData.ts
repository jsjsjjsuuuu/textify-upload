
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
  // إضافة حقول جديدة لدعم عملية Bookmarklet
  bookmarkletStatus?: "ready" | "pending" | "success" | "error";
  bookmarkletMessage?: string;
  bookmarkletDate?: Date;
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
}
