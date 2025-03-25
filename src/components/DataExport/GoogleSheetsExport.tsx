
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

interface GoogleSheetsExportProps {
  images: ImageData[];
}

const GoogleSheetsExport: React.FC<GoogleSheetsExportProps> = () => {
  const { toast } = useToast();
  
  // إشعار المستخدم أن وظائف Google Sheets معطلة
  const notifyDisabled = () => {
    toast({
      title: "وظيفة معطلة",
      description: "تم تعطيل وظائف Google Sheets في هذا الإصدار",
      variant: "destructive"
    });
  };
  
  return (
    <Card className="bg-secondary/30 dark:bg-secondary/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 ml-2 text-gray-500" />
          <CardTitle className="text-lg text-brand-brown dark:text-brand-beige">تصدير إلى Google Sheets</CardTitle>
        </div>
        <CardDescription>
          تم تعطيل وظائف Google Sheets في هذا الإصدار
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            تم تعطيل وظيفة تصدير البيانات إلى Google Sheets. يرجى استخدام طرق التصدير الأخرى المتاحة.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsExport;
