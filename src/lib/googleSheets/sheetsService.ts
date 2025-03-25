import { gapi } from 'gapi-script';
import { GOOGLE_API_CONFIG, SHEET_COLUMNS, SERVICE_ACCOUNT, ERROR_MESSAGES } from './config';
import { ImageData } from '@/types/ImageData';
import { formatDate } from '@/utils/dateFormatter';

// حالة تهيئة API
let initialized = false;
let isInitializing = false;
let lastError = null;
let apiLoadRetries = 0;
const MAX_RETRIES = 3;

// الحصول على آخر خطأ
export const getLastError = () => {
  return lastError;
};

// إعادة تعيين حالة الخطأ
export const resetLastError = () => {
  lastError = null;
};

// إعادة ضبط حالة الاتصال
export const resetInitialization = () => {
  initialized = false;
  isInitializing = false;
  lastError = null;
  apiLoadRetries = 0;
};

// دالة للتعامل مع أخطاء الاتصال وتصنيفها
const handleApiError = (error: any): Error => {
  console.error("خطأ في واجهة برمجة التطبيقات:", error);
  
  // إعدادات افتراضية للخطأ
  let errorMessage = ERROR_MESSAGES.GENERAL_ERROR;
  
  // فحص نوع الخطأ
  if (typeof error === 'string' && error.includes('API keys are not supported')) {
    errorMessage = ERROR_MESSAGES.API_KEY_ERROR;
  } else if (error?.result?.error?.message) {
    if (error.result.error.message.includes('authentication')) {
      errorMessage = ERROR_MESSAGES.AUTH_ERROR;
    } else {
      errorMessage = `${error.result.error.message}`;
    }
  } else if (error?.message) {
    if (error.message.includes('network') || error.message.includes('connection')) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.message.includes('authentication') || error.message.includes('auth')) {
      errorMessage = ERROR_MESSAGES.AUTH_ERROR;
    } else {
      errorMessage = `${error.message}`;
    }
  }
  
  return new Error(errorMessage);
};

// تهيئة خدمة Google Sheets باستخدام OAuth2
export const initGoogleSheetsApi = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (initialized) {
      resolve(true);
      return;
    }
    
    if (isInitializing) {
      // التحقق كل 100 مللي ثانية حتى اكتمال التهيئة
      const checkInterval = setInterval(() => {
        if (initialized) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (lastError) {
          clearInterval(checkInterval);
          reject(lastError);
        }
      }, 100);
      return;
    }

    isInitializing = true;
    console.log("بدء تهيئة Google Sheets API باستخدام OAuth2...");
    lastError = null;

    try {
      // تهيئة API الفعلي
      const loadGapiClient = () => {
        if (typeof gapi === 'undefined') {
          if (apiLoadRetries < MAX_RETRIES) {
            apiLoadRetries++;
            console.log(`محاولة تحميل GAPI (المحاولة ${apiLoadRetries}/${MAX_RETRIES})...`);
            setTimeout(loadGapiClient, 1000);
            return;
          } else {
            const error = new Error("تعذر تحميل مكتبة Google API. يرجى التحقق من اتصالك بالإنترنت.");
            console.error("فشل في تحميل مكتبة Google API:", error);
            isInitializing = false;
            lastError = error;
            reject(error);
            return;
          }
        }

        gapi.load('client:auth2', async () => {
          try {
            // تهيئة العميل باستخدام OAuth2
            await gapi.client.init({
              apiKey: GOOGLE_API_CONFIG.API_KEY,
              clientId: GOOGLE_API_CONFIG.CLIENT_ID,
              discoveryDocs: GOOGLE_API_CONFIG.DISCOVERY_DOCS,
              scope: GOOGLE_API_CONFIG.SCOPES
            });
            
            // التحقق من حالة تسجيل الدخول والطلب من المستخدم تسجيل الدخول إذا لم يكن مسجلاً
            if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
              try {
                // هذا سيفتح نافذة منبثقة لتسجيل دخول المستخدم
                await gapi.auth2.getAuthInstance().signIn();
                console.log("تم تسجيل الدخول بنجاح باستخدام OAuth2");
              } catch (signInError) {
                console.error("فشل في تسجيل الدخول:", signInError);
                isInitializing = false;
                lastError = handleApiError(signInError);
                reject(lastError);
                return;
              }
            }
            
            console.log("تمت تهيئة Google Sheets API بنجاح باستخدام OAuth2");
            initialized = true;
            isInitializing = false;
            lastError = null;
            resolve(true);
          } catch (error: any) {
            console.error("فشل في تهيئة Google Sheets API:", error);
            isInitializing = false;
            lastError = handleApiError(error);
            initialized = false;
            reject(lastError);
          }
        });
      };
      
      loadGapiClient();
    } catch (error: any) {
      console.error("فشل في تحميل Google Sheets API:", error);
      isInitializing = false;
      lastError = handleApiError(error);
      initialized = false;
      reject(lastError);
    }
  });
};

