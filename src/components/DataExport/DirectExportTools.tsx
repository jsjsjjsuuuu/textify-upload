
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

const DirectExportTools: React.FC<DirectExportToolsProps> = ({ images }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("csv");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // تحويل صور الإدخال إلى تنسيق قابل للتصدير
  const getExportableItems = () => {
    const validImages = images.filter(img => 
      img.status === "completed" && img.code && img.senderName && img.phoneNumber
    );
    
    if (validImages.length === 0) {
      return null;
    }
    
    return convertImagesToBookmarkletItems(validImages);
  };
  
  // تصدير إلى تخزين المتصفح
  const handleExportToStorage = () => {
    const validImages = images.filter(img => 
      img.status === "completed" && img.code && img.senderName && img.phoneNumber
    );
    
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
        description: `تم تصدير ${savedCount} سجل من البيانات إلى ذاكرة المتصفح`,
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
        description: `تم نسخ البيانات بتنسيق ${format.toUpperCase()} إلى الحافظة`,
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
    
    const blob = new Blob([content], { type: mimeType });
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
      description: `تم تنزيل البيانات بتنسيق ${format.toUpperCase()}`,
    });
  };

  // تنسيق عدد العناصر الصالحة للتصدير
  const getValidItemsCount = () => {
    return images.filter(img => 
      img.status === "completed" && img.code && img.senderName && img.phoneNumber
    ).length;
  };

  return (
    <div className="space-y-4">
      <div className="bg-secondary/30 dark:bg-secondary/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-brand-brown dark:text-brand-beige mb-2">
          أدوات التصدير المباشر
        </h3>
        
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            تسمح لك هذه الأدوات بتصدير البيانات المستخرجة بتنسيقات مختلفة مباشرة
          </p>
          <Button
            onClick={handleExportToStorage}
            className="bg-brand-green hover:bg-brand-green/90"
            disabled={getValidItemsCount() === 0}
          >
            <Save className="h-4 w-4 ml-2" />
            حفظ في المتصفح
          </Button>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 ml-2" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">العناصر الجاهزة للتصدير: {getValidItemsCount()}</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                فقط العناصر المكتملة والتي تحتوي على البيانات الأساسية (الكود، اسم المرسل، رقم الهاتف) ستظهر في ملف التصدير.
              </p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="csv" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="csv" className="flex-1">
              <FileText className="h-4 w-4 ml-2" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              <Code className="h-4 w-4 ml-2" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex-1">
              <Table className="h-4 w-4 ml-2" />
              Excel
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="csv" className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">تنسيق CSV</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                يمكن استيراد هذا التنسيق في برامج مثل Excel وGoogle Sheets ومعظم برامج قواعد البيانات.
              </AlertDescription>
            </Alert>
            
            <div className="flex space-x-3 space-x-reverse">
              <Button 
                onClick={() => handleCopyToClipboard('csv')} 
                variant="outline" 
                className="flex-1"
                disabled={getValidItemsCount() === 0}
              >
                <Copy className="h-4 w-4 ml-2" />
                {copiedFormat === 'csv' ? 'تم النسخ!' : 'نسخ إلى الحافظة'}
              </Button>
              
              <Button 
                onClick={() => handleDownloadFile('csv')} 
                className="flex-1"
                disabled={getValidItemsCount() === 0}
              >
                <Download className="h-4 w-4 ml-2" />
                تنزيل CSV
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="json" className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">تنسيق JSON</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                تنسيق مناسب للمطورين والاستيراد إلى الأنظمة البرمجية والتطبيقات.
              </AlertDescription>
            </Alert>
            
            <div className="flex space-x-3 space-x-reverse">
              <Button 
                onClick={() => handleCopyToClipboard('json')} 
                variant="outline" 
                className="flex-1"
                disabled={getValidItemsCount() === 0}
              >
                <Copy className="h-4 w-4 ml-2" />
                {copiedFormat === 'json' ? 'تم النسخ!' : 'نسخ إلى الحافظة'}
              </Button>
              
              <Button 
                onClick={() => handleDownloadFile('json')} 
                className="flex-1"
                disabled={getValidItemsCount() === 0}
              >
                <Download className="h-4 w-4 ml-2" />
                تنزيل JSON
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="excel" className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">تنسيق Excel</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                تنسيق CSV متوافق مع Excel، مناسب للمستخدمين الذين يرغبون في معالجة البيانات في Microsoft Excel.
              </AlertDescription>
            </Alert>
            
            <div className="flex space-x-3 space-x-reverse">
              <Button 
                onClick={() => handleCopyToClipboard('excel')} 
                variant="outline" 
                className="flex-1"
                disabled={getValidItemsCount() === 0}
              >
                <Copy className="h-4 w-4 ml-2" />
                {copiedFormat === 'excel' ? 'تم النسخ!' : 'نسخ إلى الحافظة'}
              </Button>
              
              <Button 
                onClick={() => handleDownloadFile('excel')} 
                className="flex-1"
                disabled={getValidItemsCount() === 0}
              >
                <Download className="h-4 w-4 ml-2" />
                تنزيل لـ Excel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="bg-secondary/30 dark:bg-secondary/20 rounded-lg p-4">
        <h3 className="text-md font-semibold text-brand-brown dark:text-brand-beige mb-2">
          إرشادات استخدام الملفات المصدرة
        </h3>
        
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>يمكنك فتح ملفات CSV في Excel أو Google Sheets بالنقر المزدوج عليها</li>
          <li>ملفات JSON مفيدة للمطورين ويمكن استيرادها في التطبيقات</li>
          <li>لضمان ظهور النص العربي بشكل صحيح في Excel، قم باستيراد الملف بدلاً من فتحه مباشرة</li>
          <li>تأكد من اختيار ترميز UTF-8 عند استيراد البيانات التي تحتوي على نصوص عربية</li>
        </ul>
        
        <Separator className="my-4" />
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => {
              window.open('https://support.microsoft.com/ar-sa/office/استيراد-أو-تصدير-ملفات-نصية-txt-أو-csv-5250ac4c-663c-47ce-937b-339e391393ba', '_blank');
            }}
          >
            <Upload className="h-3 w-3 ml-1" />
            شرح استيراد CSV إلى Excel
          </Button>
        </div>
      </div>
    </div>
  );
};

const Code = ({ className, ...props }: React.HTMLAttributes<SVGElement>) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      {...props}
    >
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );
};

export default DirectExportTools;
