
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationService } from '@/utils/automationService';
import { toast } from 'sonner';
import { isPreviewEnvironment, checkConnection } from '@/utils/automationServerUrl';
import { PlayCircle, Globe, Server, AlertCircle } from 'lucide-react';
import ActionEditor from './ActionEditor';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ConnectionStatusIndicator from '@/components/ui/connection-status-indicator';

// ترتيب الإجراءات
const AutomationController = () => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [actions, setActions] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('config');
  const [serverConnected, setServerConnected] = useState(false);

  useEffect(() => {
    // التحقق من حالة الاتصال بخادم Render عند تحميل المكون
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      // في بيئة المعاينة، اعتبر الخادم متصلاً دائمًا
      if (isPreviewEnvironment()) {
        setServerConnected(true);
        return;
      }

      // التحقق من الاتصال بالخادم
      const result = await checkConnection();
      setServerConnected(result.isConnected);
    } catch (error) {
      console.error("خطأ في التحقق من حالة الاتصال:", error);
      setServerConnected(false);
    }
  };

  const handleAddAction = () => {
    setActions([...actions, {
      type: 'click',
      selector: '',
      text: '',
      value: ''
    }]);
  };

  const handleUpdateAction = (index: number, updatedAction: any) => {
    const newActions = [...actions];
    newActions[index] = updatedAction;
    setActions(newActions);
  };

  const handleDeleteAction = (index: number) => {
    const newActions = [...actions];
    newActions.splice(index, 1);
    setActions(newActions);
  };

  const handleRun = async () => {
    if (!name.trim()) {
      toast.error("يجب إدخال اسم للأتمتة");
      return;
    }

    if (!url.trim() || !url.startsWith('http')) {
      toast.error("يجب إدخال رابط صحيح يبدأ بـ http:// أو https://");
      return;
    }

    if (actions.length === 0) {
      toast.error("يجب إضافة إجراء واحد على الأقل");
      return;
    }

    // التأكد من أن جميع الإجراءات تحتوي على المعلومات المطلوبة
    const invalidActions = actions.find(action => {
      if (action.type === 'click' || action.type === 'submit') {
        return !action.selector;
      } else if (action.type === 'input') {
        return !action.selector || action.value === undefined;
      } else if (action.type === 'select') {
        return !action.selector || action.value === undefined;
      }
      return false;
    });

    if (invalidActions) {
      toast.error("هناك إجراءات غير مكتملة، يرجى مراجعة جميع الإجراءات");
      return;
    }

    try {
      setIsRunning(true);
      // في بيئة المعاينة، محاكاة نجاح الأتمتة
      if (isPreviewEnvironment()) {
        // محاكاة التأخير في الاستجابة
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success("تمت محاكاة تنفيذ الأتمتة بنجاح (بيئة المعاينة)");
        setResult({
          success: true,
          message: "تمت محاكاة التنفيذ بنجاح",
          screenshots: []
        });
        setSelectedTab('result');
        setIsRunning(false);
        return;
      }

      toast("جاري تنفيذ الأتمتة...", {
        duration: 5000,
      });

      // تنفيذ الأتمتة
      const response = await AutomationService.validateAndRunAutomation({
        name,
        url,
        actions
      });

      setResult(response);

      if (response.success) {
        toast.success("تم تنفيذ الأتمتة بنجاح");
      } else {
        toast.error(`فشل تنفيذ الأتمتة: ${response.message}`);
      }

      setSelectedTab('result');
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      toast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ غير معروف أثناء تنفيذ الأتمتة'
      });
      setSelectedTab('result');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveAutomation = () => {
    if (!name.trim()) {
      toast.error("يجب إدخال اسم للأتمتة");
      return;
    }

    if (!url.trim() || !url.startsWith('http')) {
      toast.error("يجب إدخال رابط صحيح يبدأ بـ http:// أو https://");
      return;
    }

    if (actions.length === 0) {
      toast.error("يجب إضافة إجراء واحد على الأقل");
      return;
    }

    const automation = {
      id: Date.now().toString(),
      name,
      url,
      actions,
      createdAt: new Date().toISOString()
    };

    // حفظ الأتمتة في التخزين المحلي
    try {
      const savedAutomations = JSON.parse(localStorage.getItem('savedAutomations') || '[]');
      savedAutomations.push(automation);
      localStorage.setItem('savedAutomations', JSON.stringify(savedAutomations));
      toast.success("تم حفظ الأتمتة بنجاح");

      // إعادة ضبط النموذج
      setName('');
      setUrl('');
      setActions([]);
      setResult(null);
      setSelectedTab('config');
    } catch (error) {
      console.error("خطأ في حفظ الأتمتة:", error);
      toast.error("حدث خطأ أثناء حفظ الأتمتة");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="bg-slate-50 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-purple-600" />
                إنشاء سيناريو أتمتة جديد
              </CardTitle>
              <CardDescription>
                قم بتكوين إعدادات الأتمتة وإضافة الإجراءات
              </CardDescription>
            </div>
            <ConnectionStatusIndicator showText={true} />
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-3">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-[300px] mb-6">
              <TabsTrigger value="config">الإعدادات والإجراءات</TabsTrigger>
              <TabsTrigger value="result" disabled={!result}>النتائج</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="automation-name">اسم التكوين</Label>
                  <Input 
                    id="automation-name"
                    placeholder="أدخل اسمًا وصفيًا للأتمتة"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="automation-url">رابط المشروع *</Label>
                  <Input 
                    id="automation-url"
                    placeholder="أدخل الرابط مثل https://example.com/add_newwaslinserter.php?add"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">الإجراءات</Label>
                  <Button 
                    variant="outline" 
                    onClick={handleAddAction}
                    className="text-sm h-8"
                  >
                    إضافة إجراء +
                  </Button>
                </div>

                {actions.length === 0 ? (
                  <div className="text-center py-8 border rounded-md border-dashed">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">لا توجد إجراءات. انقر على "إضافة إجراء" أعلاه للبدء.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actions.map((action, index) => (
                      <ActionEditor 
                        key={index} 
                        index={index}
                        action={action}
                        onUpdate={(updatedAction) => handleUpdateAction(index, updatedAction)}
                        onDelete={() => handleDeleteAction(index)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleSaveAutomation}
                  disabled={isRunning}
                >
                  حفظ الأتمتة
                </Button>
                <Button 
                  onClick={handleRun}
                  disabled={isRunning}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isRunning ? 'جاري التنفيذ...' : 'تشغيل الأتمتة'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="result">
              {result && (
                <div className="space-y-4">
                  <Alert variant={result.success ? "default" : "destructive"} className={result.success ? "bg-green-50 border-green-300" : ""}>
                    <AlertTitle>{result.success ? "تم تنفيذ الأتمتة بنجاح" : "فشل تنفيذ الأتمتة"}</AlertTitle>
                    <AlertDescription>
                      {result.message}
                    </AlertDescription>
                  </Alert>

                  {result.screenshots && result.screenshots.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-lg">لقطات الشاشة:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.screenshots.map((screenshot: string, index: number) => (
                          <div key={index} className="border rounded-md overflow-hidden">
                            <img 
                              src={screenshot} 
                              alt={`لقطة شاشة ${index + 1}`} 
                              className="w-full h-auto"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationController;
