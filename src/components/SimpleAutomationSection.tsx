
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AutomationService } from '@/utils/automationService';
import { Play, Save, Plus, Trash2, Database, CheckCircle2, AlertCircle, Clock, Timer } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isPreviewEnvironment } from '@/utils/automationServerUrl';
import { toast as sonnerToast } from 'sonner';

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
    sonnerToast('جاري تنفيذ الأتمتة...', {
      description: 'يرجى الانتظار حتى اكتمال العملية',
      duration: 10000,
    });

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
        automationType: 'server' as 'server' | 'client',
        useBrowserData,
        forceRealExecution: true
      };

      const result = await AutomationService.validateAndRunAutomation(config);

      if (result.success) {
        sonnerToast.success('تم تنفيذ الأتمتة بنجاح!', {
          description: `تم إكمال ${automationActions.length} إجراء بنجاح`,
          duration: 8000,
        });
      } else {
        sonnerToast.error(`فشل تنفيذ الأتمتة: ${result.message}`, {
          description: 'انقر لعرض التفاصيل',
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('خطأ أثناء تنفيذ الأتمتة:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">اسم المشروع</Label>
          <Input
            id="project-name"
            placeholder="اسم المشروع"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="project-url">رابط المشروع</Label>
          <Input
            id="project-url"
            placeholder="https://example.com"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Switch
            id="browser-data"
            checked={useBrowserData}
            onCheckedChange={setUseBrowserData}
          />
          <Label htmlFor="browser-data">استخدام بيانات المتصفح (الكوكيز وبيانات الجلسة)</Label>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">الإجراءات</h3>
          <Button variant="outline" size="sm" onClick={addAction}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة إجراء
          </Button>
        </div>
        
        {actions.map((action) => (
          <Card key={action.id}>
            <CardContent className="pt-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">إجراء #{action.id}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeAction(action.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`selector-${action.id}`}>المحدد (CSS Selector)</Label>
                  <Input
                    id={`selector-${action.id}`}
                    placeholder="#email, .button, [name='password']"
                    value={action.selector}
                    onChange={(e) => updateAction(action.id, 'selector', e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`name-${action.id}`}>اسم الإجراء (اختياري)</Label>
                  <Input
                    id={`name-${action.id}`}
                    placeholder="إدخال البريد الإلكتروني"
                    value={action.name}
                    onChange={(e) => updateAction(action.id, 'name', e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`value-${action.id}`}>القيمة</Label>
                  <Input
                    id={`value-${action.id}`}
                    placeholder="القيمة التي سيتم إدخالها أو النقر عليها"
                    value={action.value}
                    onChange={(e) => updateAction(action.id, 'value', e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`delay-${action.id}`}>التأخير (بالمللي ثانية)</Label>
                  <Input
                    id={`delay-${action.id}`}
                    type="number"
                    min="0"
                    placeholder="1000"
                    value={action.delay}
                    onChange={(e) => updateAction(action.id, 'delay', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end space-x-2 space-x-reverse">
        <Button 
          onClick={runAutomation}
          disabled={isRunning || !serverConnected}
        >
          <Play className="h-4 w-4 mr-2" />
          تشغيل الأتمتة
        </Button>
      </div>
      
      {!serverConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            تعذر الاتصال بخادم الأتمتة. تأكد من تشغيله وإمكانية الوصول إليه.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SimpleAutomationSection;
