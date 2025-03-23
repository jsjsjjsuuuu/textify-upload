
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const RequireErrorFix: React.FC = () => {
  const refreshPage = () => {
    toast.info("جاري تحديث الصفحة...", {
      description: "سيتم تحديث الصفحة لتطبيق الإصلاحات الجديدة"
    });
    
    // إضافة تأخير بسيط لعرض التنبيه قبل إعادة التحميل
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };
  
  return (
    <Alert className="bg-blue-50 border-blue-200 my-4">
      <AlertTriangle className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-blue-800 mb-2">معلومات هامة حول خطأ require</AlertTitle>
      <AlertDescription className="text-blue-700">
        <p className="mb-2">
          إذا كنت تواجه خطأ <code className="bg-blue-100 px-1 rounded">require is not defined</code>،
          فهذا لأن الوظيفة <code className="bg-blue-100 px-1 rounded">require</code> غير متاحة في متصفحات الويب.
        </p>
        <p className="mb-2">
          لقد أضفنا إصلاحًا لهذه المشكلة، ويجب أن يعمل الآن بعد تحديث الصفحة.
          إذا استمرت المشكلة، يرجى تجربة أسلوب البوكماركلت بدلاً من ذلك.
        </p>
        <div className="mt-3">
          <Button variant="outline" 
            className="bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800" 
            onClick={refreshPage}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            تحديث الصفحة لتطبيق الإصلاح
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <div className="flex items-start">
            <Info className="mt-1 mr-2 h-4 w-4 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              <strong>نصيحة:</strong> للحصول على أفضل النتائج مع محددات XPath، تأكد من استخدام الصيغة الصحيحة مثل:
              <code dir="ltr" className="block bg-yellow-100 p-2 mt-1 rounded text-xs">
                //input[@placeholder="القيمة"]
              </code>
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default RequireErrorFix;
