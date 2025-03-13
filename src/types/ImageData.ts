
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
  // حقول جديدة للموقع الذي يتطلب تسجيل دخول
  orderNumber?: string; // رقم الطلب
  clientCode?: string; // كود العميل
  clientName?: string; // اسم العميل
  delegateName?: string; // اسم المندوب
  totalAmount?: string; // المبلغ الكلي
  zoneName?: string; // اسم المنطقة
  region?: string; // المحافظة
  paymentType?: string; // نوع البضاعة
  piecesCount?: string; // عدد القطع
  clientFees?: string; // زيادة أجرة العميل
  delegateFees?: string; // زيادة أجرة المندوب
  notes?: string; // ملاحظات
  specialNotes?: string; // ملاحظات خاصة
  status2?: string; // الحالة
}
