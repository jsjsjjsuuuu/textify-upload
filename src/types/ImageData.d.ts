
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
  error: string | null;
  apiKeyError?: boolean;
  storage_path: string | null;
  userId: string | null;
  user_id?: string | null; // حقل إضافي للتوافق مع قاعدة البيانات
  number: number;
  sessionImage: boolean;
  submitted: boolean;
  retryCount?: number;
  imageHash?: string; // إضافة حقل هاش للصورة لاكتشاف التكرار
  processingAttempts?: number; // عدد محاولات المعالجة
  processed?: boolean; // علامة لتحديد ما إذا تمت معالجة الصورة بالفعل
  batch_id?: string; // معرف المجموعة للصور المرفوعة معًا
}
