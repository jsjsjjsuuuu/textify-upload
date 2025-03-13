
export interface ImageData {
  id: string;
  file: File;
  previewUrl: string;
  extractedText: string;
  confidence?: number;
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  date: Date;
  status: "processing" | "completed" | "error";
  submitted?: boolean;
  submissionTime?: string; // إضافة حقل وقت الإرسال
  number?: number;
  extractionMethod?: "ocr" | "gemini";
}
