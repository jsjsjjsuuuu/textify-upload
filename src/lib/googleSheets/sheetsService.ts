
import { gapi } from 'gapi-script';
import { GOOGLE_API_CONFIG, SHEET_COLUMNS, SERVICE_ACCOUNT } from './config';
import { ImageData } from '@/types/ImageData';
import { formatDate } from '@/utils/dateFormatter';

// حالة تهيئة API
let initialized = false;
let isInitializing = false;
let lastError = null;

// الحصول على آخر خطأ
export const getLastError = () => {
  return lastError;
};

// إعادة تعيين حالة الخطأ
export const resetLastError = () => {
  lastError = null;
};

// تهيئة خدمة Google Sheets باستخدام حساب الخدمة
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
        }
      }, 100);
      return;
    }

    isInitializing = true;
    console.log("بدء تهيئة Google Sheets API مع حساب الخدمة...");
    lastError = null;

    try {
      // تهيئة API الفعلي
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: GOOGLE_API_CONFIG.API_KEY,
            clientId: GOOGLE_API_CONFIG.CLIENT_ID,
            discoveryDocs: GOOGLE_API_CONFIG.DISCOVERY_DOCS,
            scope: GOOGLE_API_CONFIG.SCOPES
          });
          
          console.log("تمت تهيئة Google Sheets API بنجاح");
          initialized = true;
          isInitializing = false;
          lastError = null;
          resolve(true);
        } catch (error) {
          console.error("فشل في تهيئة Google Sheets API:", error);
          isInitializing = false;
          lastError = error;
          initialized = false;
          reject(error);
        }
      });
    } catch (error) {
      console.error("فشل في تحميل Google Sheets API:", error);
      isInitializing = false;
      lastError = error;
      initialized = false;
      reject(error);
    }
  });
};

// إذا كان API مهيأ
export const isApiInitialized = (): boolean => {
  return initialized;
};

// إعادة ضبط حالة الاتصال
export const resetInitialization = () => {
  initialized = false;
  isInitializing = false;
  lastError = null;
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
        lastError = error;
        return null;
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
  } catch (error) {
    console.error("فشل في إنشاء جدول بيانات:", error);
    lastError = error;
    
    // التحقق مما إذا كانت المشكلة في التهيئة وإعادة المحاولة
    if (!initialized) {
      resetInitialization();
      try {
        await initGoogleSheetsApi();
        // محاولة إنشاء جدول البيانات مرة أخرى بعد إعادة التهيئة
        return await createNewSpreadsheet(title);
      } catch (retryError) {
        console.error("فشل في إعادة المحاولة:", retryError);
        lastError = retryError;
        return null;
      }
    }
    
    return null;
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
  } catch (error) {
    console.error("فشل في إضافة صف العنوان:", error);
    lastError = error;
    return false;
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
        return false;
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
  } catch (error) {
    console.error("فشل في تصدير البيانات:", error);
    lastError = error;
    
    // التحقق مما إذا كانت المشكلة في التهيئة وإعادة المحاولة
    if (!initialized) {
      resetInitialization();
      try {
        await initGoogleSheetsApi();
        // محاولة تصدير البيانات مرة أخرى بعد إعادة التهيئة
        return await exportImagesToSheet(spreadsheetId, images);
      } catch (retryError) {
        console.error("فشل في إعادة المحاولة للتصدير:", retryError);
        lastError = retryError;
        return false;
      }
    }
    
    return false;
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
        return [];
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
  } catch (error) {
    console.error("فشل في الحصول على قائمة جداول البيانات:", error);
    lastError = error;
    
    // التحقق مما إذا كانت المشكلة في التهيئة وإعادة المحاولة
    if (!initialized) {
      resetInitialization();
      try {
        await initGoogleSheetsApi();
        // محاولة جلب القائمة مرة أخرى بعد إعادة التهيئة
        return await getSpreadsheetsList();
      } catch (retryError) {
        console.error("فشل في إعادة المحاولة لجلب القائمة:", retryError);
        lastError = retryError;
        return [];
      }
    }
    
    return [];
  }
};

// تصدير البيانات إلى جدول البيانات الافتراضي
export const exportToDefaultSheet = async (images: ImageData[]): Promise<boolean> => {
  resetLastError();
  
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
    
    return false;
  }
  
  // استخدام الجدول الافتراضي
  return await exportImagesToSheet(defaultSheetId, images);
};

