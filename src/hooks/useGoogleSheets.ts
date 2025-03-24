
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  initGoogleSheetsApi, 
  isUserSignedIn, 
  signIn, 
  signOut, 
  createNewSpreadsheet, 
  exportImagesToSheet, 
  getSpreadsheetsList 
} from '@/lib/googleSheets/sheetsService';
import { ImageData } from '@/types/ImageData';

export const useGoogleSheets = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<Array<{id: string, name: string}>>([]);
  const { toast } = useToast();

  // تهيئة الخدمة عند تحميل المكون
  useEffect(() => {
    const initAPI = async () => {
      try {
        await initGoogleSheetsApi();
        setIsInitialized(true);
        setIsSignedIn(isUserSignedIn());
      } catch (error) {
        console.error("فشل في تهيئة Google Sheets:", error);
      }
    };
    
    initAPI();
  }, []);

  // تسجيل الدخول إلى Google
  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const success = await signIn();
      setIsSignedIn(success);
      if (success) {
        toast({
          title: "تم تسجيل الدخول",
          description: "تم تسجيل الدخول إلى Google بنجاح",
        });
        await loadSpreadsheets();
      } else {
        toast({
          title: "فشل تسجيل الدخول",
          description: "فشل في تسجيل الدخول إلى Google",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("خطأ في تسجيل الدخول:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تسجيل الخروج من Google
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      setIsSignedIn(false);
      setSpreadsheets([]);
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج من Google بنجاح",
      });
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة تسجيل الخروج",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل قائمة جداول البيانات
  const loadSpreadsheets = async () => {
    setIsLoading(true);
    try {
      const sheets = await getSpreadsheetsList();
      setSpreadsheets(sheets);
    } catch (error) {
      console.error("فشل في تحميل جداول البيانات:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة جداول البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إنشاء جدول بيانات جديد
  const createSheet = async (title: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const spreadsheetId = await createNewSpreadsheet(title);
      if (spreadsheetId) {
        toast({
          title: "تم الإنشاء",
          description: `تم إنشاء جدول بيانات "${title}" بنجاح`,
        });
        await loadSpreadsheets();
        return spreadsheetId;
      } else {
        toast({
          title: "فشل الإنشاء",
          description: "فشل في إنشاء جدول البيانات",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error("خطأ في إنشاء جدول البيانات:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة إنشاء جدول البيانات",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // تصدير البيانات إلى جدول بيانات
  const exportToSheet = async (spreadsheetId: string, images: ImageData[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await exportImagesToSheet(spreadsheetId, images);
      if (success) {
        toast({
          title: "تم التصدير",
          description: "تم تصدير البيانات إلى Google Sheets بنجاح",
        });
        return true;
      } else {
        toast({
          title: "فشل التصدير",
          description: "فشل في تصدير البيانات، تأكد من وجود بيانات صالحة للتصدير",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة تصدير البيانات",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isSignedIn,
    isLoading,
    spreadsheets,
    handleSignIn,
    handleSignOut,
    loadSpreadsheets,
    createSheet,
    exportToSheet
  };
};

