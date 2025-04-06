
import { User } from "@supabase/supabase-js";
import { BookmarkletItem, BookmarkletExportData } from "@/utils/bookmarklet/types";

export interface ImageData {
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
  // إضافة الحقول المفقودة
  error?: string;
  sessionImage?: boolean;
  apiKeyError?: boolean;
  userId?: string; // للتوافق مع الكود الموجود، مع أن user_id هو الاسم المفضل
}

// إعادة تصدير الواجهات من ملف types.ts لضمان التوافق
export { BookmarkletItem, BookmarkletExportData };
