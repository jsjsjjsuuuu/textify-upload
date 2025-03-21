
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, InfoIcon } from "lucide-react";

interface ExecutionStatusProps {
  isRunning: boolean;
  automationProgress: number;
  automationStatus: string;
  serverError: string | null;
}

const ExecutionStatus: React.FC<ExecutionStatusProps> = ({
  isRunning,
  automationProgress,
  automationStatus,
  serverError,
}) => {
  // تحويل رسائل الخطأ المعروفة إلى رسائل أكثر وضوحاً
  const getEnhancedErrorMessage = (error: string): string => {
    if (error.includes("NetworkError") || error.includes("Failed to fetch")) {
      return "خطأ في الشبكة: تعذر الاتصال بالخادم. تأكد من اتصال الإنترنت الخاص بك.";
    } else if (error.includes("timeout") || error.includes("timed out")) {
      return "انتهت مهلة الاتصال: استغرقت العملية وقتاً طويلاً. قد يكون الخادم بطيئاً أو مشغولاً.";
    } else if (error.includes("selector") || error.includes("element not found")) {
      return "خطأ في المحدد: تعذر العثور على العنصر في الصفحة. تأكد من صحة المحدد.";
    } else if (error.includes("CORS")) {
      return "خطأ CORS: مشكلة في سياسة مشاركة الموارد عبر الأصول. قد يكون الخادم يمنع الوصول.";
    }
    return error;
  };

  if (!isRunning && !serverError) return null;
  
  return (
    <div className="space-y-4">
      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{automationStatus}</span>
            <span>{automationProgress}%</span>
          </div>
          <Progress value={automationProgress} className="h-2" />
          
          {/* إضافة رسالة توضيحية إضافية */}
          <Alert className="mt-2 bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700">
              العملية قد تستغرق بعض الوقت إذا كان المتصفح يحتاج إلى بدء التشغيل على الخادم. يرجى الانتظار بصبر.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {serverError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>فشل تنفيذ الأتمتة</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{getEnhancedErrorMessage(serverError)}</p>
            <p className="text-xs mt-1 opacity-90">رمز الخطأ الأصلي: {serverError}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExecutionStatus;
