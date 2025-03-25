
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, CheckCircle, AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  isApiInitialized, 
  initGoogleSheetsApi,
  exportToDefaultSheet,
  resetInitialization, 
  getLastError,
  isUserSignedIn,
  signIn
} from "@/lib/googleSheets/sheetsService";
import { ImageData } from "@/types/ImageData";
import { GOOGLE_API_CONFIG } from "@/lib/googleSheets/config";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SheetsExportButtonProps {
  images: ImageData[];
}

const SheetsExportButton: React.FC<SheetsExportButtonProps> = ({ images }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [lastExportSuccess, setLastExportSuccess] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [initAttempts, setInitAttempts] = useState(0);
  const { toast } = useToast();

  // تهيئة واجهة برمجة التطبيقات عند تحميل المكون
  useEffect(() => {
    const initApi = async () => {
      setIsLoading(true);
      try {
        // محاولة تهيئة API
        await initGoogleSheetsApi();
        setIsInitialized(true);
        setIsSignedIn(isUserSignedIn());
        setShowConnectionAlert(false);
        console.log("تم تهيئة Google Sheets API بنجاح");
      } catch (error: any) {
        console.error("فشل في تهيئة API الخاص بجداول البيانات:", error);
        setErrorMessage(error?.message || "خطأ غير معروف في الاتصال");
        setErrorDetails(getErrorDetails(error));
        setIsInitialized(false);
        setIsSignedIn(false);
        setShowConnectionAlert(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    initApi();
  }, [initAttempts]);

  // التحقق من البيانات الصالحة للتصدير
  const validImagesCount = images.filter(img => 
    img.status === "completed" && img.code && img.senderName && img.phoneNumber
  ).length;

  // استخراج تفاصيل الخطأ
  const getErrorDetails = (error: any): string => {
    if (error?.result?.error) {
      return JSON.stringify(error.result.error, null, 2);
    } else if (error?.stack) {
      return error.stack;
    }
    return error?.toString() || "لا توجد تفاصيل إضافية";
  };

  // إعادة محاولة الاتصال
  const handleRetryConnection = () => {
    setShowErrorDialog(false);
    setShowConnectionAlert(false);
    setErrorMessage("");
    resetInitialization();
    setInitAttempts(prev => prev + 1);
    
    toast({
      title: "إعادة الاتصال",
      description: "جاري محاولة الاتصال بـ Google Sheets مرة أخرى...",
    });
  };

  // تسجيل الدخول يدويًا - مطلوب فقط في حالة استخدام OAuth
  const handleSignIn = async () => {
    if (!GOOGLE_API_CONFIG.USE_OAUTH) {
      toast({
        title: "معلومات",
        description: "الاتصال يتم باستخدام حساب الخدمة، لا حاجة لتسجيل الدخول يدويًا.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await signIn();
      setIsSignedIn(true);
      toast({
        title: "تم تسجيل الدخول",
        description: "تم تسجيل الدخول بنجاح إلى Google Sheets",
      });
    } catch (error: any) {
      console.error("فشل في تسجيل الدخول:", error);
      setErrorMessage(error?.message || "فشل في تسجيل الدخول لسبب غير معروف");
      setErrorDetails(getErrorDetails(error));
      setShowErrorDialog(true);
      
      toast({
        title: "فشل تسجيل الدخول",
        description: "فشل في تسجيل الدخول إلى Google Sheets، انقر على الزر لمزيد من التفاصيل",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // معالج التصدير
  const handleExport = async () => {
    if (validImagesCount === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا توجد بيانات مكتملة للتصدير",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLastExportSuccess(false);
    
    try {
      // تصدير البيانات إلى جدول البيانات الافتراضي
      const success = await exportToDefaultSheet(images);
      
      if (success) {
        toast({
          title: "تم التصدير",
          description: `تم تصدير ${validImagesCount} من البيانات إلى Google Sheets بنجاح`,
        });
        setLastExportSuccess(true);
      } else {
        const error = getLastError() as any;
        setErrorMessage(error?.message || "فشل في تصدير البيانات، يرجى المحاولة مرة أخرى");
        setErrorDetails(getErrorDetails(error));
        setShowErrorDialog(true);
        
        toast({
          title: "فشل التصدير",
          description: "فشل في تصدير البيانات، انقر على الزر لمزيد من التفاصيل",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("خطأ أثناء التصدير:", error);
      setErrorMessage(error?.message || "حدث خطأ غير متوقع");
      setErrorDetails(getErrorDetails(error));
      setShowErrorDialog(true);
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة تصدير البيانات، انقر على الزر لمزيد من التفاصيل",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // عرض حالة الزر بناءً على حالة التهيئة والتصدير
  return (
    <>
      {GOOGLE_API_CONFIG.USE_SERVICE_ACCOUNT ? (
        <Button
          onClick={isInitialized ? handleExport : handleRetryConnection}
          disabled={isLoading || (isInitialized && validImagesCount === 0)}
          className={`w-full ${lastExportSuccess ? 'bg-green-600 hover:bg-green-700' : isInitialized ? 'bg-brand-green hover:bg-brand-green/90' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري المعالجة...
            </>
          ) : !isInitialized ? (
            <>
              <AlertTriangle className="h-4 w-4 ml-2" />
              فشل الاتصال بـ Google Sheets (حساب الخدمة)، انقر لإعادة المحاولة
            </>
          ) : lastExportSuccess ? (
            <>
              <CheckCircle className="h-4 w-4 ml-2" />
              تم التصدير بنجاح
            </>
          ) : (
            <>
              <Send className="h-4 w-4 ml-2" />
              تصدير البيانات إلى Google Sheets {validImagesCount > 0 && `(${validImagesCount})`}
            </>
          )}
        </Button>
      ) : !isSignedIn ? (
        <Button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full bg-brand-green hover:bg-brand-green/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري تسجيل الدخول...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 ml-2" />
              تسجيل الدخول إلى Google Sheets
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={isInitialized ? handleExport : handleRetryConnection}
          disabled={isLoading || (isInitialized && validImagesCount === 0)}
          className={`w-full ${lastExportSuccess ? 'bg-green-600 hover:bg-green-700' : isInitialized ? 'bg-brand-green hover:bg-brand-green/90' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري المعالجة...
            </>
          ) : !isInitialized ? (
            <>
              <AlertTriangle className="h-4 w-4 ml-2" />
              فشل الاتصال بـ Google Sheets، انقر لإعادة المحاولة
            </>
          ) : lastExportSuccess ? (
            <>
              <CheckCircle className="h-4 w-4 ml-2" />
              تم التصدير بنجاح
            </>
          ) : (
            <>
              <Send className="h-4 w-4 ml-2" />
              تصدير البيانات إلى Google Sheets {validImagesCount > 0 && `(${validImagesCount})`}
            </>
          )}
        </Button>
      )}

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">خطأ في Google Sheets</DialogTitle>
            <DialogDescription>
              حدث خطأ أثناء العملية. يرجى الاطلاع على التفاصيل أدناه.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mt-2">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">رسالة الخطأ:</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1 overflow-auto max-h-28">
              {errorMessage || "حدث خطأ غير متوقع أثناء الاتصال بالخدمة"}
            </p>
            
            {errorDetails && (
              <>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mt-3">تفاصيل إضافية:</p>
                <div className="text-xs text-red-700 dark:text-red-400 mt-1 overflow-auto max-h-28 bg-red-100 dark:bg-red-900/40 p-2 rounded whitespace-pre">
                  {errorDetails}
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowErrorDialog(false)}
            >
              إغلاق
            </Button>
            <Button 
              onClick={handleRetryConnection} 
              className="bg-brand-green hover:bg-brand-green/90"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConnectionAlert} onOpenChange={setShowConnectionAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">مشكلة في الاتصال بـ Google Sheets</AlertDialogTitle>
            <AlertDialogDescription>
              {GOOGLE_API_CONFIG.USE_SERVICE_ACCOUNT ? (
                <p className="mb-2">فشل في الاتصال باستخدام حساب الخدمة. قد يكون هناك قيود على استخدام حسابات الخدمة في بيئة المتصفح.</p>
              ) : (
                <p className="mb-2">فشل في الاتصال بـ Google Sheets. هذا عادة بسبب مشكلة في المصادقة أو الاتصال.</p>
              )}
              <p>يمكنك إعادة المحاولة أو تعديل الإعدادات للاستخدام. انقر على "إعادة المحاولة" أدناه.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mt-2">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">رسالة الخطأ:</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1 overflow-auto max-h-28">
              {errorMessage || "حدث خطأ غير متوقع أثناء الاتصال بالخدمة"}
            </p>
            
            {errorDetails && (
              <>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mt-3">تفاصيل إضافية:</p>
                <div className="text-xs text-red-700 dark:text-red-400 mt-1 overflow-auto max-h-28 bg-red-100 dark:bg-red-900/40 p-2 rounded whitespace-pre">
                  {errorDetails}
                </div>
              </>
            )}
          </div>
          
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0">إغلاق</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRetryConnection}
              className="bg-brand-green hover:bg-brand-green/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <RefreshCw className="h-4 w-4 ml-2" />
              )}
              إعادة المحاولة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SheetsExportButton;
