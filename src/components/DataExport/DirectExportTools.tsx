
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { AlertCircle, Copy, Download, FileText, Save, Table, Upload } from "lucide-react";
import { convertImagesToBookmarkletItems, convertToCSV, convertToJSON, convertToExcel } from "@/utils/bookmarklet/converter";
import { saveToLocalStorage, getStorageStats } from "@/utils/bookmarkletService";

interface DirectExportToolsProps {
  images: ImageData[];
}

const DirectExportTools: React.FC<DirectExportToolsProps> = ({
  images
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("csv");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // تحويل صور الإدخال إلى تنسيق قابل للتصدير
  const getExportableItems = () => {
    const validImages = images.filter(img => img.status === "completed" && img.code && img.senderName && img.phoneNumber);
    if (validImages.length === 0) {
      return null;
    }
    return convertImagesToBookmarkletItems(validImages);
  };

  // تصدير إلى تخزين المتصفح
  const handleExportToStorage = () => {
    const validImages = images.filter(img => img.status === "completed" && img.code && img.senderName && img.phoneNumber);
    if (validImages.length === 0) {
      toast({
        title: "لا توجد بيانات صالحة للتصدير",
        description: "يرجى التأكد من إكمال معالجة الصور واستخراج البيانات الأساسية أولاً.",
        variant: "destructive"
      });
      return;
    }
    const savedCount = saveToLocalStorage(validImages);
    if (savedCount > 0) {
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${savedCount} سجل من البيانات إلى ذاكرة المتصفح`
      });
    } else {
      toast({
        title: "فشل التصدير",
        description: "لم يتم تصدير أي بيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // نسخ البيانات إلى الحافظة
  const handleCopyToClipboard = (format: string) => {
    const items = getExportableItems();
    if (!items) {
      toast({
        title: "لا توجد بيانات صالحة للنسخ",
        description: "يرجى التأكد من إكمال معالجة الصور واستخراج البيانات الأساسية أولاً.",
        variant: "destructive"
      });
      return;
    }
    let content = "";
    switch (format) {
      case "csv":
        content = convertToCSV(items);
        break;
      case "json":
        content = convertToJSON(items);
        break;
      case "excel":
        content = convertToExcel(items);
        break;
      default:
        content = convertToCSV(items);
    }
    navigator.clipboard.writeText(content).then(() => {
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
      toast({
        title: "تم النسخ",
        description: `تم نسخ البيانات بتنسيق ${format.toUpperCase()} إلى الحافظة`
      });
    }).catch(err => {
      toast({
        title: "فشل النسخ",
        description: "حدث خطأ أثناء محاولة نسخ البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      console.error("فشل نسخ النص:", err);
    });
  };

  // تنزيل البيانات كملف
  const handleDownloadFile = (format: string) => {
    const items = getExportableItems();
    if (!items) {
      toast({
        title: "لا توجد بيانات صالحة للتنزيل",
        description: "يرجى التأكد من إكمال معالجة الصور واستخراج البيانات الأساسية أولاً.",
        variant: "destructive"
      });
      return;
    }
    let content = "";
    let mimeType = "";
    let extension = "";
    switch (format) {
      case "csv":
        content = convertToCSV(items);
        mimeType = "text/csv";
        extension = "csv";
        break;
      case "json":
        content = convertToJSON(items);
        mimeType = "application/json";
        extension = "json";
        break;
      case "excel":
        content = convertToExcel(items);
        mimeType = "text/csv";
        extension = "csv";
        break;
      default:
        content = convertToCSV(items);
        mimeType = "text/csv";
        extension = "csv";
    }
    const blob = new Blob([content], {
      type: mimeType
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    link.download = `بيانات_الشحنات_${dateStr}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "تم التنزيل",
      description: `تم تنزيل البيانات بتنسيق ${format.toUpperCase()}`
    });
  };

  // تنسيق عدد العناصر الصالحة للتصدير
  const getValidItemsCount = () => {
    return images.filter(img => img.status === "completed" && img.code && img.senderName && img.phoneNumber).length;
  };

  return (
    <div className="space-y-4">
      {/* معلومات البيانات المتاحة */}
      <Alert className="bg-primary/5 border-primary/20">
        <FileText className="h-4 w-4" />
        <AlertTitle>البيانات المتاحة للتصدير</AlertTitle>
        <AlertDescription>
          لديك <span className="font-bold">{getValidItemsCount()}</span> سجل مكتمل من إجمالي {images.length} سجل جاهز للتصدير.
        </AlertDescription>
      </Alert>

      {/* أدوات التصدير */}
      <Tabs defaultValue="csv" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="csv">CSV</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="excel">Excel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="csv" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Button 
              onClick={() => handleCopyToClipboard("csv")} 
              className="flex-1"
              variant={copiedFormat === "csv" ? "secondary" : "default"}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copiedFormat === "csv" ? "تم النسخ!" : "نسخ CSV إلى الحافظة"}
            </Button>
            <Button 
              onClick={() => handleDownloadFile("csv")} 
              variant="outline" 
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              تنزيل ملف CSV
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Button 
              onClick={() => handleCopyToClipboard("json")} 
              className="flex-1"
              variant={copiedFormat === "json" ? "secondary" : "default"}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copiedFormat === "json" ? "تم النسخ!" : "نسخ JSON إلى الحافظة"}
            </Button>
            <Button 
              onClick={() => handleDownloadFile("json")} 
              variant="outline" 
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              تنزيل ملف JSON
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="excel" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Button 
              onClick={() => handleCopyToClipboard("excel")} 
              className="flex-1"
              variant={copiedFormat === "excel" ? "secondary" : "default"}
            >
              <Table className="mr-2 h-4 w-4" />
              {copiedFormat === "excel" ? "تم النسخ!" : "نسخ بيانات Excel"}
            </Button>
            <Button 
              onClick={() => handleDownloadFile("excel")} 
              variant="outline" 
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              تنزيل لـ Excel
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />
      
      {/* زر تصدير البيانات إلى ذاكرة المتصفح */}
      <Button 
        onClick={handleExportToStorage} 
        className="w-full bg-brand-green hover:bg-brand-green/90"
      >
        <Save className="mr-2 h-4 w-4" />
        حفظ البيانات في ذاكرة المتصفح
      </Button>

      {/* تنبيه في حالة عدم وجود سجلات */}
      {getValidItemsCount() === 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>لا توجد بيانات للتصدير</AlertTitle>
          <AlertDescription>
            يرجى معالجة صورة واحدة على الأقل واستخراج البيانات الأساسية (الكود، اسم المرسل، رقم الهاتف) قبل التصدير.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

const Code = ({
  className,
  ...props
}: React.HTMLAttributes<SVGElement>) => {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>;
};

export default DirectExportTools;
