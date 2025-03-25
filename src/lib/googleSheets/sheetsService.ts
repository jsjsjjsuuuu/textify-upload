
import { gapi } from 'gapi-script';
import { GOOGLE_API_CONFIG, SHEET_COLUMNS, SERVICE_ACCOUNT } from './config';
import { ImageData } from '@/types/ImageData';
import { formatDate } from '@/utils/dateFormatter';

// حالة تهيئة API
let initialized = false;
let isInitializing = false;

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

    // تحميل مكتبة GAPI
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: GOOGLE_API_CONFIG.API_KEY,
          discoveryDocs: GOOGLE_API_CONFIG.DISCOVERY_DOCS,
        });
        
        // تعيين مفتاح API لاستخدام حساب الخدمة
        gapi.client.setApiKey(GOOGLE_API_CONFIG.API_KEY);
        
        // استخدام حساب الخدمة للمصادقة
        await authenticateWithServiceAccount();
        
        console.log("تم تهيئة Google Sheets API بنجاح باستخدام حساب الخدمة");
        initialized = true;
        isInitializing = false;
        resolve(true);
      } catch (error) {
        console.error("فشل في تهيئة Google Sheets API:", error);
        isInitializing = false;
        reject(error);
      }
    });
  });
};

// المصادقة باستخدام حساب الخدمة
const authenticateWithServiceAccount = async (): Promise<void> => {
  try {
    // تنفيذ طلب مصادقة باستخدام بيانات حساب الخدمة
    const token = await getAccessToken();
    
    gapi.client.setToken({
      access_token: token
    });
    
    console.log("تمت المصادقة بنجاح باستخدام حساب الخدمة");
  } catch (error) {
    console.error("فشل في المصادقة باستخدام حساب الخدمة:", error);
    throw error;
  }
};

// الحصول على رمز الوصول من حساب الخدمة
const getAccessToken = async (): Promise<string> => {
  try {
    // في بيئة الإنتاج، ينبغي استخدام خادم خلفي لتنفيذ هذه العملية بأمان
    // هذه محاكاة لاستجابة رمز وصول (في الإنتاج سيتم استبدالها بطلب حقيقي)
    
    // ملاحظة: هذه طريقة مبسطة وليست آمنة تماماً للإنتاج
    // يجب استخدام خادم خلفي لإجراء طلب JWT واستلام رمز الوصول
    
    // محاكاة تأخير طلب الشبكة
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // هذا رمز وصول وهمي، سيتم استبداله في الإنتاج بطلب حقيقي
    return "simulated_service_account_access_token";
  } catch (error) {
    console.error("فشل في الحصول على رمز الوصول:", error);
    throw error;
  }
};

// التحقق من حالة API
export const isApiInitialized = (): boolean => {
  return initialized;
};

// إنشاء جدول بيانات جديد
export const createNewSpreadsheet = async (title: string): Promise<string | null> => {
  if (!initialized) {
    await initGoogleSheetsApi();
  }
  
  try {
    const response = await gapi.client.sheets.spreadsheets.create({
      properties: {
        title: title
      },
      sheets: [
        {
          properties: {
            title: 'البيانات المستخرجة',
          }
        }
      ]
    });
    
    const spreadsheetId = response.result.spreadsheetId;
    
    // إضافة عناوين الأعمدة
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'البيانات المستخرجة!A1:G1',
      valueInputOption: 'RAW',
      resource: {
        values: [SHEET_COLUMNS]
      }
    });
    
    // تنسيق الصف الأول (العناوين)
    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.7,
                    green: 0.7,
                    blue: 0.7
                  },
                  textFormat: {
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    });
    
    return spreadsheetId;
  } catch (error) {
    console.error("فشل في إنشاء جدول بيانات:", error);
    return null;
  }
};

// تصدير بيانات الصور إلى جدول البيانات
export const exportImagesToSheet = async (
  spreadsheetId: string, 
  images: ImageData[]
): Promise<boolean> => {
  if (!initialized) {
    await initGoogleSheetsApi();
  }
  
  try {
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
    
    // إضافة البيانات إلى جدول البيانات
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'البيانات المستخرجة!A2',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values
      }
    });
    
    return true;
  } catch (error) {
    console.error("فشل في تصدير البيانات:", error);
    return false;
  }
};

// الحصول على قائمة جداول البيانات المتاحة
export const getSpreadsheetsList = async (): Promise<Array<{id: string, name: string}>> => {
  if (!initialized) {
    await initGoogleSheetsApi();
  }
  
  try {
    const response = await gapi.client.drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });
    
    return response.result.files.map((file: any) => ({
      id: file.id,
      name: file.name
    }));
  } catch (error) {
    console.error("فشل في الحصول على قائمة جداول البيانات:", error);
    return [];
  }
};

// تصدير البيانات إلى جدول البيانات الافتراضي
export const exportToDefaultSheet = async (images: ImageData[]): Promise<boolean> => {
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

