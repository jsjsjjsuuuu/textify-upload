
/**
 * نوع بيانات الصورة
 */
export interface ImageData {
  id: string;
  file: File;
  previewUrl?: string;
  status: "pending" | "processing" | "completed" | "error";
  date: string;
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
  extractionSuccess?: boolean; // إضافة حقل جديد لإشارة نجاح الاستخراج
}
