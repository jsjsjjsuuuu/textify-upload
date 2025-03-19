
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAutomationServerUrl, setAutomationServerUrl, isValidServerUrl } from "@/utils/automationServerUrl";
import { RefreshCw, Globe, Check, X, Copy, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

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
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [currentServerUrl, setCurrentServerUrl] = useState(getAutomationServerUrl());
  
  // تحديث حقل الإدخال عند تغيير serverUrl من الخارج
  useEffect(() => {
    setInputUrl(serverUrl);
  }, [serverUrl]);
  
  // تحديث عنوان URL الحالي في حالة تغييره
  useEffect(() => {
    setCurrentServerUrl(getAutomationServerUrl());
  }, [serverUrl]);
  
  const validateUrl = (url: string) => {
    try {
      new URL(url);
      setValidUrl(true);
      return true;
    } catch (e) {
      setValidUrl(false);
      return false;
    }
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setInputUrl(newUrl);
    validateUrl(newUrl);
  };
  
  const handleApplyUrl = () => {
    if (validateUrl(inputUrl)) {
      try {
        // تطبيق التغيير مباشرة على عنوان URL الحالي
        setAutomationServerUrl(inputUrl);
        
        // تحديث واجهة المستخدم
        onServerUrlChange(inputUrl);
        setCurrentServerUrl(inputUrl);
        
        toast.success("تم تطبيق العنوان الجديد", {
          description: "سيتم اختبار الاتصال بالعنوان الجديد...",
          duration: 3000
        });
        
        // اختبار الاتصال بعد تطبيق العنوان الجديد مباشرة
        setTimeout(() => {
          onCheckStatus();
        }, 500);
      } catch (error) {
        toast.error("حدث خطأ أثناء تطبيق العنوان الجديد");
        console.error("خطأ في تطبيق العنوان:", error);
      }
    } else {
      toast.error("يرجى إدخال عنوان URL صالح");
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentServerUrl)
      .then(() => toast.success("تم نسخ العنوان إلى الحافظة"))
      .catch(() => toast.error("حدث خطأ أثناء نسخ العنوان"));
  };

  // تنفيذ الإجراء عند الضغط على Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyUrl();
    }
  };
  
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-600" />
            عنوان URL الحالي:
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
          {currentServerUrl}
        </div>
      </div>
      
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          {validUrl ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          تعيين عنوان URL مخصص:
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Input
              dir="ltr"
              type="text"
              value={inputUrl}
              onChange={handleUrlChange}
              onKeyDown={handleKeyDown}
              placeholder="أدخل عنوان URL للخادم مثل https://example.com"
              className={`w-full ${!validUrl && inputUrl ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {!validUrl && inputUrl && (
              <p className="text-xs text-red-600 mt-1">يرجى إدخال عنوان URL صالح</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="secondary" 
              onClick={onCheckStatus}
              disabled={isLoading}
              className="w-full h-10"
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
            
            <Button
              variant="default"
              onClick={handleApplyUrl}
              disabled={isLoading || !validUrl}
              className="w-full h-10 bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              تطبيق
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-200">
          <p className="mb-2 font-medium">ملاحظات:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>أدخل عنوان URL كاملاً متضمناً البروتوكول (https:// أو http://)</li>
            <li>لا تضف مسارات إضافية بعد اسم النطاق (مثل /api)</li>
            <li>عند الضغط على "تطبيق" سيتم تحديث العنوان وفحص الاتصال تلقائياً</li>
            <li>يمكنك الضغط على Enter للتطبيق مباشرة</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ServerUrlConfigurator;
