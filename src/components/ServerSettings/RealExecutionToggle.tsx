
import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAutomationServerUrl, setAutomationServerUrl } from '@/utils/automationServerUrl';
import { Info, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

// القيم الإفتراضية للخادم
const DEFAULT_AUTOMATION_SERVER_URL = 'https://automation-service.lovable.dev';

const RealExecutionToggle = () => {
  // حالة التفعيل
  const [isEnabled, setIsEnabled] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  
  // تحميل الحالة من التخزين المحلي
  useEffect(() => {
    // استرجاع حالة التفعيل
    const savedState = localStorage.getItem('automationRealExecution') === 'true';
    setIsEnabled(savedState);
    
    // استرجاع عنوان الخادم
    const savedUrl = getAutomationServerUrl();
    setServerUrl(savedUrl || DEFAULT_AUTOMATION_SERVER_URL);
  }, []);
  
  // معالجة تغيير الحالة
  const handleToggleChange = (checked: boolean) => {
    setIsEnabled(checked);
    localStorage.setItem('automationRealExecution', checked.toString());
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">تنفيذ حقيقي للأتمتة</Label>
            <p className="text-sm text-muted-foreground">
              عند تفعيل هذا الخيار، سيتم تنفيذ عمليات الأتمتة بالفعل على خادم الأتمتة الخارجي
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleChange}
            aria-label="تنفيذ حقيقي للأتمتة"
          />
        </div>
        
        {isEnabled && (
          <Alert variant="default" className="bg-muted">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تنبيه</AlertTitle>
            <AlertDescription>
              التنفيذ الحقيقي مفعل. سيتم تنفيذ جميع عمليات الأتمتة بالفعل على خادم الأتمتة.
            </AlertDescription>
          </Alert>
        )}
        
        {!isEnabled && (
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertTitle>وضع المحاكاة</AlertTitle>
            <AlertDescription>
              التنفيذ الحقيقي معطل. سيتم محاكاة جميع عمليات الأتمتة دون تنفيذها فعلياً.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};

export default RealExecutionToggle;
