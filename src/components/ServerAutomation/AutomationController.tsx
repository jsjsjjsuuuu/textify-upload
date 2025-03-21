
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayCircle, Plus, Trash2, XCircle, Save, Loader2, AlertCircle, Globe, ArrowRight } from "lucide-react";
import { AutomationService } from "@/utils/automationService";
import { AutomationAction, AutomationConfig, AutomationResponse } from "@/utils/automation/types";
import { toast } from "sonner";
import ActionEditor from "./ActionEditor";
import ActionResultsList from "./ActionResultsList";
import { v4 as uuidv4 } from "uuid";

// وظيفة مساعدة للتحقق من صلاحية URL
const validateURL = (url: string): boolean => {
  // إذا كان URL فارغاً، اعتبره غير صالح
  if (!url.trim()) return false;
  
  try {
    // محاولة تصحيح URL إذا كان ينقصه البروتوكول
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    
    // التحقق من صلاحية URL باستخدام كائن URL
    new URL(urlWithProtocol);
    return true;
  } catch (e) {
    // إرجاع false إذا كان URL غير صالح
    return false;
  }
};

// وظيفة مساعدة لتصحيح URL
const sanitizeURL = (url: string): string => {
  if (!url.trim()) return '';
  
  // إضافة بروتوكول إذا كان مفقوداً
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
};

