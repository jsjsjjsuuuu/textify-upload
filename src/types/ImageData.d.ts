
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
  apiKeyError?: boolean; // إضافة حقل للأخطاء المتعلقة بمفتاح API
  storage_path: string | null;
  userId: string | null;
  number: number;
  sessionImage: boolean;
  submitted: boolean;
}
