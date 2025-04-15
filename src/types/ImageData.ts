
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
  extractionMethod?: string;
  batch_id?: string;
  storage_path?: string;
  added_at?: string;
  sessionImage?: boolean;
  
  // حقول البوكماركلت المحذوفة (نضيفها لإزالة الأخطاء)
  bookmarkletStatus?: string;
  bookmarkletMessage?: string;
  
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
  customData?: Record<string, any>;
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
}

// إضافة الأنواع المفقودة التي ظهرت في الأخطاء
export type ImageProcessFn = (
  file: File,
  options?: ImageProcessOptions,
  setProgress?: (progress: number) => void
) => Promise<Partial<ImageData>>;

export type OcrProcessFn = (
  file: File,
  image?: CustomImageData
) => Promise<CustomImageData>;

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
