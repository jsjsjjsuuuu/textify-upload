
import React, { useState } from 'react';
import { AutomationConfig, AutomationAction } from '@/utils/automation/types';
import { AutomationService } from '@/utils/automationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle, PlusCircle, Trash2, Edit, Save } from 'lucide-react';
import { toast } from 'sonner';
import ActionEditor from './ActionEditor';
import { getAutomationServerUrl } from '@/utils/automationServerUrl';
import { v4 as uuidv4 } from 'uuid';

interface AutomationControllerProps {
  defaultUrl?: string;
}

const AutomationController: React.FC<AutomationControllerProps> = ({ defaultUrl = '' }) => {
  const [projectUrl, setProjectUrl] = useState(defaultUrl);
  const [projectName, setProjectName] = useState('مشروع أتمتة جديد');
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [serverConnected, setServerConnected] = useState(false);

  // التحقق من حالة اتصال الخادم عند تحميل المكون
  React.useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      const status = await AutomationService.checkServerStatus(false);
      setServerConnected(true);
    } catch (error) {
      setServerConnected(false);
      toast.error('تعذر الاتصال بخادم الأتمتة. يرجى التحقق من إعدادات الخادم.');
    }
  };

  const handleAddAction = () => {
    const newAction: AutomationAction = {
      name: `إجراء ${actions.length + 1}`,
      finder: '',
      value: '',
      delay: 500
    };
    setActions([...actions, newAction]);
    setEditingActionIndex(actions.length);
  };

  const handleSaveAction = (action: AutomationAction, index: number) => {
    const newActions = [...actions];
    newActions[index] = action;
    setActions(newActions);
    setEditingActionIndex(null);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    setActions(newActions);
  };

  const handleEditAction = (index: number) => {
    setEditingActionIndex(index);
  };

  const runAutomation = async () => {
    if (!projectUrl) {
      toast.error('يرجى إدخال رابط المشروع');
      return;
    }

    if (actions.length === 0) {
      toast.error('يرجى إضافة إجراء واحد على الأقل');
      return;
    }

    setIsRunning(true);
    toast.info('جاري تنفيذ الأتمتة...', { duration: 3000 });

    try {
      const config: AutomationConfig = {
        projectName,
        projectUrl,
        actions,
        automationType: 'server'
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

  const saveAutomationConfig = () => {
    try {
      const config = {
        id: uuidv4(),
        name: projectName,
        url: projectUrl,
        actions,
        createdAt: new Date().toISOString()
      };
      
      // حفظ التكوين في التخزين المحلي
      const savedConfigs = JSON.parse(localStorage.getItem('automationConfigs') || '[]');
      localStorage.setItem('automationConfigs', JSON.stringify([...savedConfigs, config]));
      
      toast.success('تم حفظ تكوين الأتمتة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ التكوين');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إعداد الأتمتة عبر الخادم</CardTitle>
          <CardDescription>
            قم بتكوين إجراءات الأتمتة لتنفيذها على خادم {getAutomationServerUrl()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">اسم المشروع</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="أدخل اسم المشروع"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectUrl">رابط المشروع</Label>
              <Input
                id="projectUrl"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="أدخل رابط المشروع"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">الإجراءات</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddAction}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                إضافة إجراء
              </Button>
            </div>

            {actions.length === 0 ? (
              <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-muted-foreground">لم تتم إضافة أي إجراءات بعد. اضغط على زر "إضافة إجراء" لإضافة إجراء جديد.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    {editingActionIndex === index ? (
                      <ActionEditor
                        action={action}
                        onSave={(updatedAction) => handleSaveAction(updatedAction, index)}
                        onCancel={() => setEditingActionIndex(null)}
                      />
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{action.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {action.finder ? `محدد: ${action.finder.substring(0, 30)}${action.finder.length > 30 ? '...' : ''}` : 'لم يتم تحديد محدد'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAction(index)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAction(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={saveAutomationConfig}
            disabled={isRunning || actions.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            حفظ التكوين
          </Button>
          <Button
            onClick={runAutomation}
            disabled={isRunning || actions.length === 0 || !serverConnected}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري التنفيذ...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                تشغيل الأتمتة
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AutomationController;
