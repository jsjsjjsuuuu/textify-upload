
import { gapi } from 'gapi-script';
import { GOOGLE_API_CONFIG, SHEET_COLUMNS, ERROR_MESSAGES, SERVICE_ACCOUNT } from './config';
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
    } else if (error.message.includes('service account')) {
      errorMessage = ERROR_MESSAGES.SERVICE_ACCOUNT_ERROR;
    } else {
      errorMessage = `${error.message}`;
    }
  }
  
  return new Error(errorMessage);
};

// تهيئة خدمة Google Sheets API 
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
    console.log("بدء تهيئة Google Sheets API...");
    
    // استخدام مفتاح API للوصول إلى المستندات المكتشفة
    loadGapiClient();
    
    function loadGapiClient() {
      if (typeof gapi === 'undefined') {
        retryLoadingGapi();
        return;
      }
      
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: GOOGLE_API_CONFIG.API_KEY,
            discoveryDocs: GOOGLE_API_CONFIG.DISCOVERY_DOCS
          });
          
          console.log("تمت تهيئة Google Sheets API بنجاح باستخدام مفتاح API مع حساب الخدمة");
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
    }
    
    function retryLoadingGapi() {
      if (apiLoadRetries < MAX_RETRIES) {
        apiLoadRetries++;
        console.log(`محاولة تحميل GAPI (المحاولة ${apiLoadRetries}/${MAX_RETRIES})...`);
        setTimeout(() => {
          loadGapiClient();
        }, 1000);
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
  });
};

// إذا كان API مهيأ
export const isApiInitialized = (): boolean => {
  return initialized;
};

// التحقق مما إذا كان المستخدم مسجل الدخول - دائماً سيعيد true لأننا نستخدم حساب خدمة
export const isUserSignedIn = (): boolean => {
  return true; // دائماً صحيح لأننا نستخدم حساب خدمة
};

// إنشاء جدول بيانات جديد مع إعادة المحاولة
export const createNewSpreadsheet = async (title: string): Promise<string | null> => {
  try {
    console.log(`إنشاء جدول بيانات جديد: ${title}`);
    resetLastError();
    
    // التأكد من تهيئة API قبل الاستمرار
    if (!initialized) {
      try {
        await initGoogleSheetsApi();
      } catch (error) {
        console.error("فشل في تهيئة API قبل إنشاء جدول بيانات:", error);
        lastError = handleApiError(error);
        throw lastError;
      }
    }
    
    // إنشاء جدول البيانات باستخدام حساب الخدمة
    const response = await gapi.client.sheets.spreadsheets.create({
      properties: {
        title: title
      }
    });
    
    const spreadsheetId = response.result.spreadsheetId;
    
    if (!spreadsheetId) {
      throw new Error("فشل في إنشاء جدول البيانات - لم يتم إرجاع معرف");
    }
    
    // إضافة عنوان الأعمدة كصف أول
    await addHeaderRow(spreadsheetId);
    
    console.log(`تم إنشاء جدول بيانات جديد بنجاح، المعرف: ${spreadsheetId}`);
    
    return spreadsheetId;
  } catch (error: any) {
    console.error("فشل في إنشاء جدول بيانات:", error);
    lastError = handleApiError(error);
    
    // التحقق مما إذا كانت المشكلة في التهيئة وإعادة المحاولة
    if (!initialized) {
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
    
    // الحصول على قائمة جداول البيانات من Drive API
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

// لا حاجة لدوال SignIn و SignOut لأننا نستخدم حساب الخدمة
export const signIn = async (): Promise<boolean> => {
  // عائمة لا تفعل شيئاً - فقط تعيد true لأننا في وضع حساب الخدمة
  return Promise.resolve(true);
};

export const signOut = async (): Promise<boolean> => {
  // عائمة لا تفعل شيئاً - فقط تعيد true لأننا في وضع حساب الخدمة
  return Promise.resolve(true);
};
