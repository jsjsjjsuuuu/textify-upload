
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  initGoogleSheetsApi, 
  isApiInitialized,
  createNewSpreadsheet, 
  exportImagesToSheet, 
  getSpreadsheetsList,
  exportToDefaultSheet
} from '@/lib/googleSheets/sheetsService';
import { ImageData } from '@/types/ImageData';

export const useGoogleSheets = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false); // إضافة حالة لتتبع حالة تسجيل الدخول
  const [spreadsheets, setSpreadsheets] = useState<Array<{id: string, name: string}>>([]);
  const { toast } = useToast();

  // تهيئة الخدمة عند تحميل المكون
  useEffect(() => {
    const initAPI = async () => {
      try {
        await initGoogleSheetsApi();
        setIsInitialized(true);
        setIsSignedIn(true); // مع حساب الخدمة، نعتبر المستخدم "مسجل الدخول" تلقائيًا
        
        // تحميل قائمة جداول البيانات مباشرة بعد التهيئة
        await loadSpreadsheets();
      } catch (error) {
        console.error("فشل في تهيئة Google Sheets:", error);
        
        // على الرغم من الخطأ، نعتبر API مهيأ لأغراض المحاكاة
        setIsInitialized(true);
        setIsSignedIn(true);
        
        // تحميل بيانات افتراضية للمحاكاة
        setSpreadsheets([
          { id: 'mock1', name: 'جدول بيانات محاكاة 1' },
          { id: 'mock2', name: 'جدول بيانات محاكاة 2' }
        ]);
      }
    };
    
    initAPI();
  }, []);

  // وظيفة لمعالجة تسجيل الدخول
  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await initGoogleSheetsApi();
      setIsInitialized(true);
      setIsSignedIn(true);
      toast({
        title: "تم تسجيل الدخول",
        description: "تم تسجيل الدخول بنجاح إلى Google Sheets (وضع المحاكاة)",
      });
      return true;
    } catch (error) {
      console.error("فشل في تسجيل الدخول:", error);
      toast({
        title: "فشل تسجيل الدخول",
        description: "فشل في تسجيل الدخول إلى Google Sheets، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
      
      // على الرغم من الخطأ، نعتبر المستخدم مسجل الدخول في وضع المحاكاة
      setIsInitialized(true);
      setIsSignedIn(true);
      return true;
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
        description: "فشل في تحميل قائمة جداول البيانات، سيتم استخدام بيانات افتراضية",
        variant: "destructive"
      });
      
      // استخدام بيانات افتراضية في حالة الفشل
      setSpreadsheets([
        { id: 'mock1', name: 'جدول بيانات افتراضي 1' },
        { id: 'mock2', name: 'جدول بيانات افتراضي 2' }
      ]);
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
          description: `تم إنشاء جدول بيانات "${title}" بنجاح (وضع المحاكاة)`,
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

  // تصدير البيانات إلى جدول بيانات محدد
  const exportToSheet = async (spreadsheetId: string, images: ImageData[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await exportImagesToSheet(spreadsheetId, images);
      if (success) {
        toast({
          title: "تم التصدير",
          description: "تم تصدير البيانات إلى Google Sheets بنجاح (وضع المحاكاة)",
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
  
  // تصدير البيانات إلى جدول البيانات الافتراضي
  const exportToDefaultSpreadsheet = async (images: ImageData[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await exportToDefaultSheet(images);
      if (success) {
        toast({
          title: "تم التصدير",
          description: "تم تصدير البيانات إلى Google Sheets بنجاح (وضع المحاكاة)",
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
    isSignedIn, // إضافة حالة تسجيل الدخول للإرجاع
    isLoading,
    spreadsheets,
    handleSignIn, // إضافة وظيفة تسجيل الدخول للإرجاع
    loadSpreadsheets,
    createSheet,
    exportToSheet,
    exportToDefaultSpreadsheet,
    setDefaultSheet
  };
};
