
// تكوين Google Sheets API

export const GOOGLE_API_CONFIG = {
  API_KEY: "AIzaSyCFDqYxuOd8Usj0HOID-TfcFbWU8vwB2qI", // مفتاح API الجديد
  CLIENT_ID: "599832546977-oc48ji7men0gnf5cpbrpmjuqapbjqdf9.apps.googleusercontent.com", // معرف عميل OAuth الجديد
  DISCOVERY_DOCS: ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  SCOPES: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
  USE_OAUTH: false, // تعطيل استخدام OAuth
  USE_SERVICE_ACCOUNT: true // تفعيل استخدام حساب الخدمة
};

export const SHEET_COLUMNS = [
  "الكود", "اسم المرسل", "رقم الهاتف", "المحافظة", "السعر", "اسم الشركة", "التاريخ"
];

// بيانات حساب الخدمة
export const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "vaulted-copilot-454811-b8",
  "private_key_id": "bbc21f3d06c9113f66a548466888b6de916d652c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCMxrv1NBW/13P6\nQnyqqNdhTTl2ukP5m4HG093jpnTnyLl8DZuyqiJtCiBNILy9G2tksvinY20enwAz\n1ldV1Z628hlEo6maW/5kAD6pTlv3sshgw1xX2fJjbaKZGfw70/120cb0KBgxwQjb\nrpFhCceobKpcA1fFXjKDeLnkezAxyZ86JQWd73P6JukKyK3Lp9BXX02JsMSwqLxt\nREjQFI9QstgsDKKj5JTODS05c1Z1IooHT9qzTMkc94oYGlP5zIrZSfpkmYsyZQzQ\ncYan587763jGknVXKCWZALzSMObjPT83Xsg/pDxZo0fD0+X/R9FTUR66jfI5AZtY\nrnBk50uNAgMBAAECggEAHVPFkmagZU/oPGmfeRoljIK/Bun1AUoRNi+rGSLzVdou\nMhbPqd/hvh+O7SJ1z1un+tmCDbUb5XYwX5w2o44WO3yiIPeLfLnPfFvEsha9+BNJ\nxUbNtQuVgHs1lXmhX4FhW2CGdxTnPW4+fy2V4cZczsycjQCxR0/BbDw5Vc0IFEbi\nhmr9N66RtqTfHIHJZmjG/j982fF1gBTf9yMru1WxTY9G51ofxU/oUk7Z2YN9CpW9\nh9hObGeJKdL7Jo4kLDux1FBws/1dAmajAhLRTiVeePM9g6JlJVMoBEIaln0K9Es7\nLSLtqQTSt2OwT6PJoyq1bRUzxDiQFv6gV4IX5bKFDQKBgQDA7TJsVLrBD8pTEu57\nY3tB6l5relA+j5spNSWMqZqcKEioZ13gmRjMriZ/bZbYkasCqNRMyyTVmNve0gcQ\ncYLO7U0Ub5i9qXaFCnDlE/rn/JFGuhLm8Jcd7/psOnHuvKvF5PA45A+zHawd8LQ/\nKJ/UZMTpY2Gelg4iAfgRI5WTDwKBgQC6zN9Ug/R9apqUVGzdXrOlVqAI+loaXC9Y\nAUqJ2iKiwE0m9miJA4uuSE4afGP43xVZZpX8yKMmXExTsvQkpLKMRtj42XUcqo7W\nz+MhLOXSYn3LPg6zjPFrbHVboCv+tP5GJSXGR2B9YUVzwGipKhbZLbmWWPLByPas\niy/PqwbHowKBgG0YtN7VuxXZnAwGNJ3Jz7WiluooLKB0DMXsq+MzNZ8AmLXCXi/X\n41I7WMHOcvLczNugJQ2YAqhW3F7QXfZKejIRtvjLcpAt+Dubf+PKvKPbCzv3lSDL\nBGmFfxMcqbjbMDekEsPZE5eyO9Zie0sL6fXtVfy0mktXh35rpp/qg3a5AoGBAJVx\nuC42T1BTDA4lKN9Fl3VsQyZLm/BA1gOTLN3ybQlFzbOhKOqMsqAg6pNX9ucxGjRm\n1RHiNlxHNS01GwuB0/JT79vOpVnkvdfvgyeUct0IvNjv8fUFilNF9vHxx6DDjjXy\nHDFwAyrruhOr2E+WA6eGZFZ7HOOZ8ncB96MtkYP/AoGAJNH8DGHdnIkl1vyGKqry\ne5/N63UTe5neCLG41KMhqu/XFgpmorLikGvyZWv7GCgJVyRoajMezJyCRFJnmbTk\nbRZlZsHXilybstJQ9sHZhmajCcnf2z1dcDYwmUJ7rnyfRlC5Nsh5f2azRNBMmjbb\nwaJOWM3KdUCoH4Z4PISubC8=\n-----END PRIVATE KEY-----\n",
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

// رسائل الخطأ
export const ERROR_MESSAGES = {
  AUTH_ERROR: "فشل في المصادقة مع Google Sheets. يرجى التحقق من بيانات الاعتماد.",
  API_KEY_ERROR: "مفتاح API غير صالح أو غير مدعوم.",
  NETWORK_ERROR: "خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.",
  GENERAL_ERROR: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.",
  SERVICE_ACCOUNT_ERROR: "حدث خطأ في استخدام حساب الخدمة. تأكد من صحة بيانات حساب الخدمة.",
  BROWSER_SUPPORT_ERROR: "تم تفعيل حساب الخدمة، ولكن قد تكون هناك قيود في بيئة المتصفح."
};
