
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAutomationServerUrl, setAutomationServerUrl, isValidServerUrl } from "@/utils/automationServerUrl";
import { RefreshCw, Globe, Check, X, Copy, Save, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ServerUrlConfiguratorProps {
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  onCheckStatus: () => void;
  isLoading: boolean;
}

const ServerUrlConfigurator: React.FC<ServerUrlConfiguratorProps> = ({
  serverUrl,
  onServerUrlChange,
  onCheckStatus,
  isLoading
}) => {
  const [validUrl, setValidUrl] = useState(true);
  const renderServerUrl = "https://textify-upload.onrender.com";
  const [currentServerUrl, setCurrentServerUrl] = useState(renderServerUrl);
  
  // التعيين الأولي للرابط عند تحميل المكون
  useEffect(() => {
    // ضمان استخدام رابط Render دائماً
    if (currentServerUrl !== renderServerUrl) {
      setAutomationServerUrl(renderServerUrl);
      onServerUrlChange(renderServerUrl);
      setCurrentServerUrl(renderServerUrl);
      
      // اختبار الاتصال بالرابط
      setTimeout(() => {
        onCheckStatus();
      }, 500);
      
      toast.success("تم تطبيق خادم Render الرسمي", {
        description: "يتم الآن استخدام خادم Render الرسمي فقط",
        duration: 3000
      });
    }
  }, []);
  
  // تحديث عنوان URL الحالي في حالة تغييره
  useEffect(() => {
    setCurrentServerUrl(renderServerUrl);
  }, [serverUrl]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentServerUrl)
      .then(() => toast.success("تم نسخ العنوان إلى الحافظة"))
      .catch(() => toast.error("حدث خطأ أثناء نسخ العنوان"));
  };

  return (
    <div className="space-y-5">
      <Alert className="bg-purple-50 border-purple-200">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          تم تعيين التطبيق لاستخدام خادم Render الرسمي فقط. لا يمكن تغيير هذا الإعداد.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-600" />
            عنوان URL لخادم الأتمتة:
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyToClipboard}
                  className="h-8 px-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>نسخ العنوان</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="p-3 bg-slate-50 rounded-md text-sm font-mono break-all border border-slate-200">
          {renderServerUrl}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="secondary" 
          onClick={onCheckStatus}
          disabled={isLoading}
          className="w-auto h-10"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              جارٍ الفحص...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              فحص الاتصال
            </>
          )}
        </Button>
      </div>
      
      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-200">
        <p className="mb-2 font-medium">ملاحظات:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>يستخدم التطبيق خادم Render الرسمي فقط للأتمتة</li>
          <li>قد يستغرق الاتصال بعض الوقت إذا كان الخادم في وضع السكون</li>
          <li>في حالة استمرار مشاكل الاتصال، يرجى الانتظار بضع دقائق ثم إعادة المحاولة</li>
        </ul>
      </div>
    </div>
  );
};

export default ServerUrlConfigurator;
