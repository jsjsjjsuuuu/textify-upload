import { User } from "@supabase/supabase-js";
// تصحيح إعادة التصدير باستخدام export type
import type { BookmarkletItem, BookmarkletExportData } from "@/utils/bookmarklet/types";

// تعريف أنواع دوال معالجة الصور بشكل دقيق
export type OcrProcessFn = (image: CustomImageData) => Promise<string>;
export type GeminiProcessFn = (image: CustomImageData) => Promise<Partial<CustomImageData>>;

// إضافة الأنواع الجديدة المطلوبة للتوافق بين المكونات المختلفة
export type ImageProcessFn = (file: File, image: CustomImageData) => Promise<CustomImageData>;
export type FileImageProcessFn = (file: File | Blob, image: CustomImageData) => Promise<CustomImageData>;
export type CreateUrlFn = (file: File) => Promise<string>;

// تغيير اسم الواجهة لتجنب التعارض مع ImageData المدمج
export interface CustomImageData {
  id: string;
  file: File;
  previewUrl: string;
  extractedText?: string;
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  date: Date;
  status: "pending" | "processing" | "completed" | "error";
  confidence?: number;
  extractionMethod?: "ocr" | "gemini";
  number?: number;
  submitted?: boolean;
  user_id?: string;
  storage_path?: string;
  batch_id?: string;
  added_at?: number; 
  retryCount?: number; 
  bookmarkletStatus?: "ready" | "pending" | "success" | "error";
  bookmarkletMessage?: string;
  notes1?: string;
  recipientName?: string;
  error?: string;
  sessionImage?: boolean;
  apiKeyError?: boolean;
  userId?: string; // للتوافق مع الكود الموجود، مع أن user_id هو الاسم المفضل
}

// نحدد ImageData كمرادف لـ CustomImageData للحفاظ على التوافق مع الكود الموجود
export type ImageData = CustomImageData;

// إعادة تصدير الواجهات من ملف types.ts لضمان التوافق
export type { BookmarkletItem, BookmarkletExportData };
