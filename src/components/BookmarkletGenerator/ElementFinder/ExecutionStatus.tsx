
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, Server } from "lucide-react";
import { isRequireError } from "@/utils/automation";
import RequireErrorFix from "@/components/ServerAutomation/RequireErrorFix";
import NetworkErrorHandler from "@/components/ServerAutomation/NetworkErrorHandler";

interface ExecutionStatusProps {
  isRunning: boolean;
  automationProgress: number;
  automationStatus: string;
  serverError: string | null;
  onRetry?: () => void;
  targetUrl?: string;
}

const ExecutionStatus: React.FC<ExecutionStatusProps> = ({
  isRunning,
  automationProgress,
  automationStatus,
  serverError,
  onRetry,
  targetUrl
}) => {
  // التحقق مما إذا كان الخطأ متعلقًا بدالة require
  const isRequireIssue = serverError ? isRequireError(serverError) : false;
  
  // التحقق مما إذا كان الخطأ متعلقًا بالشبكة
  const isNetworkError = serverError && 
    (serverError.includes("fetch") || 
     serverError.includes("network") || 
     serverError.includes("Failed to fetch") ||
     serverError.includes("NetworkError") ||
     serverError.includes("CORS") ||
     serverError.includes("خطأ في الاتصال") ||
     serverError.includes("تعذر الاتصال"));
  
  if (!isRunning && !serverError && automationProgress === 0) {
    return null;
  }

  if (isRunning || automationProgress > 0) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
          <span>{automationStatus || "جاري التنفيذ..."}</span>
          <span>{automationProgress}%</span>
        </div>
        <Progress value={automationProgress} className="h-2" />
      </div>
    );
  }

  if (serverError) {
    // عرض مكون إصلاح خطأ require إذا كان الخطأ متعلقًا بدالة require
    if (isRequireIssue) {
      return <RequireErrorFix />;
    }
    
    // عرض مكون معالجة أخطاء الشبكة إذا كان الخطأ متعلقًا بالشبكة
    if (isNetworkError) {
      return (
        <NetworkErrorHandler 
          errorMessage={serverError}
          onRetry={onRetry || (() => window.location.reload())}
          url={targetUrl}
        />
      );
    }
    
    // عرض خطأ عام للأخطاء الأخرى
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>فشل تنفيذ الأتمتة</AlertTitle>
        <AlertDescription>
          {serverError}
        </AlertDescription>
      </Alert>
    );
  }

  // عرض رسالة نجاح
  if (automationProgress === 100) {
    return (
      <Alert className="bg-green-50 border-green-200 mt-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">تم التنفيذ بنجاح</AlertTitle>
        <AlertDescription className="text-green-700">
          تم تنفيذ الأتمتة بنجاح على الخادم.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert className="bg-blue-50 border-blue-200 mt-2">
      <Server className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">جاهز للتنفيذ</AlertTitle>
      <AlertDescription className="text-blue-700">
        التطبيق جاهز لتنفيذ الأتمتة. انقر على زر "تنفيذ الأتمتة" للبدء.
      </AlertDescription>
    </Alert>
  );
};

export default ExecutionStatus;
