
import { GOOGLE_API_CONFIG, SHEET_COLUMNS, ERROR_MESSAGES, SERVICE_ACCOUNT } from './config';
import { ImageData } from '@/types/ImageData';
import { formatDate } from '@/utils/dateFormatter';

// حالة تهيئة API
let initialized = false;
let lastError = null;

// الحصول على آخر خطأ
export const getLastError = () => {
  return lastError;
};

// إعادة تعيين حالة الخطأ
export const resetLastError = () => {
  lastError = null;
};

// تم تعطيل جميع وظائف API Google Sheets

// تهيئة خدمة Google Sheets API 
export const initGoogleSheetsApi = (): Promise<boolean> => {
  return Promise.resolve(false);
};

// إذا كان API مهيأ
export const isApiInitialized = (): boolean => {
  return false;
};

// تسجيل الدخول يدوياً
export const signIn = async (): Promise<boolean> => {
  return Promise.resolve(false);
};

// تسجيل الخروج
export const signOut = async (): Promise<boolean> => {
  return Promise.resolve(false);
};

// التحقق مما إذا كان المستخدم مسجل الدخول
export const isUserSignedIn = (): boolean => {
  return false;
};

// إنشاء جدول بيانات جديد
export const createNewSpreadsheet = async (): Promise<string | null> => {
  return Promise.resolve(null);
};

// تصدير بيانات الصور إلى جدول البيانات
export const exportImagesToSheet = async (): Promise<boolean> => {
  return Promise.resolve(false);
};

// الحصول على قائمة جداول البيانات المتاحة
export const getSpreadsheetsList = async (): Promise<Array<{id: string, name: string}>> => {
  return Promise.resolve([]);
};

// تصدير البيانات إلى جدول البيانات الافتراضي
export const exportToDefaultSheet = async (): Promise<boolean> => {
  return Promise.resolve(false);
};
