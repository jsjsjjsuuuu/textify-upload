
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AutomationService } from '@/utils/automationService';
import { Play, Save, Plus, Trash2, Database } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isPreviewEnvironment } from '@/utils/automationServerUrl';

interface SimpleAction {
  id: string;
  selector: string;
  name: string;
  value: string;
  delay: string;
}

const SimpleAutomationSection = () => {
  const [projectUrl, setProjectUrl] = useState('');
  const [projectName, setProjectName] = useState('مشروع أتمتة جديد');
  const [actions, setActions] = useState<SimpleAction[]>([
    { id: '1', selector: '', name: '', value: '', delay: '0' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [useBrowserData, setUseBrowserData] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { toast } = useToast();

  // التحقق من حالة الخادم عند تحميل المكون
  useEffect(() => {
    checkServerConnection();
    
    // التحقق من وجودنا في بيئة المعاينة
    const previewMode = isPreviewEnvironment();
    setIsPreviewMode(previewMode);
    
    // استرجاع البيانات المحفوظة
    const savedData = localStorage.getItem('simple_automation_data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.actions) setActions(data.actions);
        if (data.projectName) setProjectName(data.projectName);
        if (data.projectUrl) setProjectUrl(data.projectUrl);
        if (data.useBrowserData !== undefined) setUseBrowserData(data.useBrowserData);
      } catch (error) {
        console.error('خطأ في استرجاع البيانات المحفوظة:', error);
      }
    }
  }, []);

  // حفظ البيانات عند تغييرها
  useEffect(() => {
    localStorage.setItem('simple_automation_data', JSON.stringify({
      actions,
      projectName,
      projectUrl,
      useBrowserData
    }));
  }, [actions, projectName, projectUrl, useBrowserData]);

  const checkServerConnection = async () => {
    try {
      await AutomationService.checkServerStatus(false);
      setServerConnected(true);
    } catch (error) {
      setServerConnected(false);
      console.error('تعذر الاتصال بخادم الأتمتة:', error);
    }
  };

  const addAction = () => {
    const newId = (actions.length + 1).toString();
    setActions([...actions, { id: newId, selector: '', name: '', value: '', delay: '0' }]);
  };

  const removeAction = (id: string) => {
    if (actions.length <= 1) {
      toast({
        title: "تنبيه",
        description: "يجب أن يكون هناك إجراء واحد على الأقل",
      });
      return;
    }
    setActions(actions.filter(action => action.id !== id));
  };

  const updateAction = (id: string, field: keyof SimpleAction, value: string) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, [field]: value } : action
    ));
  };

  const runAutomation = async () => {
    if (!projectUrl) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط المشروع",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    toast.info('جاري تنفيذ الأتمتة...');

    try {
      // تحويل الإجراءات البسيطة إلى تنسيق الأتمتة المطلوب
      const automationActions = actions.map(action => ({
        name: action.name || `إجراء ${action.id}`,
        finder: action.selector,
        value: action.value,
        delay: parseInt(action.delay) || 0
      }));

      const config = {
        projectName,
        projectUrl,
        actions: automationActions,
        automationType: 'server',
        useBrowserData // إضافة خيار استخدام بيانات المتصفح
      };

      const result = await AutomationService.validateAndRunAutomation(config);
      
      if (result.success) {
        toast.success('تم تنفيذ الأتمتة بنجاح!');
      } else {
        toast.error(`فشل تنفيذ الأتمتة: ${result.message}`);
      }
    } catch (error) {
      toast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const saveAutomation = () => {
    try {
      const savedAutomations = JSON.parse(localStorage.getItem('saved_automations') || '[]');
      
      const automationToSave = {
        id: Date.now().toString(),
        name: projectName,
        url: projectUrl,
        actions: actions,
        createdAt: new Date().toISOString(),
        useBrowserData
      };
      
      localStorage.setItem('saved_automations', JSON.stringify([...savedAutomations, automationToSave]));
      
      toast.success('تم حفظ الأتمتة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الأتمتة');
    }
  };

  const loadSavedAutomation = () => {
    try {
      const savedAutomations = JSON.parse(localStorage.getItem('saved_automations') || '[]');
      
      if (savedAutomations.length === 0) {
        toast.info('لا توجد أتمتة محفوظة');
        return;
      }
      
      // هنا يمكن إنشاء نافذة منبثقة لاختيار الأتمتة المحفوظة
      // لتبسيط المثال، سنستخدم أحدث أتمتة تم حفظها
      const latestAutomation = savedAutomations[savedAutomations.length - 1];
      
      setProjectName(latestAutomation.name);
      setProjectUrl(latestAutomation.url);
      setActions(latestAutomation.actions);
      if (latestAutomation.useBrowserData !== undefined) {
        setUseBrowserData(latestAutomation.useBrowserData);
      }
      
      toast.success('تم تحميل الأتمتة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل الأتمتة');
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>الأتمتة السريعة</span>
          <div className="flex items-center gap-2">
            <Label htmlFor="use-browser-data" className="text-sm">استخدام بيانات المتصفح</Label>
            <Switch
              id="use-browser-data"
              checked={useBrowserData}
              onCheckedChange={setUseBrowserData}
            />
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="project-name">اسم المشروع</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1"
              placeholder="اسم المشروع"
            />
          </div>
          <div>
            <Label htmlFor="project-url">رابط المشروع <span className="text-red-500">*</span></Label>
            <Input
              id="project-url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              className="mt-1"
              placeholder="https://example.com"
              dir="ltr"
            />
          </div>
        </div>

        {!serverConnected && !isPreviewMode && (
          <Alert variant="destructive">
            <AlertDescription>
              خادم الأتمتة غير متصل. يرجى التحقق من إعدادات الخادم أو تشغيل الخادم المحلي.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">الإجراءات</h3>
            <Button variant="outline" size="sm" onClick={addAction}>
              <Plus className="h-4 w-4 mr-1" />
              إضافة إجراء
            </Button>
          </div>

          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-right">
                  <th className="p-2 text-sm">#</th>
                  <th className="p-2 text-sm">مكتشف العناصر</th>
                  <th className="p-2 text-sm">الاسم</th>
                  <th className="p-2 text-sm">القيمة</th>
                  <th className="p-2 text-sm">التأخير (ثانية)</th>
                  <th className="p-2 text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action) => (
                  <tr key={action.id} className="border-t">
                    <td className="p-2">{action.id}</td>
                    <td className="p-2">
                      <Input
                        value={action.selector}
                        onChange={(e) => updateAction(action.id, 'selector', e.target.value)}
                        placeholder="#id أو .class أو //xpath"
                        dir="ltr"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={action.name}
                        onChange={(e) => updateAction(action.id, 'name', e.target.value)}
                        placeholder="اسم الإجراء"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={action.value}
                        onChange={(e) => updateAction(action.id, 'value', e.target.value)}
                        placeholder="القيمة"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={action.delay}
                        onChange={(e) => updateAction(action.id, 'delay', e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAction(action.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveAutomation}>
            <Save className="h-4 w-4 mr-1" />
            حفظ
          </Button>
          <Button variant="outline" onClick={loadSavedAutomation}>
            <Database className="h-4 w-4 mr-1" />
            تحميل
          </Button>
        </div>
        <Button 
          onClick={runAutomation} 
          disabled={isRunning || !projectUrl || (!serverConnected && !isPreviewMode)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Play className="h-4 w-4 mr-1" />
          {isRunning ? 'جاري التنفيذ...' : 'تشغيل الأتمتة'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SimpleAutomationSection;
