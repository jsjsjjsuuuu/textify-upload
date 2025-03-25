
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  initGoogleSheetsApi, 
  isApiInitialized,
  createNewSpreadsheet, 
  exportImagesToSheet, 
  getSpreadsheetsList,
  exportToDefaultSheet,
  resetInitialization,
  getLastError,
  isUserSignedIn,
  signIn,
  signOut
} from '@/lib/googleSheets/sheetsService';
import { ImageData } from '@/types/ImageData';
import { GOOGLE_API_CONFIG } from '@/lib/googleSheets/config';

export const useGoogleSheets = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<Array<{id: string, name: string}>>([]);
  const [lastError, setLastError] = useState<any>(null);
  const [initAttempts, setInitAttempts] = useState(0);
  const { toast } = useToast();

  // تهيئة الخدمة عند تحميل المكون
  useEffect(() => {
    const initAPI = async () => {
      setIsLoading(true);
      try {
        await initGoogleSheetsApi();
        setIsInitialized(true);
        setIsSignedIn(GOOGLE_API_CONFIG.USE_SERVICE_ACCOUNT || isUserSignedIn());
        setLastError(null);
        
        console.log("تم تهيئة API بنجاح، جاري تحميل قائمة جداول البيانات...");
        
        // تحميل قائمة جداول البيانات مباشرة بعد التهيئة
        await loadSpreadsheets();
      } catch (error) {
        console.error("فشل في تهيئة Google Sheets:", error);
        setLastError(error);
        
        toast({
          title: "خطأ في الاتصال",
          description: error instanceof Error ? error.message : "فشل في الاتصال بـ Google Sheets",
          variant: "destructive"
        });
        
        setIsInitialized(false);
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAPI();
  }, [initAttempts]);

  // إعادة تعيين الحالة وإعادة المحاولة
  const retryInitialization = useCallback(() => {
    resetInitialization();
    setInitAttempts(prev => prev + 1);
    
    toast({
      title: "إعادة الاتصال",
      description: "جاري محاولة الاتصال بـ Google Sheets مرة أخرى...",
    });
  }, [toast]);

  // وظيفة لمعالجة تسجيل الدخول
  const handleSignIn = async () => {
    // إذا كنا نستخدم حساب الخدمة، نشرح للمستخدم أن تسجيل الدخول ليس مطلوبًا
    if (GOOGLE_API_CONFIG.USE_SERVICE_ACCOUNT) {
      toast({
        title: "معلومات",
        description: "الاتصال يتم باستخدام حساب الخدمة، لا حاجة لتسجيل الدخول يدويًا.",
      });
      setIsSignedIn(true); // نقوم بتعيين هذه الحالة كـ true لتجاوز طلب تسجيل الدخول
      return true;
    }
    
    setIsLoading(true);
    try {
      await signIn();
      setIsInitialized(true);
      setIsSignedIn(true);
      setLastError(null);
      
      toast({
        title: "تم تسجيل الدخول",
        description: "تم تسجيل الدخول بنجاح إلى Google Sheets",
      });
      
      // تحميل قائمة جداول البيانات بعد تسجيل الدخول
      await loadSpreadsheets();
      return true;
    } catch (error) {
      console.error("فشل في تسجيل الدخول:", error);
      setLastError(error);
      
      toast({
        title: "فشل تسجيل الدخول",
        description: error instanceof Error ? error.message : "فشل في تسجيل الدخول إلى Google Sheets، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
      
      setIsInitialized(false);
      setIsSignedIn(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // وظيفة لمعالجة تسجيل الخروج
  const handleSignOut = async () => {
    // إذا كنا نستخدم حساب الخدمة، نشرح للمستخدم أن تسجيل الخروج ليس ضروريًا
    if (GOOGLE_API_CONFIG.USE_SERVICE_ACCOUNT) {
      toast({
        title: "معلومات",
        description: "الاتصال يتم باستخدام حساب الخدمة، لا حاجة لتسجيل الخروج.",
      });
      return true;
    }
    
    setIsLoading(true);
    try {
      await signOut();
      setIsSignedIn(false);
      
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح من Google Sheets",
      });
      return true;
    } catch (error) {
      console.error("فشل في تسجيل الخروج:", error);
      setLastError(error);
      
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الخروج",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل قائمة جداول البيانات
  const loadSpreadsheets = async () => {
    setIsLoading(true);
    try {
      // إذا كنا نستخدم OAuth، نتحقق من تسجيل الدخول قبل جلب القائمة
      if (GOOGLE_API_CONFIG.USE_OAUTH && !isUserSignedIn()) {
        console.log("المستخدم غير مسجل الدخول، جاري محاولة تسجيل الدخول...");
        await handleSignIn();
      }
      
      const sheets = await getSpreadsheetsList();
      setSpreadsheets(sheets);
      setLastError(null);
      console.log(`تم تحميل ${sheets.length} جدول بيانات`);
      return sheets;
    } catch (error) {
      console.error("فشل في تحميل جداول البيانات:", error);
      setLastError(error);
      
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة جداول البيانات",
        variant: "destructive"
      });
      
      setSpreadsheets([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // إنشاء جدول بيانات جديد
  const createSheet = async (title: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      console.log(`بدء إنشاء جدول بيانات جديد: ${title}`);
      const spreadsheetId = await createNewSpreadsheet(title);
      if (spreadsheetId) {
        setLastError(null);
        toast({
          title: "تم الإنشاء",
          description: `تم إنشاء جدول بيانات "${title}" بنجاح`,
        });
        await loadSpreadsheets();
        return spreadsheetId;
      } else {
        throw new Error("فشل في إنشاء جدول البيانات - لم يتم إرجاع معرف");
      }
    } catch (error) {
      console.error("خطأ في إنشاء جدول البيانات:", error);
      setLastError(error);
      
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء محاولة إنشاء جدول البيانات",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // تصدير البيانات إلى جدول بيانات محدد
  const exportToSheet = async (spreadsheetId: string, images: ImageData[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log(`بدء تصدير البيانات إلى جدول البيانات: ${spreadsheetId}`);
      const success = await exportImagesToSheet(spreadsheetId, images);
      if (success) {
        setLastError(null);
        toast({
          title: "تم التصدير",
          description: "تم تصدير البيانات إلى Google Sheets بنجاح",
        });
        return true;
      } else {
        throw new Error("فشل في تصدير البيانات، تأكد من وجود بيانات صالحة للتصدير");
      }
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      setLastError(error);
      
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء محاولة تصدير البيانات",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // تصدير البيانات إلى جدول البيانات الافتراضي
  const exportToDefaultSpreadsheet = async (images: ImageData[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log("بدء تصدير البيانات إلى جدول البيانات الافتراضي");
      const success = await exportToDefaultSheet(images);
      if (success) {
        setLastError(null);
        toast({
          title: "تم التصدير",
          description: "تم تصدير البيانات إلى Google Sheets بنجاح",
        });
        return true;
      } else {
        throw new Error("فشل في تصدير البيانات، تأكد من وجود بيانات صالحة للتصدير");
      }
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      setLastError(error);
      
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء محاولة تصدير البيانات",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // تعيين جدول بيانات افتراضي
  const setDefaultSheet = (sheetId: string) => {
    localStorage.setItem('defaultSheetId', sheetId);
    const sheetName = spreadsheets.find(s => s.id === sheetId)?.name || '';
    
    toast({
      title: "تم التعيين",
      description: `تم تعيين "${sheetName}" كجدول بيانات افتراضي للتصدير`,
    });
  };

  return {
    isInitialized,
    isSignedIn,
    isLoading,
    spreadsheets,
    lastError,
    handleSignIn,
    handleSignOut,
    loadSpreadsheets,
    createSheet,
    exportToSheet,
    exportToDefaultSpreadsheet,
    setDefaultSheet,
    retryInitialization
  };
};