// إذا كان API مهيأ
export const isApiInitialized = (): boolean => {
  return initialized;
};

// تسجيل الدخول يدوياً
export const signIn = async (): Promise<boolean> => {
  try {
    if (!gapi.auth2) {
      await initGoogleSheetsApi();
    }
    
    await gapi.auth2.getAuthInstance().signIn();
    return true;
  } catch (error) {
    lastError = handleApiError(error);
    throw lastError;
  }
};

// تسجيل الخروج
export const signOut = async (): Promise<boolean> => {
  try {
    if (!gapi.auth2) {
      return false;
    }
    
    await gapi.auth2.getAuthInstance().signOut();
    return true;
  } catch (error) {
    lastError = handleApiError(error);
    throw lastError;
  }
};

// التحقق مما إذا كان المستخدم مسجل الدخول
export const isUserSignedIn = (): boolean => {
  try {
    return gapi.auth2 && gapi.auth2.getAuthInstance().isSignedIn.get();
  } catch (error) {
    return false;
  }
};

// إنشاء جدول بيانات جديد مع إعادة المحاولة
export const createNewSpreadsheet = async (title: string): Promise<string | null> => {
  try {
    console.log(`إنشاء جدول بيانات جديد: ${title}`);
    resetLastError();
    
    // التأكد من تهيئة API قبل الاستمرار
    if (!initialized || !isUserSignedIn()) {
      try {
        await initGoogleSheetsApi();
      } catch (error) {
        console.error("فشل في تهيئة API قبل إنشاء جدول بيانات:", error);
        lastError = handleApiError(error);
        throw lastError;
      }
    }
    
    // الاتصال الفعلي بـ API لإنشاء جدول بيانات جديد
    const response = await gapi.client.sheets.spreadsheets.create({
      properties: {
        title: title
      }
    });
    
    const spreadsheetId = response.result.spreadsheetId;
    
    // إضافة عنوان الأعمدة كصف أول
    await addHeaderRow(spreadsheetId);
    
    console.log(`تم إنشاء جدول بيانات جديد بنجاح، المعرف: ${spreadsheetId}`);
    
    return spreadsheetId;
  } catch (error: any) {
    console.error("فشل في إنشاء جدول بيانات:", error);
    lastError = handleApiError(error);
    
    // التحقق مما إذا كانت المشكلة في التهيئة وإعادة المحاولة
    if (!initialized || !isUserSignedIn()) {
      resetInitialization();
      try {
        await initGoogleSheetsApi();
        // محاولة إنشاء جدول البيانات مرة أخرى بعد إعادة التهيئة
        return await createNewSpreadsheet(title);
      } catch (retryError) {
        console.error("فشل في إعادة المحاولة:", retryError);
        lastError = handleApiError(retryError);
        throw lastError;
      }
    }
    
    throw lastError;
  }
};

// إضافة صف العنوان (الأعمدة)
const addHeaderRow = async (spreadsheetId: string): Promise<boolean> => {
  try {
    console.log("إضافة صف العنوان...");
    
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A1:G1',
      valueInputOption: 'RAW',
      resource: {
        values: [SHEET_COLUMNS]
      }
    });
    
    return true;
  } catch (error: any) {
    console.error("فشل في إضافة صف العنوان:", error);
    
    if (error?.result?.error?.message) {
      lastError = new Error(`فشل في إضافة صف العنوان: ${error.result.error.message}`);
    } else if (error?.message) {
      lastError = new Error(`فشل في إضافة صف العنوان: ${error.message}`);
    } else {
      lastError = new Error("فشل في إضافة صف العنوان لسبب غير معروف");
    }
    
    throw lastError;
  }
};

