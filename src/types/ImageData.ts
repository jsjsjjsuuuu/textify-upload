
import { User } from "@supabase/supabase-js";
import type { BookmarkletItem, BookmarkletExportData } from "@/utils/bookmarklet/types";

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
  added_at?: number; // إضافة حقل للطابع الزمني
  retryCount?: number; // إضافة حقل لعدد مرات إعادة المحاولة
  bookmarkletStatus?: "ready" | "pending" | "success" | "error"; // حالة استخدام البوكماركلت
  bookmarkletMessage?: string; // رسالة خاصة بالبوكماركلت
  notes1?: string; // إضافة حقل ملاحظات 1
  recipientName?: string; // إضافة حقل اسم المستلم
}

// إعادة تصدير الواجهات من ملف types.ts لضمان التوافق - مع إصلاح الخطأ
export type { BookmarkletItem, BookmarkletExportData };