const AutomationController: React.FC = () => {
  // استخراج البيانات من localStorage إذا كانت موجودة
  const extractDataFromLocalStorage = (): any => {
    try {
      const automationData = localStorage.getItem('automationData');
      if (automationData) {
        const parsedData = JSON.parse(automationData);
        localStorage.removeItem('automationData'); // مسح البيانات بعد استخدامها
        return parsedData;
      }
    } catch (error) {
      console.error("خطأ في استخراج البيانات من localStorage:", error);
    }
    return null;
  };
  
  const extractedData = extractDataFromLocalStorage();
  
  // حالة الحقول
  const [projectUrl, setProjectUrl] = useState<string>(extractedData?.projectUrl || '');
  const [projectName, setProjectName] = useState<string>(extractedData?.projectName || '');
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [automationResponse, setAutomationResponse] = useState<AutomationResponse | null>(null);

  // استخراج البيانات عند تحميل المكون
  useEffect(() => {
    if (extractedData) {
      console.log("تم استخراج البيانات:", extractedData);
      
      // تعيين عنوان URL للمشروع إذا وجد
      if (extractedData.projectUrl) {
        setProjectUrl(extractedData.projectUrl);
      }
      
      // إنشاء الإجراءات التلقائية بناءً على البيانات المستخرجة
      const autoActions: AutomationAction[] = [];
      
      // إنشاء إجراءات تلقائية مثل إدخال الكود أو اسم المرسل أو رقم الهاتف...إلخ
      if (extractedData.code) {
        autoActions.push({
          name: 'type',
          finder: '#code',
          value: extractedData.code,
          delay: 300,
          description: 'إدخال الكود'
        });
      }
      
      if (extractedData.senderName) {
        autoActions.push({
          name: 'type',
          finder: '#sender_name',
          value: extractedData.senderName,
          delay: 300,
          description: 'إدخال اسم المرسل'
        });
      }
      
      if (extractedData.phoneNumber) {
        autoActions.push({
          name: 'type',
          finder: '#phone',
          value: extractedData.phoneNumber,
          delay: 300,
          description: 'إدخال رقم الهاتف'
        });
      }
      
      if (extractedData.province) {
        autoActions.push({
          name: 'select',
          finder: '#province',
          value: extractedData.province,
          delay: 300,
          description: 'اختيار المحافظة'
        });
      }
      
      if (extractedData.price) {
        autoActions.push({
          name: 'type',
          finder: '#price',
          value: extractedData.price,
          delay: 300,
          description: 'إدخال السعر'
        });
      }
      
      // إضافة إجراء النقر على زر التأكيد
      autoActions.push({
        name: 'click',
        finder: 'button[type="submit"]',
        value: '',
        delay: 500,
        description: 'النقر على زر التأكيد'
      });
      
      // تعيين الإجراءات المنشأة تلقائيًا
      if (autoActions.length > 0) {
        setActions(autoActions);
        toast.success("تم إنشاء إجراءات تلقائية", {
          description: `تم إنشاء ${autoActions.length} من الإجراءات بناءً على البيانات المستخرجة`
        });
      }
    }
  }, []);
  
  // إضافة إجراء جديد
  const addAction = () => {
    const newAction: AutomationAction = {
      name: 'click',
      finder: '',
      value: '',
      delay: 500,
      description: 'إجراء جديد'
    };
    setActions([...actions, newAction]);
  };
  
  // حذف إجراء
  const removeAction = (index: number) => {
    const updatedActions = [...actions];
    updatedActions.splice(index, 1);
    setActions(updatedActions);
  };
  
  // تحديث إجراء
  const updateAction = (index: number, updatedAction: AutomationAction) => {
    const newActions = [...actions];
    newActions[index] = updatedAction;
    setActions(newActions);
  };
  
  // تشغيل الأتمتة
  const runAutomation = async () => {
    // التحقق من الحقول المطلوبة
    if (!projectUrl) {
      toast.error("يرجى إدخال عنوان URL للمشروع");
      return;
    }
    
    // التحقق من صلاحية URL
    if (!validateURL(projectUrl)) {
      toast.error("عنوان URL غير صالح", {
        description: "يجب أن يكون عنوان URL صالحًا مثل https://example.com"
      });
      return;
    }
    
    if (actions.length === 0) {
      toast.error("يجب إضافة إجراء واحد على الأقل");
      return;
    }
    
    setIsRunning(true);
    setShowResults(false);
    
    // تصحيح عنوان URL إذا لزم الأمر
    const sanitizedUrl = sanitizeURL(projectUrl);
    
    // إنشاء تكوين الأتمتة
    const config: AutomationConfig = {
      projectUrl: sanitizedUrl,
      projectName: projectName || undefined,
      actions: actions,
      useBrowserData: true,
      automationType: 'server',
      forceRealExecution: true
    };
    
    try {
      // تنفيذ الأتمتة
      toast.loading("جاري تنفيذ الأتمتة...", {
        id: "automation-running",
        duration: Infinity,
      });
      
      const response = await AutomationService.validateAndRunAutomation(config);
      
      console.log("استجابة الأتمتة:", response);
      
      // عرض نتائج الأتمتة
      setAutomationResponse(response);
      setShowResults(true);
      
      if (response.success) {
        toast.success("تم تنفيذ الأتمتة بنجاح", {
          id: "automation-running",
        });
      } else {
        toast.error("فشل تنفيذ الأتمتة", {
          id: "automation-running",
          description: response.message,
        });
      }
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      
      const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف أثناء تنفيذ الأتمتة";
      
      toast.error("خطأ في تنفيذ الأتمتة", {
        id: "automation-running",
        description: errorMessage,
      });
      
      setAutomationResponse({
        success: false,
        message: errorMessage,
        automationType: 'server',
        error: {
          message: errorMessage,
          type: 'ExecutionError',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      setShowResults(true);
    } finally {
      setIsRunning(false);
    }
  };
  
  // حفظ الأتمتة
  const saveAutomation = () => {
    if (!projectUrl) {
      toast.error("يرجى إدخال عنوان URL للمشروع");
      return;
    }
    
    if (actions.length === 0) {
      toast.error("يجب إضافة إجراء واحد على الأقل");
      return;
    }
    
    try {
      // قراءة الأتمتة المحفوظة سابقًا
      const savedAutomationsString = localStorage.getItem('savedAutomations');
      const savedAutomations = savedAutomationsString ? JSON.parse(savedAutomationsString) : [];
      
      // إنشاء معرّف فريد للأتمتة الجديدة
      const id = uuidv4();
      
      // إنشاء كائن الأتمتة
      const automationToSave = {
        id,
        projectUrl,
        projectName: projectName || `أتمتة ${savedAutomations.length + 1}`,
        actions,
        dateCreated: new Date().toISOString()
      };
      
      // إضافة الأتمتة إلى القائمة
      savedAutomations.push(automationToSave);
      
      // حفظ القائمة المحدثة
      localStorage.setItem('savedAutomations', JSON.stringify(savedAutomations));
      
      toast.success("تم حفظ الأتمتة بنجاح");
    } catch (error) {
      console.error("خطأ في حفظ الأتمتة:", error);
      toast.error("حدث خطأ أثناء حفظ الأتمتة");
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-500" />
            إعدادات المشروع
          </CardTitle>
          <CardDescription>
            قم بإدخال عنوان URL للموقع المستهدف واسم المشروع (اختياري)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="projectUrl">
                عنوان URL للمشروع <span className="text-red-500">*</span>
              </Label>
              <Input
                id="projectUrl"
                placeholder="https://example.com"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                disabled={isRunning}
                dir="ltr"
              />
              <p className="text-xs text-gray-500">
                يجب أن يبدأ العنوان بـ http:// أو https://
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="projectName">اسم المشروع (اختياري)</Label>
              <Input
                id="projectName"
                placeholder="أدخل اسمًا للمشروع"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isRunning}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-purple-500" />
            الإجراءات
          </CardTitle>
          <CardDescription>
            قم بإضافة الإجراءات التي سيتم تنفيذها على الموقع المستهدف
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {actions.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-md">
                  <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">لا توجد إجراءات. قم بإضافة إجراء جديد للبدء.</p>
                </div>
              ) : (
                actions.map((action, index) => (
                  <div key={index} className="relative border rounded-lg p-4 bg-gray-50">
                    <div className="absolute right-2 top-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(index)}
                        disabled={isRunning}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <ActionEditor
                      action={action}
                      onChange={(updatedAction) => updateAction(index, updatedAction)}
                      disabled={isRunning}
                      index={index}
                    />
                  </div>
                ))
              )}
              <Button
                variant="outline"
                onClick={addAction}
                className="w-full"
                disabled={isRunning}
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة إجراء جديد
              </Button>
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={saveAutomation}
            disabled={isRunning || actions.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            حفظ الأتمتة
          </Button>
          <Button
            onClick={runAutomation}
            disabled={isRunning || actions.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري التنفيذ...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                تنفيذ الأتمتة
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {showResults && (
        <ActionResultsList
          automationResponse={automationResponse}
          onHideResults={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

export default AutomationController;
