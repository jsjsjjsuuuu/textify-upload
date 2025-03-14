
// أنواع البيانات المستخدمة في واجهة FastAPI

export interface FastAPIConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retries: number;
}

export interface ShipmentData {
  id?: string;
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  productType?: string;
  notes?: string;
  recipientName?: string;
  status?: ShipmentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type ShipmentStatus = 
  | "pending"   // قيد الانتظار
  | "processing" // قيد المعالجة
  | "shipped"   // تم الشحن
  | "delivered" // تم التسليم
  | "returned"  // تم الإرجاع
  | "cancelled" // تم الإلغاء;

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ShipmentBatch {
  batchId: string;
  items: ShipmentData[];
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
}

export interface CourierInfo {
  id: string;
  name: string;
  logo?: string;
  apiEnabled: boolean;
  requiredFields: string[];
  optionalFields: string[];
  supportedRegions: string[];
}
