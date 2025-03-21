import React from "react";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, AlertTriangle, Server, RefreshCw, Globe, Link2, Database, Check, Wifi } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AutomationService } from "@/utils/automationService";
import { getAutomationServerUrl } from "@/utils/automationServerUrl";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const RealExecutionToggle: React.FC = () => {
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectionTried, setConnectionTried] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const [currentServerUrl, setCurrentServerUrl] = React.useState(() => getAutomationServerUrl());
  const [connectionSuccess, setConnectionSuccess] = React.useState(false);
  
  React.useEffect(() => {
    // ضمان أن وضع التنفيذ الفعلي دائمًا مفعل
    AutomationService.toggleRealExecution(true);
    
    // تحديث عنوان URL الحالي عند تغييره
    setCurrentServerUrl(getAutomationServerUrl());
    
    // التحقق من الاتصال تلقائياً عند تحميل المكون
    checkServerConnection();
  }, []);
  
  // تعطيل تبديل وضع التنفيذ - دائمًا مفعل
  const handleToggle = (checked: boolean) => {
    // إذا حاول المستخدم تعطيل وضع التنفيذ الفعلي، نظهر له رسالة
    if (!checked) {
      toast.info("لا يمكن تعطيل وضع التنفيذ الفعلي");
      return;
    }
    
    setIsEnabled(true);
    AutomationService.toggleRealExecution(true);
    
    // محاولة الاتصال بالخادم الحقيقي
    checkServerConnection();
  };
  
  const checkServerConnection = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    setConnectionSuccess(false);
    toast.info("جاري التحقق من الاتصال بالخادم الحقيقي...");
    
    try {
      const result = await AutomationService.forceReconnect();
      setConnectionTried(true);
      
      if (result) {
        setConnectionSuccess(true);
        toast.success("تم الاتصال بخادم الأتمتة بنجاح! يمكنك الآن تنفيذ الأتمتة بشكل فعلي.");
      } else {
        setConnectionError("تعذر الاتصال بخادم الأتمتة. تأكد من تشغيل الخادم وإمكانية الوصول إليه.");
        toast.error("تعذر الاتصال بخادم الأتمتة. تأكد من تشغيل الخادم وإمكانية الوصول إليه.");
      }
    } catch (error) {
      console.error("خطأ في الاتصال بالخادم:", error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setConnectionError(errorMessage);
      setConnectionTried(true);
      setConnectionSuccess(false);
      toast.error(`تعذر الاتصال بخادم الأتمتة: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const openServerSettings = () => {
    // الانتقال إلى صفحة إعدادات الخادم
    window.location.href = "/server-settings";
  };
  
  // المكون دائمًا يظهر بغض النظر عن البيئة
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md border border-amber-200">
        <div className="space-y-1">
          <h3 className="font-medium flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-amber-600" />
            وضع التنفيذ الفعلي
          </h3>
          <p className="text-sm text-muted-foreground">
            تم تفعيل وضع التنفيذ الفعلي تلقائيًا، سيتم الاتصال بالخادم الحقيقي وتنفيذ الأتمتة فعلياً.
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          aria-label="تفعيل وضع التنفيذ الفعلي"
          disabled={true} // تعطيل التبديل
        />
      </div>
      
      <Alert variant={connectionSuccess ? "default" : "destructive"} className={connectionSuccess ? "bg-green-50 border-green-300" : "bg-amber-50 border-amber-300"}>
        {connectionSuccess ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )}
        <AlertTitle className={`${connectionSuccess ? "text-green-800" : "text-amber-800"} font-medium mb-2`}>
          {connectionSuccess ? "وضع التنفيذ الفعلي نشط ومتصل" : "وضع التنفيذ الفعلي نشط الآن"}
        </AlertTitle>
        <AlertDescription className={connectionSuccess ? "text-green-800" : "text-amber-800"}>
          {connectionSuccess ? (
            <p className="mb-3">
              تم الاتصال بخادم الأتمتة بنجاح. يمكنك الآن تنفيذ الأتمتة فعلياً على المواقع المستهدفة.
            </p>
          ) : (
            <p className="mb-3">
              سيتم محاولة الاتصال بالخادم الحقيقي وتنفيذ الأتمتة فعلياً على المواقع المستهدفة. تأكد من:
            </p>
          )}
          
          {!connectionSuccess && (
            <ul className="list-disc list-inside space-y-1 mb-3 text-sm">
              <li>تشغيل خادم الأتمتة وإمكانية الوصول إليه من الإنترنت</li>
              <li>الاتصال بالخادم باستخدام عنوان URL صحيح</li>
              <li>عدم وجود حظر CORS على الخادم</li>
              <li>تكوين المتصفح للسماح بالاتصالات</li>
            </ul>
          )}
          
          {connectionTried && connectionError && !connectionSuccess && (
            <div className="mt-3 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-red-800 font-medium flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                حدث خطأ أثناء الاتصال بالخادم
              </h4>
              <p className="text-sm text-red-700 mb-2">{connectionError}</p>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="link" size="sm" className="p-0 h-auto text-red-700 hover:text-red-900">
                    عرض الحلول المحتملة
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <h5 className="font-medium">حلول محتملة لخطأ الاتصال:</h5>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <Server className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>تأكد من تشغيل خادم الأتمتة وأنه متاح على الإنترنت</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Link2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>تحقق من صحة عنوان URL الخادم في صفحة إعدادات الخادم</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Globe className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>تأكد من أن خادم الأتمتة يسمح بطلبات CORS من هذا الموقع</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Database className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>قد يكون الخادم في وضع السكون (Render)، حاول تنشيطه عن طريق زيارة عنوان URL الخاص به مباشرة</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Wifi className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>تأكد من أن عناوين IP المسموح بها في Render مضافة إلى إعدادات خادم الأتمتة</span>
                      </li>
                    </ul>
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      الخادم الحالي: <code className="px-1 py-0.5 bg-slate-100 rounded text-[11px]">{currentServerUrl}</code>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkServerConnection}
              disabled={isConnecting}
              className={connectionSuccess ? "bg-green-50 border-green-200 hover:bg-green-100" : "bg-white hover:bg-amber-50"}
            >
              <Server className={`h-4 w-4 mr-2 ${isConnecting ? 'hidden' : 'inline'} ${connectionSuccess ? 'text-green-600' : ''}`} />
              <RefreshCw className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin inline' : 'hidden'}`} />
              {isConnecting ? 'جاري التحقق من الاتصال...' : connectionSuccess ? 'إعادة التحقق من الاتصال' : 'التحقق من اتصال الخادم الحقيقي'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={openServerSettings}
              className={connectionSuccess ? "bg-white hover:bg-green-50" : "bg-white hover:bg-amber-50"}
            >
              <Database className="h-4 w-4 mr-2" />
              تكوين إعدادات الخادم
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RealExecutionToggle;
