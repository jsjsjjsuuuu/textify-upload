// src/lib/apiService.ts

export interface ApiResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: number; // إضافة كود الخطأ
  quotaExceeded?: boolean; // إضافة علامة تجاوز الحصة
}

// نوع بيانات العناصر
export interface ApiItem {
  id: string;
  name: string;
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  companyName: string;
  date: string;
  extractedText: string;
  confidence: number;
  submitted: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  extractionMethod: 'ocr' | 'gemini' | 'failed_gemini';
  userId: string;
  previewUrl: string;
  bookmarkletStatus?: 'ready' | 'pending' | 'success' | 'error';
  bookmarkletMessage?: string;
}

// طلب إضافة عنصر جديد
export interface AddItemRequest {
  name: string;
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  companyName: string;
  date: string;
  extractedText: string;
  confidence: number;
  submitted: boolean;
  status: string;
  extractionMethod: string;
  userId: string;
  previewUrl: string;
}

// مزيد من الأنواع المرتبطة بالـ API يمكن إضافتها هنا
