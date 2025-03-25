
import { gapi } from 'gapi-script';
import { GOOGLE_API_CONFIG, SHEET_COLUMNS } from './config';
import { ImageData } from '@/types/ImageData';
import { formatDate } from '@/utils/dateFormatter';

// حالة تهيئة API
let initialized = false;
let isInitializing = false;

// تهيئة خدمة Google Sheets
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
    console.log("بدء تهيئة Google Sheets API...");

    // تحميل مكتبة GAPI
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          apiKey: GOOGLE_API_CONFIG.API_KEY,
          clientId: GOOGLE_API_CONFIG.CLIENT_ID,
          discoveryDocs: GOOGLE_API_CONFIG.DISCOVERY_DOCS,
          scope: GOOGLE_API_CONFIG.SCOPES
        });
        
        console.log("تم تهيئة Google Sheets API بنجاح");
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

// التحقق من حالة تسجيل الدخول
export const isUserSignedIn = (): boolean => {
  if (!initialized || !gapi.auth2) {
    return false;
  }
  return gapi.auth2.getAuthInstance().isSignedIn.get();
};

// تسجيل الدخول
export const signIn = async (): Promise<boolean> => {
  if (!initialized) {
    await initGoogleSheetsApi();
  }
  
  try {
    await gapi.auth2.getAuthInstance().signIn();
    return true;
  } catch (error) {
    console.error("فشل في تسجيل الدخول:", error);
    return false;
  }
};

// تسجيل الخروج
export const signOut = async (): Promise<void> => {
  if (initialized && gapi.auth2) {
    await gapi.auth2.getAuthInstance().signOut();
  }
};

// إنشاء جدول بيانات جديد
export const createNewSpreadsheet = async (title: string): Promise<string | null> => {
  if (!initialized) {
    await initGoogleSheetsApi();
  }
  
  if (!isUserSignedIn()) {
    await signIn();
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
  
  if (!isUserSignedIn()) {
    await signIn();
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
  
  if (!isUserSignedIn()) {
    await signIn();
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
