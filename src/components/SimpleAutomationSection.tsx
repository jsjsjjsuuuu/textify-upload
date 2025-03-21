
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
import { toast as sonnerToast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";

interface SimpleAction {
  id: string;
  selector: string;
  name: string;
  value: string;
  delay: string;
}

interface SavedAutomation {
  id: string;
  name: string;
  url: string;
  actions: SimpleAction[];
  createdAt: string;
  useBrowserData: boolean;
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
  
  // إضافة حالات للنوافذ المنبثقة
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [savedAutomations, setSavedAutomations] = useState<SavedAutomation[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);

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
    
    // تحميل الأتمتة المحفوظة
    loadSavedAutomationsList();
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

  // تحميل قائمة الأتمتة المحفوظة
  const loadSavedAutomationsList = () => {
    try {
      const savedAutomationsString = localStorage.getItem('saved_automations');
      if (savedAutomationsString) {
        const automations = JSON.parse(savedAutomationsString) as SavedAutomation[];
        setSavedAutomations(automations);
      }
    } catch (error) {
      console.error('خطأ في تحميل قائمة الأتمتة المحفوظة:', error);
    }
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
    sonnerToast('جاري تنفيذ الأتمتة...');

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
        useBrowserData
      };

      const result = await AutomationService.validateAndRunAutomation(config);
      
      if (result.success) {
        sonnerToast.success('تم تنفيذ الأتمتة بنجاح!');
      } else {
        sonnerToast.error(`فشل تنفيذ الأتمتة: ${result.message}`);
      }
    } catch (error) {
      console.error('خطأ أثناء تنفيذ الأتمتة:', error);
      sonnerToast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const saveAutomation = () => {
    if (!projectName.trim()) {
      sonnerToast.error('يرجى إدخال اسم للمشروع');
      return;
    }

    try {
      const automationToSave: SavedAutomation = {
        id: Date.now().toString(),
        name: projectName,
        url: projectUrl,
        actions: actions,
        createdAt: new Date().toISOString(),
        useBrowserData
      };
      
      // إضافة الأتمتة الجديدة إلى القائمة المحفوظة
      const updatedAutomations = [...savedAutomations, automationToSave];
      localStorage.setItem('saved_automations', JSON.stringify(updatedAutomations));
      setSavedAutomations(updatedAutomations);
      
      sonnerToast.success('تم حفظ الأتمتة بنجاح');
      setIsSaveDialogOpen(false);
    } catch (error) {
      sonnerToast.error('حدث خطأ أثناء حفظ الأتمتة');
    }
  };

  const loadSelectedAutomation = () => {
    if (!selectedAutomation) {
      sonnerToast.error('يرجى اختيار أتمتة لتحميلها');
      return;
    }
    
    try {
      const automationToLoad = savedAutomations.find(automation => automation.id === selectedAutomation);
      
      if (automationToLoad) {
        setProjectName(automationToLoad.name);
        setProjectUrl(automationToLoad.url);
        setActions(automationToLoad.actions);
        if (automationToLoad.useBrowserData !== undefined) {
          setUseBrowserData(automationToLoad.useBrowserData);
        }
        
        sonnerToast.success('تم تحميل الأتمتة بنجاح');
        setIsLoadDialogOpen(false);
      }
    } catch (error) {
      sonnerToast.error('حدث خطأ أثناء تحميل الأتمتة');
    }
  };

  const deleteAutomation = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const updatedAutomations = savedAutomations.filter(automation => automation.id !== id);
      localStorage.setItem('saved_automations', JSON.stringify(updatedAutomations));
      setSavedAutomations(updatedAutomations);
      
      if (selectedAutomation === id) {
        setSelectedAutomation(null);
      }
      
      sonnerToast.success('تم حذف الأتمتة بنجاح');
    } catch (error) {
      sonnerToast.error('حدث خطأ أثناء حذف الأتمتة');
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
              <Plus className="h-4 w-4 ml-1" />
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
          <Button variant="outline" onClick={() => setIsSaveDialogOpen(true)}>
            <Save className="h-4 w-4 ml-1" />
            حفظ
          </Button>
          <Button variant="outline" onClick={() => {
            loadSavedAutomationsList();
            setIsLoadDialogOpen(true);
          }}>
            <Database className="h-4 w-4 ml-1" />
            تحميل
          </Button>
        </div>
        <Button 
          onClick={runAutomation} 
          disabled={isRunning || !projectUrl || (!serverConnected && !isPreviewMode)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Play className="h-4 w-4 ml-1" />
          {isRunning ? 'جاري التنفيذ...' : 'تشغيل الأتمتة'}
        </Button>
      </CardFooter>

      {/* نافذة حفظ الأتمتة */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>حفظ الأتمتة</DialogTitle>
            <DialogDescription>
              قم بحفظ إعدادات الأتمتة الحالية لاستخدامها لاحقًا
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="save-project-name">اسم المشروع</Label>
              <Input
                id="save-project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1"
                placeholder="اسم المشروع"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="button" onClick={saveAutomation}>
              <Save className="h-4 w-4 ml-1" />
              حفظ الأتمتة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تحميل الأتمتة */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تحميل الأتمتة</DialogTitle>
            <DialogDescription>
              اختر واحدة من الأتمتة المحفوظة مسبقًا لتحميلها
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {savedAutomations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد أتمتة محفوظة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedAutomations.map((automation) => (
                  <div
                    key={automation.id}
                    className={`border rounded-md p-3 cursor-pointer flex justify-between items-center ${
                      selectedAutomation === automation.id
                        ? "border-primary bg-primary/10"
                        : "hover:border-gray-400"
                    }`}
                    onClick={() => setSelectedAutomation(automation.id)}
                  >
                    <div>
                      <p className="font-medium">{automation.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[300px]">
                        {automation.url}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(automation.createdAt).toLocaleString('ar-IQ')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={(e) => deleteAutomation(automation.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsLoadDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              type="button" 
              onClick={loadSelectedAutomation}
              disabled={!selectedAutomation || savedAutomations.length === 0}
            >
              <Database className="h-4 w-4 ml-1" />
              تحميل الأتمتة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SimpleAutomationSection;
