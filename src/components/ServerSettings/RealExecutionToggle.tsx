
import React from "react";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, AlertTriangle, Server, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AutomationService } from "@/utils/automationService";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";
import { toast } from "sonner";

const RealExecutionToggle: React.FC = () => {
  const [isEnabled, setIsEnabled] = React.useState(() => AutomationService.isRealExecutionEnabled());
  const [isConnecting, setIsConnecting] = React.useState(false);
  
  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    AutomationService.toggleRealExecution(checked);
    
    if (checked) {
      // محاولة الاتصال بالخادم الحقيقي عند تفعيل الخيار
      checkServerConnection();
    }
  };
  
  const checkServerConnection = async () => {
    setIsConnecting(true);
    toast.info("جاري التحقق من الاتصال بالخادم الحقيقي...");
    
    try {
      const result = await AutomationService.forceReconnect();
      if (result) {
        toast.success("تم الاتصال بخادم الأتمتة بنجاح! يمكنك الآن تنفيذ الأتمتة بشكل فعلي.");
      } else {
        toast.error("تعذر الاتصال بخادم الأتمتة. تأكد من تشغيل الخادم وإمكانية الوصول إليه.");
      }
    } catch (error) {
      console.error("خطأ في الاتصال بالخادم:", error);
      toast.error(`تعذر الاتصال بخادم الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // إذا لم نكن في بيئة المعاينة، لا نعرض هذا المكون
  if (!isPreviewEnvironment()) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md border border-amber-200">
        <div className="space-y-1">
          <h3 className="font-medium flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-amber-600" />
            وضع التنفيذ الفعلي
          </h3>
          <p className="text-sm text-muted-foreground">
            عند تفعيل هذا الخيار، سيتم محاولة الاتصال بالخادم الحقيقي وتنفيذ الأتمتة فعلياً.
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          aria-label="تفعيل وضع التنفيذ الفعلي"
        />
      </div>
      
      {isEnabled && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-medium mb-2">
            وضع التنفيذ الفعلي نشط الآن
          </AlertTitle>
          <AlertDescription className="text-amber-800">
            <p className="mb-3">
              سيتم محاولة الاتصال بالخادم الحقيقي وتنفيذ الأتمتة فعلياً على المواقع المستهدفة. تأكد من:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3 text-sm">
              <li>تشغيل خادم الأتمتة وإمكانية الوصول إليه من الإنترنت</li>
              <li>الاتصال بالخادم باستخدام عنوان URL صحيح</li>
              <li>عدم وجود حظر CORS على الخادم</li>
              <li>تكوين المتصفح للسماح بالاتصالات</li>
            </ul>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={checkServerConnection}
                disabled={isConnecting}
                className="bg-white hover:bg-amber-50"
              >
                <Server className={`h-4 w-4 mr-2 ${isConnecting ? 'hidden' : 'inline'}`} />
                <RefreshCw className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin inline' : 'hidden'}`} />
                {isConnecting ? 'جاري التحقق من الاتصال...' : 'التحقق من اتصال الخادم الحقيقي'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RealExecutionToggle;
