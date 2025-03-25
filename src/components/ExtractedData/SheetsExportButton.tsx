
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  isApiInitialized, 
  initGoogleSheetsApi,
  exportToDefaultSheet 
} from "@/lib/googleSheets/sheetsService";
import { ImageData } from "@/types/ImageData";

interface SheetsExportButtonProps {
  images: ImageData[];
}

const SheetsExportButton: React.FC<SheetsExportButtonProps> = ({ images }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastExportSuccess, setLastExportSuccess] = useState(false);
  const { toast } = useToast();

  // تهيئة واجهة برمجة التطبيقات عند تحميل المكون
  useEffect(() => {
    const initApi = async () => {
      try {
        // محاولة تهيئة API
        await initGoogleSheetsApi();
        setIsInitialized(true);
        console.log("تم تهيئة Google Sheets API بنجاح");
      } catch (error) {
        console.error("فشل في تهيئة API الخاص بجداول البيانات:", error);
        toast({
          title: "خطأ في الاتصال",
          description: "فشل في تهيئة الاتصال بـ Google Sheets، سيتم استخدام وضع المحاكاة",
          variant: "destructive"
        });
        // حتى مع وجود خطأ، نضبط حالة التهيئة على true لتمكين المستخدم من استخدام الوظائف
        setIsInitialized(true);
      }
    };
    
    initApi();
  }, []);

  // التحقق من البيانات الصالحة للتصدير
  const validImagesCount = images.filter(img => 
    img.status === "completed" && img.code && img.senderName && img.phoneNumber
  ).length;

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
        toast({
          title: "فشل التصدير",
          description: "فشل في تصدير البيانات، يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("خطأ أثناء التصدير:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة تصدير البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // عرض حالة الزر بناءً على حالة التهيئة والتصدير
  return (
    <Button
      onClick={handleExport}
      disabled={!isInitialized || isLoading || validImagesCount === 0}
      className={`w-full ${lastExportSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-green hover:bg-brand-green/90'}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin ml-2" />
      ) : lastExportSuccess ? (
        <CheckCircle className="h-4 w-4 ml-2" />
      ) : (
        <Send className="h-4 w-4 ml-2" />
      )}
      تصدير البيانات إلى Google Sheets {validImagesCount > 0 && `(${validImagesCount})`}
    </Button>
  );
};

export default SheetsExportButton;
