
import { User } from "@supabase/supabase-js";

export interface ImageDataBase {
  id: string;
  fileName?: string;
  rawText?: string;
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
  | "rejected";

export interface ImageProcessOptions {
  skipOcr?: boolean;
  skipGemini?: boolean;
  forceReprocess?: boolean;
}

export type ImageProcessFn = (
  file: File,
  options?: ImageProcessOptions,
  setProgress?: (progress: number) => void
) => Promise<Partial<ImageData>>;

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
