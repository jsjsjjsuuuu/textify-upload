
import React, { useState, useEffect } from 'react';
import { AutomationConfig, AutomationAction } from '@/utils/automation/types';
import { AutomationService } from '@/utils/automationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle, PlusCircle, Trash2, Edit, Save, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import ActionEditor from './ActionEditor';
import { getAutomationServerUrl, isPreviewEnvironment } from '@/utils/automationServerUrl';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AutomationControllerProps {
  defaultUrl?: string;
}

interface ExtractedDataType {
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  address?: string;
  notes?: string;
  sourceId?: string;
}

const AutomationController: React.FC<AutomationControllerProps> = ({ defaultUrl = '' }) => {
  const [projectUrl, setProjectUrl] = useState(defaultUrl);
  const [projectName, setProjectName] = useState('مشروع أتمتة جديد');
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [serverConnected, setServerConnected] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDataType | null>(null);

  // التحقق من حالة اتصال الخادم عند تحميل المكون
  useEffect(() => {
    checkServerConnection();
    
    // التحقق من وجودنا في بيئة المعاينة
    const previewMode = isPreviewEnvironment();
    setIsPreviewMode(previewMode);
    
    if (previewMode) {
      toast.warning("أنت في بيئة المعاينة. ستعمل الأتمتة في وضع المحاكاة فقط.", {
        duration: 5000,
      });
    }
    
    // التحقق من وجود بيانات مستخرجة
    const savedData = localStorage.getItem('automationData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setExtractedData(parsedData);
        if (parsedData.companyName) {
          setProjectName(`أتمتة بيانات ${parsedData.companyName}`);
        }
      } catch (error) {
        console.error("خطأ في قراءة البيانات المستخرجة:", error);
      }
    }
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
        
        // إذا كان المصدر من بيانات مستخرجة، نحذف البيانات المؤقتة
        if (extractedData && extractedData.sourceId) {
          localStorage.removeItem('automationData');
          setExtractedData(null);
        }
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
  
  const handleClearExtractedData = () => {
    localStorage.removeItem('automationData');
    setExtractedData(null);
    toast.info('تم مسح البيانات المستخرجة');
  };
  
  // إنشاء إجراءات تلقائية بناءً على البيانات المستخرجة
  const generateActionsFromExtractedData = () => {
    if (!extractedData) return;
    
    const newActions: AutomationAction[] = [];
    
    // إضافة إجراءات لكل حقل من البيانات المستخرجة
    if (extractedData.code) {
      newActions.push({
        name: 'إدخال الكود',
        finder: '#code', // محدد افتراضي، يجب تغييره حسب الموقع المستهدف
        value: extractedData.code,
        delay: 500
      });
    }
    
    if (extractedData.senderName) {
      newActions.push({
        name: 'إدخال اسم المرسل',
        finder: '#sender_name',
        value: extractedData.senderName,
        delay: 500
      });
    }
    
    if (extractedData.phoneNumber) {
      newActions.push({
        name: 'إدخال رقم الهاتف',
        finder: '#phone',
        value: extractedData.phoneNumber,
        delay: 500
      });
    }
    
    if (extractedData.province) {
      newActions.push({
        name: 'اختيار المحافظة',
        finder: '#province',
        value: extractedData.province,
        delay: 500
      });
    }
    
    if (extractedData.price) {
      newActions.push({
        name: 'إدخال السعر',
        finder: '#price',
        value: extractedData.price,
        delay: 500
      });
    }
    
    // إضافة إجراء للنقر على زر الإرسال
    newActions.push({
      name: 'إرسال النموذج',
      finder: 'button[type="submit"]',
      value: 'click',
      delay: 1000
    });
    
    setActions(newActions);
    toast.success('تم إنشاء إجراءات تلقائية من البيانات المستخرجة');
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
        
        {isPreviewMode && (
          <div className="px-6">
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                أنت في بيئة المعاينة (لوفابل). ستعمل الأتمتة في وضع المحاكاة فقط ولن تتصل بالمواقع الخارجية.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {extractedData && (
          <div className="px-6 mb-4">
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700 flex justify-between items-center">
                <div>
                  <span className="font-semibold">تم استيراد البيانات المستخرجة: </span>
                  {extractedData.code && <span className="ml-2">الكود: {extractedData.code}</span>}
                  {extractedData.senderName && <span className="ml-2">المرسل: {extractedData.senderName}</span>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateActionsFromExtractedData}
                    className="border-green-300 bg-white"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    إنشاء إجراءات تلقائية
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearExtractedData}
                    className="border-red-300 bg-white"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    مسح البيانات
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
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
            disabled={isRunning || actions.length === 0 || (!serverConnected && !isPreviewMode)}
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
