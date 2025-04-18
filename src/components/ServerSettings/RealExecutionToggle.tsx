
import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { AutomationService } from "@/utils/automationService";
import { isRealExecutionEnabled, setUseBrowserData } from "@/utils/automation";

const RealExecutionToggle = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // قراءة الحالة الحالية من التخزين المحلي
    const currentState = isRealExecutionEnabled();
    setIsEnabled(currentState);
    setShowWarning(currentState);
  }, []);

  const handleToggle = (value: boolean) => {
    setIsEnabled(value);
    setShowWarning(value);
    
    // حفظ الحالة في التخزين المحلي
    AutomationService.toggleRealExecution(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Switch 
          id="real-execution" 
          checked={isEnabled} 
          onCheckedChange={handleToggle} 
          className={isEnabled ? "bg-orange-500 data-[state=checked]:bg-orange-500" : ""}
        />
        <Label htmlFor="real-execution" className="font-medium text-base">
          تمكين التنفيذ الفعلي للأتمتة
        </Label>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {isEnabled ? (
          <span className="text-orange-500 font-medium">
            تم تفعيل وضع التنفيذ الفعلي. سيتم تنفيذ الأتمتة على المواقع الفعلية.
          </span>
        ) : (
          <span>
            وضع المعاينة فقط. لن تنفذ الأتمتة على المواقع الفعلية.
          </span>
        )}
      </div>
      
      {showWarning && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">تحذير: وضع التنفيذ الفعلي مفعل</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p className="mb-2">
              أنت الآن في وضع التنفيذ الفعلي. أي أتمتة تقوم بإنشائها وتشغيلها ستتفاعل 
              مع مواقع الويب الفعلية وستقوم بإدخال بيانات حقيقية.
            </p>
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <div className="bg-white p-2 rounded border border-amber-100 text-xs">
                  <p className="font-medium text-amber-800">قم بتوخي الحذر عند:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-amber-700">
                    <li>إدخال بيانات في نماذج حساسة</li>
                    <li>تنفيذ أتمتة على مواقع تسجيل دخول</li>
                    <li>العمل مع مواقع تحتوي على معاملات مالية</li>
                  </ul>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-6">
        <Switch id="browser-data" className="mr-2" />
        <div>
          <Label htmlFor="browser-data" className="font-medium">استخدام بيانات المتصفح</Label>
          <p className="text-sm text-muted-foreground">
            إذا كان ممكنًا، سيتم استخدام بيانات جلسة المتصفح الخاصة بك (ملفات تعريف الارتباط، التخزين المحلي) عند تنفيذ الأتمتة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RealExecutionToggle;
