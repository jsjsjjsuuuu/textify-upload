
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import { ImageData } from "@/types/ImageData";

interface AutofillReportProps {
  imageData: ImageData;
}

const AutofillReportComponent: React.FC<AutofillReportProps> = ({ imageData }) => {
  if (!imageData.autoFillResult || imageData.autoFillResult.length === 0) {
    return null;
  }

  // آخر نتيجة للإدخال التلقائي
  const latestResult = imageData.autoFillResult[imageData.autoFillResult.length - 1];
  
  // عدد المحاولات الإجمالية
  const totalAttempts = imageData.autoFillResult.length;
  
  // عدد المحاولات الناجحة
  const successfulAttempts = imageData.autoFillResult.filter(result => result.success).length;

  return (
    <Card className="mt-4 border-border/40 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {latestResult.success ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          تقرير الإدخال التلقائي
        </CardTitle>
        <CardDescription>
          شركة: {latestResult.company}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 pt-0">
        <div className="flex justify-between mb-2">
          <Badge variant={latestResult.success ? "success" : "destructive"} className="ml-2">
            {latestResult.success ? "ناجح" : "فاشل"}
          </Badge>
          <span className="text-sm text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(latestResult.timestamp).toLocaleString("ar-IQ")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="border rounded p-2">
            <span className="text-muted-foreground">الحقول المكتشفة:</span>
            <span className="font-medium block">{latestResult.fieldsFound}</span>
          </div>
          <div className="border rounded p-2">
            <span className="text-muted-foreground">الحقول المملوءة:</span>
            <span className="font-medium block">{latestResult.fieldsFilled}</span>
          </div>
        </div>

        {latestResult.error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>
              {latestResult.error}
            </AlertDescription>
          </Alert>
        )}

        {totalAttempts > 1 && (
          <div className="mt-2 text-sm text-muted-foreground">
            عدد المحاولات: {totalAttempts} (ناجحة: {successfulAttempts})
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutofillReportComponent;
