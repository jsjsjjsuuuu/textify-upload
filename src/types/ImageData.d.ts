
export interface ImageData {
  id: string;
  file: File | null;
  previewUrl: string | null;
  date: Date;
  extractedText: string;
  confidence: number;
  companyName: string;
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  status: "pending" | "processing" | "completed" | "error";
  error: string | null; // إضافة حقل الخطأ
  apiKeyError?: boolean;
  storage_path: string | null;
  user_id?: string | null; // تغيير الاسم ليتوافق مع الاسم المتوقع
  number: number;
  sessionImage?: boolean; // إضافة هذا الحقل الذي كان مفقودًا
  submitted: boolean;
  retryCount?: number;
  imageHash?: string;
  processingAttempts?: number;
  processed?: boolean;
  batch_id?: string;
}
