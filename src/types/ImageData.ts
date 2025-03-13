
export interface ImageData {
  id: string;
  companyId?: string; // إضافة معرف الشركة
  file: File;
  previewUrl: string;
  extractedText: string;
  confidence?: number;
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  secondaryPhoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  date: Date;
  status: "processing" | "completed" | "error";
  submitted?: boolean;
  number?: number;
  extractionMethod?: "ocr" | "gemini";
}
