
import { User } from "@supabase/supabase-js";

export interface ImageDataBase {
  id: string;
  fileName?: string;
  rawText?: string;
  extractedText?: string;
  extractedData?: Record<string, any>;
  createdAt?: string;
  fileType?: string;
  fileSize?: number;
  errorMessage?: string;
  status?: ImageStatus;
  processingProgress?: number;
  objectUrl?: string;
  textDataUpdated?: boolean;
  submitted?: boolean;
  userId?: string;
  userEmail?: string;
  uploadTimestamp?: number;
  processingTime?: number;
  sourceType?: string;
  possiblyDuplicate?: boolean;
  similarityScore?: number;
  similarTo?: string;
  
  // الحقول التي تم اكتشاف حاجتنا إليها من خلال الأخطاء
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  confidence?: number;
  date?: Date;
  previewUrl?: string;
  number?: number;
  extractionMethod?: "ocr" | "gemini";
  batch_id?: string;
  storage_path?: string;
  added_at?: string;
  sessionImage?: boolean;
  
  // السماح بإضافة حقول إضافية لمعالجة الأخطاء
  error?: string;
  apiKeyError?: boolean;
  file?: File;
}

export interface ImageData extends ImageDataBase {
  file?: File;
  dataUrl?: string;
}

export interface CustomImageData extends ImageDataBase {
  id: string; // تأكيد أن معرف الصورة إلزامي
  customData?: Record<string, any>;
  file?: File;
}

export type ImageStatus = 
  | "pending" 
  | "processing" 
  | "processed" 
  | "error" 
  | "extracted" 
  | "reviewing" 
  | "approved" 
  | "rejected"
  | "completed";

export interface ImageProcessOptions {
  skipOcr?: boolean;
  skipGemini?: boolean;
  forceReprocess?: boolean;
  id?: string; // إضافة معرف للتوافق مع CustomImageData
}

// تحديث تعريفات الوظائف لتتوافق مع الاستخدام في التطبيق
export type ImageProcessFn = (
  file: File,
  options?: ImageProcessOptions | CustomImageData,
  setProgress?: (progress: number) => void
) => Promise<Partial<ImageData>>;

export type OcrProcessFn = (
  file?: File,
  image?: CustomImageData
) => Promise<string | CustomImageData>;

export type GeminiProcessFn = (
  image: CustomImageData
) => Promise<Partial<CustomImageData>>;

export type FileImageProcessFn = (
  file: File | Blob,
  image: CustomImageData
) => Promise<CustomImageData>;

export interface ImageProcessingResult {
  rawText?: string;
  extractedData?: Record<string, any>;
  errorMessage?: string;
}

export interface ExtractedFieldData {
  field: string;
  value: string;
  confidence?: number;
  isManuallyEdited?: boolean;
}
