
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  isApiInitialized, 
  initGoogleSheetsApi,
  exportToDefaultSheet,
  resetInitialization, 
  getLastError 
} from "@/lib/googleSheets/sheetsService";
import { ImageData } from "@/types/ImageData";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SheetsExportButtonProps {
  images: ImageData[];
}

const SheetsExportButton: React.FC<SheetsExportButtonProps> = ({ images }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastExportSuccess, setLastExportSuccess] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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
        console.log("تم تهيئة Google Sheets API بنجاح");
      } catch (error: any) {
        console.error("فشل في تهيئة API الخاص بجداول البيانات:", error);
        setErrorMessage(error?.message || "خطأ غير معروف في الاتصال");
        setIsInitialized(false);
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

  // إعادة محاولة الاتصال
  const handleRetryConnection = () => {
    setShowErrorDialog(false);
    setErrorMessage("");
    resetInitialization();
    setInitAttempts(prev => prev + 1);
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
      <Button
        onClick={isInitialized ? handleExport : () => setShowErrorDialog(true)}
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
            فشل الاتصال بـ Google Sheets
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

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">فشل في الاتصال بـ Google Sheets</DialogTitle>
            <DialogDescription>
              حدث خطأ أثناء محاولة الاتصال بخدمة Google Sheets. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mt-2">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">رسالة الخطأ:</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1 overflow-auto max-h-28">
              {errorMessage || "حدث خطأ غير متوقع أثناء الاتصال بالخدمة"}
            </p>
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
    </>
  );
};

export default SheetsExportButton;