// تصدير بيانات الصور إلى جدول البيانات
export const exportImagesToSheet = async (
  spreadsheetId: string, 
  images: ImageData[]
): Promise<boolean> => {
  try {
    console.log(`تصدير البيانات إلى جدول البيانات: ${spreadsheetId}`);
    resetLastError();
    
    // التأكد من تهيئة API قبل الاستمرار
    if (!initialized) {
      try {
        await initGoogleSheetsApi();
      } catch (error) {
        console.error("فشل في تهيئة API قبل تصدير البيانات:", error);
        lastError = error;
        throw error;
      }
    }
    
    // تحويل البيانات إلى تنسيق مناسب لـ Google Sheets
    const values = images
      .filter(img => img.status === "completed" && img.code && img.senderName && img.phoneNumber)
      .map(img => [
        img.code || '',
        img.senderName || '',
        img.phoneNumber || '',
        img.province || '',
        img.price || '',
        img.companyName || '',
        img.date ? formatDate(img.date) : ''
      ]);
    
    if (values.length === 0) {
      console.log("لا توجد بيانات صالحة للتصدير");
      lastError = new Error("لا توجد بيانات صالحة للتصدير");
      return false;
    }
    
    // إرسال البيانات إلى جدول البيانات
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A2',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values
      }
    });
    
    console.log(`تم تصدير ${values.length} سجل بنجاح إلى جدول البيانات`);
    
    return true;
  } catch (error: any) {
    console.error("فشل في تصدير البيانات:", error);
    
    if (error?.result?.error?.message) {
      lastError = new Error(`فشل في تصدير البيانات: ${error.result.error.message}`);
    } else if (error?.message) {
      lastError = new Error(`فشل في تصدير البيانات: ${error.message}`);
    } else {
      lastError = new Error("فشل في تصدير البيانات لسبب غير معروف");
    }
    
    // التحقق مما إذا كانت المشكلة في التهيئة وإعادة المحاولة
    if (!initialized) {
      resetInitialization();
      try {
        await initGoogleSheetsApi();
        // محاولة تصدير البيانات مرة أخرى بعد إعادة التهيئة
        return await exportImagesToSheet(spreadsheetId, images);
      } catch (retryError) {
        console.error("فشل في إعادة المحاولة للتصدير:", retryError);
        if (retryError instanceof Error) {
          lastError = retryError;
        } else {
          lastError = new Error("فشل في إعادة المحاولة لتصدير البيانات");
        }
        throw lastError;
      }
    }
    
    throw lastError;
  }
};

// الحصول على قائمة جداول البيانات المتاحة
export const getSpreadsheetsList = async (): Promise<Array<{id: string, name: string}>> => {
  try {
    console.log("الحصول على قائمة جداول البيانات");
    resetLastError();
    
    // التأكد من تهيئة API قبل الاستمرار
    if (!initialized) {
      try {
        await initGoogleSheetsApi();
      } catch (error) {
        console.error("فشل في تهيئة API قبل جلب القائمة:", error);
        lastError = error;
        throw error;
      }
    }
    
    const response = await gapi.client.drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: "files(id, name)"
    });
    
    const sheets = response.result.files.map(file => ({
      id: file.id,
      name: file.name
    }));
    
    console.log(`تم الحصول على ${sheets.length} جدول بيانات`);
    
    return sheets;
  } catch (error: any) {
    console.error("فشل في الحصول على قائمة جداول البيانات:", error);
    
    if (error?.result?.error?.message) {
      lastError = new Error(`فشل في الحصول على قائمة جداول البيانات: ${error.result.error.message}`);
    } else if (error?.message) {
      lastError = new Error(`فشل في الحصول على قائمة جداول البيانات: ${error.message}`);
    } else {
      lastError = new Error("فشل في الحصول على قائمة جداول البيانات لسبب غير معروف");
    }
    
    // التحقق مما إذا كانت المشكلة في التهيئة وإعادة المحاولة
    if (!initialized) {
      resetInitialization();
      try {
        await initGoogleSheetsApi();
        // محاولة جلب القائمة مرة أخرى بعد إعادة التهيئة
        return await getSpreadsheetsList();
      } catch (retryError) {
        console.error("فشل في إعادة المحاولة لجلب القائمة:", retryError);
        if (retryError instanceof Error) {
          lastError = retryError;
        } else {
          lastError = new Error("فشل في إعادة المحاولة للحصول على قائمة جداول البيانات");
        }
        throw lastError;
      }
    }
    
    throw lastError;
  }
};

// تصدير البيانات إلى جدول البيانات الافتراضي
export const exportToDefaultSheet = async (images: ImageData[]): Promise<boolean> => {
  resetLastError();
  
  try {
    // التحقق من وجود جدول بيانات افتراضي في الإعدادات
    const defaultSheetId = localStorage.getItem('defaultSheetId');
    
    // إذا لم يوجد جدول بيانات افتراضي، ننشئ واحداً جديداً
    if (!defaultSheetId) {
      const title = `بيانات الشحنات ${new Date().toLocaleDateString('ar-EG')}`;
      const newSheetId = await createNewSpreadsheet(title);
      
      if (newSheetId) {
        localStorage.setItem('defaultSheetId', newSheetId);
        return await exportImagesToSheet(newSheetId, images);
      }
      
      throw new Error("فشل في إنشاء جدول بيانات افتراضي");
    }
    
    // استخدام الجدول الافتراضي
    return await exportImagesToSheet(defaultSheetId, images);
  } catch (error) {
    console.error("فشل في التصدير إلى الجدول الافتراضي:", error);
    
    if (error instanceof Error) {
      lastError = error;
    } else {
      lastError = new Error("فشل في التصدير إلى الجدول الافتراضي لسبب غير معروف");
    }
    
    throw lastError;
  }
};
