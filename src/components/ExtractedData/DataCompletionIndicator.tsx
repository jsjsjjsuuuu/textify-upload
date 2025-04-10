
import React from "react";
import { ImageData } from "@/types/ImageData";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

interface DataCompletionIndicatorProps {
  image: ImageData & { timestamp?: number };
}

const DataCompletionIndicator = ({ image }: DataCompletionIndicatorProps) => {
  // الحقول الإلزامية
  const requiredFields = ["code", "senderName", "province", "price"];
  const optionalFields = ["phoneNumber", "companyName"];

  // التحقق من الحقول المطلوبة
  const filledRequiredFields = requiredFields.filter(field => Boolean(image[field as keyof ImageData])).length;
  const filledOptionalFields = optionalFields.filter(field => Boolean(image[field as keyof ImageData])).length;

  // حساب نسبة الاكتمال
  const requiredPercentage = (filledRequiredFields / requiredFields.length) * 100;
  
  // التحقق من صحة رقم الهاتف
  const hasPhoneError = Boolean(image.phoneNumber) && image.phoneNumber.replace(/[^\d]/g, '').length !== 11;

  // تحديد حالة البيانات
  const isComplete = requiredPercentage === 100 && !hasPhoneError;
  const isPartial = requiredPercentage > 0 && requiredPercentage < 100;
  const isEmpty = requiredPercentage === 0;
  const isSubmitted = Boolean(image.submitted);
  const isProcessing = image.status === "processing";
  const hasError = image.status === "error" || hasPhoneError;

  // تحديد لون شريط التقدم ورسالة الحالة
  let progressColor = "";
  let statusMessage = "";
  let statusIcon = null;

  if (isProcessing) {
    progressColor = "bg-blue-500";
    statusMessage = "جاري معالجة الصورة...";
    statusIcon = <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
  } else if (isSubmitted) {
    progressColor = "bg-green-600";
    statusMessage = "تم إرسال البيانات بنجاح";
    statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
  } else if (hasError) {
    progressColor = "bg-red-500";
    statusMessage = hasPhoneError ? "خطأ في رقم الهاتف" : "حدث خطأ أثناء معالجة الصورة";
    statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />;
  } else if (isComplete) {
    progressColor = "bg-green-500";
    statusMessage = "البيانات مكتملة";
    statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
  } else if (isPartial) {
    progressColor = "bg-red-500"; // تغيير اللون إلى الأحمر للبيانات غير المكتملة
    statusMessage = "البيانات غير مكتملة";
    statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />;
  } else if (isEmpty) {
    progressColor = "bg-gray-300 dark:bg-gray-700";
    statusMessage = "لم يتم استخراج أي بيانات";
    statusIcon = <AlertCircle className="h-4 w-4 text-gray-500" />;
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs text-muted-foreground flex items-center">
          {statusIcon}
          <span className="mr-1">{statusMessage}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {filledRequiredFields}/{requiredFields.length} (إلزامي) + {filledOptionalFields}/{optionalFields.length} (اختياري)
        </div>
      </div>
      <Progress 
        value={requiredPercentage} 
        max={100} 
        className={`h-1.5 ${progressColor}`}
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {requiredFields.map(field => (
          <span 
            key={field} 
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              image[field as keyof ImageData] 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {field === 'code' ? 'الكود' : 
             field === 'senderName' ? 'اسم المرسل' : 
             field === 'province' ? 'المحافظة' : 
             field === 'price' ? 'السعر' : field}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DataCompletionIndicator;
