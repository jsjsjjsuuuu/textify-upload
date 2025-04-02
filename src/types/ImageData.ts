
/**
 * نوع بيانات الصورة
 */
export interface ImageData {
  id: string;
  file: File;
  previewUrl?: string;
  status: "pending" | "processing" | "completed" | "error";
  date: Date; // تغيير من string إلى Date
  extractedText?: string;
  confidence?: number;
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  submitted?: boolean;
  user_id?: string;
  number?: number;
  imageHash?: string;
  processingAttempts?: number;
  createdAt?: string;
  updatedAt?: string;
  extractionMethod?: "ocr" | "gemini";
  extractionSuccess?: boolean;
  
  // الخصائص الإضافية المطلوبة
  storage_path?: string;
  batch_id?: string;
  bookmarkletStatus?: "ready" | "pending" | "success" | "error";
  bookmarkletMessage?: string;
  
  // خصائص إضافية اختيارية لدعم الوظائف الجديدة
  notes?: string;
  recipientName?: string;
  delegateName?: string;
  packageType?: string;
  pieceCount?: string;
}

/**
 * واجهة لعنصر البوكماركلت 
 */
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
  delegateName?: string;
  packageType?: string;
  pieceCount?: string;
  // بيانات إضافية يمكن استخدامها في ملء النماذج
  [key: string]: any;
}

/**
 * بيانات التصدير للبوكماركلت
 */
export interface BookmarkletExportData {
  version: string;
  exportDate: string;
  items: BookmarkletItem[];
}

/**
 * إحصائيات التخزين
 */
export interface StorageStats {
  total: number;
  ready: number;
  success: number;
  error: number;
  lastUpdate: Date | null;
}
