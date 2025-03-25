
// تكوين Google Sheets API

export const GOOGLE_API_CONFIG = {
  API_KEY: "AIzaSyCwxG0KOfzG0HTHj7qbwjyNGtmPLhBAno8", // نفس مفتاح Gemini API للتبسيط
  CLIENT_ID: "687152002001-e26gfdstki29pl4jqq1i9vb3dme6p6f9.apps.googleusercontent.com", // مفتاح عميل عام للاختبار
  DISCOVERY_DOCS: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  SCOPES: "https://www.googleapis.com/auth/spreadsheets",
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
