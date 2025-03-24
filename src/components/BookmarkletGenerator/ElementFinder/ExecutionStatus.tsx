
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, InfoIcon, CheckCircle, XCircle, Server, Wifi, Clock } from "lucide-react";
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
    // تحسين الكشف عن أنواع الأخطاء المختلفة
    // خطأ require
    if (error.includes("require is not defined") || error.includes("require is not a function") || error.includes("RequireError")) {
      return {
        message: "خطأ في النظام: المتصفح لا يدعم استخدام دالة 'require'",
        suggestions: [
          "هذا خطأ في النظام وليس في الإعدادات الخاصة بك",
          "يرجى الانتظار قليلاً بينما نعمل على إصلاح المشكلة",
          "حاول استخدام أسلوب آخر للأتمتة مثل البوكماركلت",
          "إذا استمرت المشكلة، يرجى التواصل مع فريق الدعم"
        ]
      };
    }
    // أخطاء التكوين
    else if (error.includes("Configuration") || error.includes("config") || error.includes("settings") || error.includes("إعدادات") || error.includes("تكوين")) {
      return {
        message: "خطأ في تكوين الخادم: تأكد من صحة إعدادات الخادم وعنوان URL المستهدف.",
        suggestions: [
          "تحقق من إعدادات الخادم في صفحة إعدادات الخادم",
          "تأكد من صحة عنوان URL المستهدف",
          "تحقق مما إذا كان الموقع المستهدف يتطلب تسجيل الدخول أو له قيود",
          "تأكد من عدم وجود أحرف خاصة في المحددات CSS"
        ]
      };
    }
    
    // الأخطاء المتعلقة بالشبكة
    else if (error.includes("NetworkError") || error.includes("Failed to fetch") || error.includes("network") || error.includes("ERR_CONNECTION")) {
      return {
        message: "خطأ في الشبكة: تعذر الاتصال بالخادم. تأكد من اتصال الإنترنت الخاص بك.",
        suggestions: [
          "تأكد من اتصالك بالإنترنت",
          "انتظر قليلاً وحاول مرة أخرى، قد يكون الخادم في وضع الاستعداد",
          "قد يستغرق تنشيط الخادم حتى 30 ثانية في المرة الأولى"
        ]
      };
    } 
    // الأخطاء المتعلقة بالوقت
    else if (error.includes("timeout") || error.includes("timed out") || error.includes("TIMEOUT")) {
      return {
        message: "انتهت مهلة الاتصال: استغرقت العملية وقتاً طويلاً. قد يكون الموقع المستهدف بطيئاً.",
        suggestions: [
          "حاول مرة أخرى، فقد يكون الموقع المستهدف مشغولاً مؤقتاً",
          "تأكد من صحة رابط URL للموقع المستهدف",
          "قلل عدد الإجراءات وحاول مرة أخرى"
        ]
      };
    } 
    // الأخطاء المتعلقة بمحددات العناصر
    else if (error.includes("selector") || error.includes("element not found") || error.includes("عنصر") || error.includes("Element")) {
      return {
        message: "خطأ في المحدد: تعذر العثور على العنصر في الصفحة. تأكد من صحة المحدد CSS.",
        suggestions: [
          "راجع محددات CSS وتأكد من دقتها",
          "جرب محددات أكثر عمومية مثل '.class' بدلاً من محددات معقدة",
          "تأكد من أن العنصر موجود فعلاً على الصفحة المستهدفة وليس مخفياً"
        ]
      };
    } 
    // الأخطاء المتعلقة بسياسة CORS
    else if (error.includes("CORS") || error.includes("cross-origin")) {
      return {
        message: "خطأ CORS: مشكلة في سياسة مشاركة الموارد عبر الأصول. قد يكون الموقع يمنع الوصول الخارجي.",
        suggestions: [
          "بعض المواقع تمنع الأتمتة من خلال سياسات CORS",
          "جرب استخدام بوكماركليت بدلاً من الأتمتة عبر الخادم",
          "تواصل مع مسؤول الموقع المستهدف إذا كان متاحاً"
        ]
      };
    } 
    // الأخطاء المتعلقة بالتوثيق
    else if (error.includes("auth") || error.includes("login") || error.includes("session") || error.includes("تسجيل الدخول")) {
      return {
        message: "خطأ في التوثيق: يبدو أن الموقع يطلب تسجيل الدخول أو انتهت صلاحية الجلسة.",
        suggestions: [
          "قد تحتاج إلى تسجيل الدخول يدويًا على الموقع المستهدف أولاً",
          "بعض المواقع لا تسمح بالأتمتة للمستخدمين غير المسجلين",
          "تأكد من إضافة خطوات تسجيل الدخول في بداية الأتمتة"
        ]
      };
    } 
    // الأخطاء المتعلقة بالكابتشا
    else if (error.includes("captcha") || error.includes("robot") || error.includes("automated") || error.includes("BOT_DETECTION")) {
      return {
        message: "تم اكتشاف الأتمتة: الموقع يكتشف المتصفح الآلي أو يطلب حل كابتشا.",
        suggestions: [
          "زد التأخير بين الإجراءات لجعل السلوك أكثر شبهاً بالإنسان",
          "قلل عدد الإجراءات المتكررة في وقت قصير",
          "بعض المواقع تستخدم تقنيات متقدمة لمنع الأتمتة"
        ]
      };
    }
    // خطأ في رابط URL
    else if (error.includes("URL") || error.includes("http") || error.includes("https") || error.includes("invalid URL")) {
      return {
        message: "خطأ في رابط الموقع المستهدف",
        suggestions: [
          "تأكد من صحة رابط URL وأنه يبدأ بـ http:// أو https://",
          "تأكد من أن الموقع المستهدف متاح ويمكن الوصول إليه",
          "جرب فتح الرابط في المتصفح للتأكد من عمله"
        ]
      };
    }
    // أخطاء الوحدات
    else if (error.includes("module") || error.includes("ModuleError")) {
      return {
        message: "خطأ في تحميل الوحدات: لا يمكن تحميل بعض المكتبات اللازمة.",
        suggestions: [
          "هذا خطأ في النظام وليس في الإعدادات الخاصة بك",
          "يرجى الانتظار قليلاً بينما نعمل على إصلاح المشكلة",
          "حاول استخدام أسلوب آخر للأتمتة مثل البوكماركلت"
        ]
      };
    }
    
    // الأخطاء الأخرى
    return {
      message: error,
      suggestions: [
        "حاول مرة أخرى بعد بضع دقائق",
        "تحقق من سجلات وحدة التحكم للمزيد من التفاصيل",
        "قد تحتاج إلى تبسيط الإجراءات أو تقليل عددها"
      ]
    };
  };

  if (!isRunning && !serverError && automationProgress !== 100) return null;
  
  // الحصول على معلومات الخطأ المحسنة
  const errorInfo = serverError ? getEnhancedErrorMessage(serverError) : null;
  
  // حساب وقت التنفيذ المقدر
  const estimatedTimeRemaining = () => {
    if (automationProgress >= 100) return "0";
    if (automationProgress <= 0) return "?";
    
    // تقدير الوقت المتبقي بناءً على النسبة المكتملة
    const remaining = Math.ceil((100 - automationProgress) / 10);
    return `~${remaining}`;
  };
  
  return (
    <div className="space-y-4">
      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-green-600 animate-pulse" />
              <span className="font-medium">{automationStatus}</span>
              
              {/* شارة توضح أن التنفيذ حقيقي */}
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                متصفح حقيقي
              </Badge>
              
              {/* شارة لوقت التنفيذ المقدر */}
              <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-700 border-blue-200 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                الوقت المتبقي: {estimatedTimeRemaining()} ثوان
              </Badge>
            </div>
            <span className="font-bold">{automationProgress}%</span>
          </div>
          <Progress value={automationProgress} className="h-2" />
          
          {/* رسائل توضيحية متعددة خلال مراحل التنفيذ */}
          {automationProgress < 30 && (
            <Alert className="mt-2 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                جاري تجهيز المتصفح على الخادم وفتح نافذة جديدة. قد يستغرق هذا من 5-30 ثانية خاصة في المرة الأولى.
              </AlertDescription>
            </Alert>
          )}
          
          {automationProgress >= 30 && automationProgress < 60 && (
            <Alert className="mt-2 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                جاري تحميل الموقع المستهدف والتحضير لتنفيذ الإجراءات. انتظر من فضلك...
              </AlertDescription>
            </Alert>
          )}
          
          {automationProgress >= 60 && automationProgress < 100 && (
            <Alert className="mt-2 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                جاري تنفيذ الإجراءات على الموقع المستهدف. اقتربنا من الانتهاء...
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
            
            {/* اقتراحات للتعامل مع الخطأ */}
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
            
            {/* رسالة دعم إضافية للأخطاء الخاصة بوظيفة require */}
            {serverError.includes("require is not defined") || serverError.includes("RequireError") || serverError.includes("ModuleError") && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>ملاحظة مهمة:</strong> يحاول النظام استخدام دوال خاصة بالخادم في المتصفح، وهذا قد يؤدي إلى أخطاء. نحن نعمل على إصلاح هذه المشكلة.
                </p>
              </div>
            )}
            
            {/* إضافة اقتراح محدد للتحقق من إعدادات الخادم في حالة الأخطاء المتعلقة بالتكوين */}
            {serverError.includes("Configuration") || serverError.includes("config") || 
             serverError.includes("settings") || serverError.includes("تكوين") && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>نصيحة:</strong> يرجى زيارة صفحة إعدادات الخادم والتحقق من عنوان URL الخاص بخادم الأتمتة.
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* رسالة نجاح عند اكتمال التنفيذ */}
      {!isRunning && !serverError && automationProgress === 100 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">تم تنفيذ الأتمتة بنجاح</AlertTitle>
          <AlertDescription className="text-green-700">
            اكتملت جميع الإجراءات بنجاح. يمكنك الآن مشاهدة النتائج أو حفظ الإجراءات للاستخدام لاحقاً.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExecutionStatus;
