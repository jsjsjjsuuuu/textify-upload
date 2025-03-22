import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayCircle, Plus, Trash2, XCircle, Save, Loader2, AlertCircle, Globe, ArrowRight, Server, Database } from "lucide-react";
import { AutomationService } from "@/utils/automationService";
import { AutomationAction, AutomationConfig, AutomationResponse } from "@/utils/automation/types";
import { toast } from "sonner";
import ActionEditor from "./ActionEditor";
import ActionResultsList from "./ActionResultsList";
import { v4 as uuidv4 } from "uuid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface AutomationControllerProps {
  isN8NMode?: boolean;
}

const AutomationController: React.FC<AutomationControllerProps> = ({ isN8NMode = false }) => {
  // حالة الحقول
  const [projectUrl, setProjectUrl] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [automationResponse, setAutomationResponse] = useState<AutomationResponse | null>(null);
  const [targetSite, setTargetSite] = useState<string>('default');
  
  // الإعدادات الخاصة بـ n8n
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState<string>(localStorage.getItem('n8n_webhook_url') || '');
  const [n8nApiKey, setN8nApiKey] = useState<string>(localStorage.getItem('n8n_api_key') || '');
  
  // قائمة المواقع المستهدفة المتاحة
  const [availableSites, setAvailableSites] = useState([
    { id: 'default', name: 'الموقع الافتراضي' },
    { id: 'site1', name: 'شركة النقل 1' },
    { id: 'site2', name: 'شركة النقل 2' },
    { id: 'site3', name: 'منصة التوصيل' }
  ]);

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
          type: 'type',
          finder: '#code',
          value: extractedData.code,
          delay: 300,
          description: 'إدخال الكود'
        });
      }
      
      if (extractedData.senderName) {
        autoActions.push({
          name: 'type',
          type: 'type',
          finder: '#sender_name',
          value: extractedData.senderName,
          delay: 300,
          description: 'إدخال اسم المرسل'
        });
      }
      
      if (extractedData.phoneNumber) {
        autoActions.push({
          name: 'type',
          type: 'type',
          finder: '#phone',
          value: extractedData.phoneNumber,
          delay: 300,
          description: 'إدخال رقم الهاتف'
        });
      }
      
      if (extractedData.province) {
        autoActions.push({
          name: 'select',
          type: 'select',
          finder: '#province',
          value: extractedData.province,
          delay: 300,
          description: 'اختيار المحافظة'
        });
      }
      
      if (extractedData.price) {
        autoActions.push({
          name: 'type',
          type: 'type',
          finder: '#price',
          value: extractedData.price,
          delay: 300,
          description: 'إدخال السعر'
        });
      }
      
      // إضافة إجراء النقر على زر التأكيد
      autoActions.push({
        name: 'click',
        type: 'click',
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
  
  // حفظ إعدادات n8n عند تغييرها
  useEffect(() => {
    if (n8nWebhookUrl) {
      localStorage.setItem('n8n_webhook_url', n8nWebhookUrl);
    }
    if (n8nApiKey) {
      localStorage.setItem('n8n_api_key', n8nApiKey);
    }
  }, [n8nWebhookUrl, n8nApiKey]);
  
  // إضافة إجراء جديد
  const addAction = () => {
    const newAction: AutomationAction = {
      name: 'click',
      type: 'click', // إضافة خاصية type مطلوبة
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
  
  // تشغيل الأتمتة باستخدام n8n
  const runWithN8N = async () => {
    if (!n8nWebhookUrl) {
      toast.error("يرجى إدخال عنوان webhook لـ n8n");
      return;
    }
    
    setIsRunning(true);
    toast.loading("جاري تنفيذ الأتمتة عبر n8n...", {
      id: "n8n-automation-running",
      duration: Infinity,
    });
    
    try {
      // إعداد البيانات لإرسالها إلى webhook
      const webhookData = {
        targetSite: targetSite,
        extractedData: extractedData || {},
        projectUrl: sanitizeURL(projectUrl),
        projectName: projectName,
        actions: actions.map(action => ({
          type: action.name,
          selector: action.finder,
          value: action.value,
          delay: parseInt(action.delay.toString()) || 0,
          description: action.description
        })),
        apiKey: n8nApiKey, // إرسال مفتاح API إذا كان مطلوبًا للتحقق
        timestamp: new Date().toISOString(),
        clientInfo: {
          userAgent: navigator.userAgent,
          origin: window.location.origin
        }
      };
      
      console.log("إرسال بيانات إلى n8n:", webhookData);
      
      // إرسال البيانات إلى webhook
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });
      
      // التعامل مع الاستجابة
      let result: AutomationResponse;
      
      if (response.ok) {
        try {
          const responseData = await response.json();
          
          console.log("استجابة n8n:", responseData);
          
          // تنسيق الاستجابة بنفس تنسيق AutomationResponse
          result = {
            success: responseData.success || true,
            message: responseData.message || "تم تنفيذ الأتمتة بنجاح عبر n8n",
            automationType: 'server',
            results: responseData.results || [],
            executionTime: responseData.executionTime || 0,
            timestamp: responseData.timestamp || new Date().toISOString()
          };
        } catch (error) {
          // إذا لم تكن الاستجابة JSON صالحة، فقد لا يكون webhook يعيد JSON
          result = {
            success: response.status < 400,
            message: response.status < 400 
              ? "تم تنفيذ الأتمتة بنجاح عبر n8n (بدون تفاصيل)" 
              : `فشل تنفيذ الأتمتة: ${response.status} ${response.statusText}`,
            automationType: 'server',
            timestamp: new Date().toISOString()
          };
        }
      } else {
        // فشل الاستجابة
        result = {
          success: false,
          message: `فشل تنفيذ الأتمتة: ${response.status} ${response.statusText}`,
          automationType: 'server',
          error: {
            type: 'ServerError',
            message: `فشل طلب webhook: ${response.status} ${response.statusText}`
          },
          timestamp: new Date().toISOString()
        };
      }
      
      // عرض نتائج الأتمتة
      setAutomationResponse(result);
      setShowResults(true);
      
      if (result.success) {
        toast.success("تم تنفيذ الأتمتة بنجاح عبر n8n", {
          id: "n8n-automation-running",
        });
      } else {
        toast.error("فشل تنفيذ الأتمتة عبر n8n", {
          id: "n8n-automation-running",
          description: result.message,
        });
      }
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة عبر n8n:", error);
      
      const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف أثناء تنفيذ الأتمتة";
      
      toast.error("خطأ في تنفيذ الأتمتة عبر n8n", {
        id: "n8n-automation-running",
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
        },
        timestamp: new Date().toISOString()
      });
      setShowResults(true);
    } finally {
      setIsRunning(false);
    }
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
    
    // إذا كنا في وضع n8n، استخدم دالة runWithN8N
    if (isN8NMode) {
      runWithN8N();
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
        },
        timestamp: new Date().toISOString() // إضافة الطابع الزمني
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
        targetSite: targetSite,
        n8nMode: isN8NMode,
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
      {isN8NMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-500" />
              إعدادات n8n
            </CardTitle>
            <CardDescription>
              قم بإدخال عنوان webhook لخادم n8n ومفتاح API (إذا كان مطلوبًا) للاتصال بالخادم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="n8nWebhookUrl">
                  عنوان webhook لـ n8n <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="n8nWebhookUrl"
                  placeholder="https://n8n.example.com/webhook/xyz123"
                  value={n8nWebhookUrl}
                  onChange={(e) => setN8nWebhookUrl(e.target.value)}
                  className="font-mono text-sm"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500">
                  عنوان webhook المستخدم للاتصال بسير العمل الخاص بك في n8n. يمكنك الحصول عليه من خلال إعداد عقدة "Webhook" في n8n.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="n8nApiKey">
                  مفتاح API لـ n8n (اختياري)
                </Label>
                <Input
                  id="n8nApiKey"
                  type="password"
                  placeholder="مفتاح API للتحقق من الطلبات"
                  value={n8nApiKey}
                  onChange={(e) => setN8nApiKey(e.target.value)}
                  className="font-mono text-sm"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500">
                  يستخدم للتحقق من الطلبات المرسلة إلى n8n. اتركه فارغًا إذا لم يكن التحقق مطلوبًا.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetSite">
                  الموقع المستهدف
                </Label>
                <Select
                  value={targetSite}
                  onValueChange={setTargetSite}
                >
                  <SelectTrigger id="targetSite">
                    <SelectValue placeholder="اختر الموقع المستهدف" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  اختر الموقع المستهدف الذي ترغب في تنفيذ الأتمتة عليه. سيساعد هذا n8n في تحديد سير العمل المناسب.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
            disabled={isRunning || actions.length === 0 || (isN8NMode && !n8nWebhookUrl)}
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
                تنفيذ الأتمتة {isN8NMode ? " عبر n8n" : ""}
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
