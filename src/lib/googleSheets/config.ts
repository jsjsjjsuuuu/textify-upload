
// تكوين Google Sheets API

export const GOOGLE_API_CONFIG = {
  API_KEY: "AIzaSyCFDqYxuOd8Usj0HOID-TfcFbWU8vwB2qI", // مفتاح API الجديد
  CLIENT_ID: "599832546977-oc48ji7men0gnf5cpbrpmjuqapbjqdf9.apps.googleusercontent.com", // معرف عميل OAuth الجديد
  DISCOVERY_DOCS: ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  SCOPES: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file"
};

export const SHEET_COLUMNS = [
  "الكود", "اسم المرسل", "رقم الهاتف", "المحافظة", "السعر", "اسم الشركة", "التاريخ"
];

// إعدادات التصدير التلقائي
export const AUTO_EXPORT_CONFIG = {
  ENABLED: true,
  DEFAULT_SHEET_NAME: `بيانات الشحنات ${new Date().toLocaleDateString('ar-EG')}`,
  AUTO_CREATE_IF_MISSING: true
};
