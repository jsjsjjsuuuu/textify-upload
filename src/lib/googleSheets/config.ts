
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

// بيانات حساب الخدمة (تم تحديثها بناءً على الصورة)
export const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "vaulted-copilot-454811-b8",
  "private_key_id": "6f7e1510078c3dd872b7c168398c3e98336af78b",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDexrNLZJv+Ox7p\nGfBo/R11LVL6cuOfzgqseRoBCM3Qu7KyN+3BIrWvozCQoo/gD8r5J54sACSrrukA\nyu38M7sAAwOlq5vOc/0SKE7xu5qDl4s3KjbJUg5XHODQ4QS6LjKvbglen1zZqalG\nxoHUibNj7SNyGUNPsmqlh1CyzE8HwA0gSMIVGr458ebdjLebyRM18SHCFKtnJyP1\nIB5TTsCMMTKP1wuS7cKlzrNDqcn53DSP7qehMujfFW6s1V8DS31bauk7bLuvgwBa\nj8Nc2QJTlXFskRNSJ87WZmQessds+VPUF3nlGx43FmnJ78vhgXlvG+0SCjxoaICA\nLKxcsuxpAgMBAAECggEAAiZnx5P+f2shpr1F2TWMKbvYv6sJMFskNjrq+dSUa+3L\n0TWB+Wm02C+ageLXwaFVY6cyuxj7QZ7sB8Jtno//P4ZH7DrmQ41SBXFXJbUaTifR\nw6QIKFQ+6C9SqiFp0sQsYA4PUBb4pe8hv5md2ifED/RTcb/1qti9d8CBEmCvaJM4\n0MBpnPyy/jSO+eYrtDsPHTfZOkmb4qRDjWZ2ep8owsr/MKbAaxqGbiUH3Z6eaUp8\nU8HEZfUIoZBEc5JugtdkwaR+Y0oLR6OQkPfqGpg36o1El3jvIYGUz2kQ4sRv/VrF\n+iIivA+fy5+P+6uIHhBLC/BBpuotQ7ZtYbyzods7qQKBgQD1EebzEp88ZdoQfBh7\nOCzrH2x5g1nKs6co7vV2jPT0fnQN+ZFE9tFk4RGhIFVjxZSnOvfiNzvyn/+dSK4Q\n78/bIbcqHbV6iVinis1wGyJmuzsczh8Ywi8YoIUVtwWhuSUVZgdHLNGrGc8zB+U8\nMsz2VHSBcKBVJ8UIOUNMb9eUVQKBgQDotkIXTATs6/O96S+XF2lslGiMqtzOYuVK\nSYzavPxZVA9QCXIRJCCaNXmtS89tun5Y0cn79qP0Lu/EGYaWnfGTo9iQ3GCcjAVu\np360MGGbfFneImGLfA2hXpteQeeHVGfXQhpewdsDTht1ZiiZJ8JuXlNmTLB1XLDJ\nxCVUXdWrxQKBgCAIJP2kc3e7gFMjRTfl0ckxpEYFqxjZfoHVKfRC3EmQta6V7izr\nbdcXq+w5g6+0xYdOJ9RDj+xYiVqPg2DnV2227G/uziekCBhuBggfI9H1qvZK4rmj\nt/AqGvsJnwzSXEx9t3nQG9+XUgPDhmzl3vBbfZbll69JsXEvuuIkxDK5AoGBAL+0\nBNX0Rcp2xaAYzJ+HJc3QpB/dUXCjf4em92XqcWeVG9gvL8x3GnRuwQHFhec6zoKU\nr/PkxkONtu6wqHLDQhMB0pHjOaM8pez2BiaiBIZ19gJMCFdDpmbc7NjFKdoN6k0l\no1uUDru2SGB5+8/PNRh+k+2eF29XIDvWXXoWosKRAoGBALYIVUJrzt3W+F71NBrm\nG5IayvoOcD678xkllV70dVWEdhNWS53nY5K7K6r3fkdJWj/VtGgNsLEo/doExBgI\nXH1sIV12FdF+XhOFckxqbo8zeLME5dt2s5td+CXLNc8zZq1gLf/S/JyCAl4JRBZe\nHKjYrZ9z+PQ7VXHdzX3qV7BH\n-----END PRIVATE KEY-----\n",
  "client_email": "asse-884@vaulted-copilot-454811-b8.iam.gserviceaccount.com",
  "client_id": "106043496548620628813",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/asse-884%40vaulted-copilot-454811-b8.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// إعدادات التصدير التلقائي
export const AUTO_EXPORT_CONFIG = {
  ENABLED: true,
  DEFAULT_SHEET_NAME: `بيانات الشحنات ${new Date().toLocaleDateString('ar-EG')}`,
  AUTO_CREATE_IF_MISSING: true
};
