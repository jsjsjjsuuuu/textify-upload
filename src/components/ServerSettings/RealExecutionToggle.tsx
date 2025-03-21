
import React from "react";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AutomationService } from "@/utils/automationService";
import { isPreviewEnvironment } from "@/utils/automationServerUrl";

const RealExecutionToggle: React.FC = () => {
  const [isEnabled, setIsEnabled] = React.useState(() => AutomationService.isRealExecutionEnabled());
  
  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    AutomationService.toggleRealExecution(checked);
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
          <AlertDescription className="text-amber-800">
            <span className="font-semibold">تحذير:</span> وضع التنفيذ الفعلي نشط الآن. سيتم محاولة الاتصال بالخادم الحقيقي وتنفيذ الأتمتة فعلياً على المواقع المستهدفة.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RealExecutionToggle;
