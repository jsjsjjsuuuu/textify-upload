
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, InfoIcon, CheckCircle, XCircle, Server, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const getEnhancedErrorMessage = (error: string): { message: string, suggestions: string[] } => {
    // الأخطاء المتعلقة بالشبكة
    if (error.includes("NetworkError") || error.includes("Failed to fetch") || error.includes("network")) {
      return {
        message: "خطأ في الشبكة: تعذر الاتصال بالخادم. تأكد من اتصال الإنترنت الخاص بك.",
        suggestions: [
          "تأكد من اتصالك بالإنترنت",
          "تحقق من تشغيل خادم الأتمتة",
          "قد يكون الخادم غير متاح مؤقتًا، حاول مرة أخرى لاحقًا"
        ]
      };
    } 
    // الأخطاء المتعلقة بالوقت
    else if (error.includes("timeout") || error.includes("timed out")) {
      return {
        message: "انتهت مهلة الاتصال: استغرقت العملية وقتاً طويلاً. قد يكون الخادم بطيئاً أو مشغولاً.",
        suggestions: [
          "الموقع المستهدف قد يكون بطيئًا جدًا",
          "قد يكون الخادم مشغولاً بطلبات أخرى",
          "حاول مرة أخرى عندما يكون الحمل على الخادم أقل"
        ]
      };
    } 
    // الأخطاء المتعلقة بمحددات العناصر
    else if (error.includes("selector") || error.includes("element not found") || error.includes("عنصر")) {
      return {
        message: "خطأ في المحدد: تعذر العثور على العنصر في الصفحة. تأكد من صحة المحدد.",
        suggestions: [
          "تأكد من صحة محددات CSS",
          "قد تكون بنية الصفحة المستهدفة تغيرت",
          "جرب استخدام محددات أكثر تحديدًا أو أكثر عمومية"
        ]
      };
    } 
    // الأخطاء المتعلقة بسياسة CORS
    else if (error.includes("CORS")) {
      return {
        message: "خطأ CORS: مشكلة في سياسة مشاركة الموارد عبر الأصول. قد يكون الخادم يمنع الوصول.",
        suggestions: [
          "تحقق من إعدادات CORS على الخادم",
          "قد يكون الموقع المستهدف يمنع الطلبات من خوادم أخرى",
          "تواصل مع المسؤول عن خادم الأتمتة"
        ]
      };
    } 
    // الأخطاء المتعلقة بالتوثيق
    else if (error.includes("auth") || error.includes("login") || error.includes("session") || error.includes("تسجيل الدخول")) {
      return {
        message: "خطأ في التوثيق: يبدو أن الموقع يطلب تسجيل الدخول أو انتهت صلاحية الجلسة.",
        suggestions: [
          "تأكد من تمكين خيار استخدام بيانات المتصفح",
          "قد تحتاج إلى تسجيل الدخول يدويًا على الموقع المستهدف أولاً",
          "تحقق من صلاحية جلستك على الموقع المستهدف"
        ]
      };
    } 
    // الأخطاء المتعلقة بالكابتشا
    else if (error.includes("captcha") || error.includes("robot") || error.includes("automated")) {
      return {
        message: "تم اكتشاف الأتمتة: يبدو أن الموقع يكتشف المتصفح الآلي أو يطلب حل كابتشا.",
        suggestions: [
          "قد تحتاج إلى تنفيذ العملية يدويًا",
          "حاول إبطاء الإجراءات بزيادة التأخير بين الخطوات",
          "بعض المواقع تمنع الأتمتة بشكل صارم"
        ]
      };
    }
    
    // الأخطاء الأخرى
    return {
      message: error,
      suggestions: [
        "حاول مرة أخرى لاحقًا",
        "تحقق من سجلات التشخيص (Console) لمزيد من المعلومات"
      ]
    };
  };

  if (!isRunning && !serverError) return null;
  
  // الحصول على معلومات الخطأ المحسنة
  const errorInfo = serverError ? getEnhancedErrorMessage(serverError) : null;
  
  return (
    <div className="space-y-4">
      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-600 animate-pulse" />
              <span className="font-medium">{automationStatus}</span>
              
              {/* إضافة شارة توضح أن التنفيذ حقيقي */}
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                متصفح حقيقي
              </Badge>
            </div>
            <span className="font-bold">{automationProgress}%</span>
          </div>
          <Progress value={automationProgress} className="h-2" />
          
          {/* إضافة رسائل توضيحية متعددة خلال مراحل التنفيذ */}
          {automationProgress < 30 && (
            <Alert className="mt-2 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                جاري الاتصال بالخادم وتجهيز المتصفح. قد تستغرق هذه الخطوة بعض الوقت.
              </AlertDescription>
            </Alert>
          )}
          
          {automationProgress >= 30 && automationProgress < 60 && (
            <Alert className="mt-2 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                جاري تحميل الموقع المستهدف وتنفيذ الإجراءات. انتظر من فضلك...
              </AlertDescription>
            </Alert>
          )}
          
          {automationProgress >= 60 && automationProgress < 100 && (
            <Alert className="mt-2 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                جاري إكمال الإجراءات وتجميع النتائج. اقتربنا من الانتهاء...
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      {serverError && (
        <Alert variant="destructive" className="bg-red-50 border-red-300">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 mb-2 font-medium">فشل تنفيذ الأتمتة</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-red-700">{errorInfo?.message}</p>
            
            {/* إضافة اقتراحات للتعامل مع الخطأ */}
            {errorInfo?.suggestions && errorInfo.suggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-800 mb-1">اقتراحات للحل:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-red-700">
                  {errorInfo.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-xs mt-2 opacity-80 text-red-700">رمز الخطأ الأصلي: {serverError}</p>
          </AlertDescription>
        </Alert>
      )}
      
      {/* إضافة رسالة نجاح عند اكتمال التنفيذ */}
      {!isRunning && !serverError && automationProgress === 100 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">تم تنفيذ الأتمتة بنجاح</AlertTitle>
          <AlertDescription className="text-green-700">
            اكتملت جميع الإجراءات بنجاح. يمكنك الآن مشاهدة النتائج.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExecutionStatus;
