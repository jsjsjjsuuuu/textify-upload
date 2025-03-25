
// تكوين Google Sheets API - معطل

export const GOOGLE_API_CONFIG = {
  API_KEY: "", // تم إزالة المفتاح
  CLIENT_ID: "", // تم إزالة معرف العميل
  DISCOVERY_DOCS: [],
  SCOPES: "",
  USE_OAUTH: false,
  USE_SERVICE_ACCOUNT: false
};

export const SHEET_COLUMNS = [
  "الكود", "اسم المرسل", "رقم الهاتف", "المحافظة", "السعر", "اسم الشركة", "التاريخ"
];

// تم إزالة بيانات حساب الخدمة
export const SERVICE_ACCOUNT = {};

// إعدادات التصدير التلقائي - معطلة
export const AUTO_EXPORT_CONFIG = {
  ENABLED: false,
  DEFAULT_SHEET_NAME: "",
  AUTO_CREATE_IF_MISSING: false
};

// رسائل الخطأ
export const ERROR_MESSAGES = {
  AUTH_ERROR: "تم تعطيل وظائف Google Sheets.",
  API_KEY_ERROR: "تم تعطيل وظائف Google Sheets.",
  NETWORK_ERROR: "تم تعطيل وظائف Google Sheets.",
  GENERAL_ERROR: "تم تعطيل وظائف Google Sheets.",
  SERVICE_ACCOUNT_ERROR: "تم تعطيل وظائف Google Sheets.",
  BROWSER_SUPPORT_ERROR: "تم تعطيل وظائف Google Sheets."
};
