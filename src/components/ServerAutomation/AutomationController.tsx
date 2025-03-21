import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AutomationAction, AutomationResponse } from '@/utils/automation/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, PlayCircle, Save, Eye, List, Trash2, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import ActionEditor from './ActionEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AutomationService } from '@/utils/automationService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { isPreviewEnvironment, getLastConnectionStatus } from '@/utils/automationServerUrl';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ActionResultsList from './ActionResultsList';

// تعديل واجهة ActionEditorProps لتضمين خاصية index
interface ActionEditorProps {
  action: AutomationAction;
  index?: number; // جعله اختياري لتجنب كسر المكونات الحالية
  onUpdate: (updatedAction: AutomationAction) => void;
  onRemove: () => void;
  commonSelectors?: any;
}

const AutomationController: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [serverConnected, setServerConnected] = useState(true);
  const [automationResponse, setAutomationResponse] = useState<AutomationResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const navigate = useNavigate();
  
  // إضافة ضبط حقل URL تلقائيًا
  const defaultAction: AutomationAction = {
    name: 'انقر',
    finder: '',
    value: '',
    delay: 300
  };
  
  useEffect(() => {
    // التحقق مما إذا كنا في بيئة المعاينة
    const previewMode = isPreviewEnvironment();
    setIsPreviewMode(previewMode);
    
    if (previewMode) {
      toast.warning("أنت في بيئة المعاينة. ستعمل الأتمتة في وضع المحاكاة فقط ولن تتصل بالمواقع الخارجية.", {
        duration: 5000,
      });
    }
    
    // التحقق من حالة اتصال الخادم
    const connectionStatus = getLastConnectionStatus();
    setServerConnected(connectionStatus.isConnected);
    
    // إضافة إجراء افتراضي إذا لم تكن هناك إجراءات
    if (actions.length === 0) {
      setActions([{ ...defaultAction }]);
    }
  }, []);
  
  const handleAddAction = () => {
    setActions([...actions, { ...defaultAction }]);
  };
  
  const handleUpdateAction = (index: number, updatedAction: AutomationAction) => {
    const newActions = [...actions];
    newActions[index] = updatedAction;
    setActions(newActions);
  };
  
  const handleRemoveAction = (index: number) => {
    const newActions = [...actions];
    newActions.splice(index, 1);
    setActions(newActions);
    
    // إضافة إجراء افتراضي إذا لم تكن هناك إجراءات بعد الحذف
    if (newActions.length === 0) {
      setActions([{ ...defaultAction }]);
    }
  };
  
  const handleServerSettings = () => {
    navigate('/server-settings');
  };
  
  const handleRunAutomation = async () => {
    if (!projectUrl) {
      toast.error("يرجى إدخال رابط المشروع");
      return;
    }
    
    if (actions.length === 0) {
      toast.error("يجب إضافة إجراء واحد على الأقل");
      return;
    }
    
    // التحقق من صحة URL
    if (!projectUrl.startsWith('http://') && !projectUrl.startsWith('https://')) {
      toast.error("يجب أن يبدأ رابط المشروع بـ http:// أو https://");
      return;
    }
    
    setIsRunning(true);
    setShowResults(true);
    
    try {
      toast.info("جاري تنفيذ الأتمتة...", { duration: 3000 });
      
      const config = {
        projectName,
        projectUrl,
        actions,
        automationType: 'server' as 'server' | 'client', // إضافة تحويل نوع صريح
        useBrowserData: true
      };

      const result = await AutomationService.validateAndRunAutomation(config);
      setAutomationResponse(result);
      
      if (result.success) {
        toast.success("تم تنفيذ الأتمتة بنجاح!");
      } else {
        toast.error(`فشل تنفيذ الأتمتة: ${result.message}`);
      }
    } catch (error) {
      console.error("حدث خطأ أثناء تنفيذ الأتمتة:", error);
      toast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      
      setAutomationResponse({
        success: false,
        message: 'حدث خطأ أثناء تنفيذ الأتمتة',
        automationType: 'server',
        error: {
          message: error instanceof Error ? error.message : 'خطأ غير معروف',
          type: 'UnknownError'
        }
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleSaveAutomation = () => {
    if (!projectUrl) {
      toast.error("يرجى إدخال رابط المشروع");
      return;
    }
    
    if (actions.length === 0) {
      toast.error("يجب إضافة إجراء واحد على الأقل");
      return;
    }
    
    // التحقق من صحة URL
    if (!projectUrl.startsWith('http://') && !projectUrl.startsWith('https://')) {
      toast.error("يجب أن يبدأ رابط المشروع بـ http:// أو https://");
      return;
    }
    
    try {
      // إنشاء كائن التكوين للحفظ
      const automationConfig = {
        id: uuidv4(),
        name: projectName || `أتمتة ${new Date().toLocaleDateString('ar-EG')}`,
        url: projectUrl,
        actions,
        createdAt: new Date().toISOString()
      };
      
      // الحصول على التكوينات المحفوظة مسبقًا
      const savedConfigs = JSON.parse(localStorage.getItem('automationConfigs') || '[]');
      
      // إضافة التكوين الجديد وحفظه
      const updatedConfigs = [...savedConfigs, automationConfig];
      localStorage.setItem('automationConfigs', JSON.stringify(updatedConfigs));
      
      toast.success("تم حفظ الأتمتة بنجاح");
      
      // الانتقال إلى علامة التبويب "الأتمتة المحفوظة"
      navigate('/server-automation?tab=saved');
    } catch (error) {
      console.error("خطأ في حفظ الأتمتة:", error);
      toast.error("حدث خطأ أثناء حفظ الأتمتة");
    }
  };
  
  const handleClearResults = () => {
    setAutomationResponse(null);
    setShowResults(false);
  };
  
  // أمثلة لمحددات العناصر الشائعة
  const commonSelectors = {
    // حقول الإدخال
    inputs: [
      // محددات الاسم
      {
        name: 'حقل الاسم',
        // استخدام مزيج من محددات CSS و XPath للعثور على حقل الاسم
        finder: [
          // محددات CSS
          'input[name*="name"], input[id*="name"], input[name*="firstName"], input[id*="firstName"], input[placeholder*="اسم"], input[placeholder*="الاسم"]',
          // محددات XPath
          '//input[contains(@name, "name") or contains(@id, "name")]',
          '//input[contains(@placeholder, "اسم") or contains(@placeholder, "الاسم")]'
        ].join('\n')
      },
      // محددات البريد الإلكتروني
      {
        name: 'حقل البريد الإلكتروني',
        finder: [
          // محددات CSS
          'input[name*="email"], input[id*="email"], input[type="email"], input[placeholder*="بريد"], input[placeholder*="ايميل"], input[placeholder*="إيميل"]',
          // محددات XPath
          '//input[contains(@name, "email") or contains(@id, "email")]',
          '//input[@type="email"]',
          '//input[contains(@placeholder, "بريد") or contains(@placeholder, "ايميل") or contains(@placeholder, "إيميل")]'
        ].join('\n')
      },
      // محددات كلمة المرور
      {
        name: 'حقل كلمة المرور',
        finder: [
          // محددات CSS
          'input[name*="password"], input[id*="password"], input[type="password"], input[placeholder*="كلمة المرور"], input[placeholder*="كلمة السر"], input[placeholder*="باسوورد"]',
          // محددات XPath
          '//input[contains(@name, "password") or contains(@id, "password")]',
          '//input[@type="password"]'
        ].join('\n')
      },
      // محددات رقم الهاتف
      {
        name: 'حقل رقم الهاتف',
        // استخدام مزيج من محددات CSS و XPath للعثور على حقل رقم الهاتف
        finder: [
          // محددات CSS
          'input[name*="phone"], input[id*="phone"], input[name*="mobile"], input[id*="mobile"], input[type="tel"], input[placeholder*="رقم الهاتف"], input[placeholder*="الهاتف"], input[placeholder*="الموبايل"], input[placeholder*="الجوال"], input[placeholder*="تليفون"], input[name*="tel"], input[id*="tel"], input[name="client_phone"], input[id="client_phone"], input[name="customer_mobile"], input[id="customer_mobile"]',
          // محددات XPath
          '//input[contains(@name, "phone") or contains(@id, "phone")]',
          '//input[contains(@name, "mobile") or contains(@id, "mobile")]',
          '//input[contains(@placeholder, "هاتف") or contains(@placeholder, "جوال") or contains(@placeholder, "موبايل")]'
        ].join('\n')
      },
      // محددات العنوان
      {
        name: 'حقل العنوان',
        finder: [
          // محددات CSS
          'input[name*="address"], input[id*="address"], textarea[name*="address"], textarea[id*="address"], input[placeholder*="عنوان"], textarea[placeholder*="عنوان"]',
          // محددات XPath
          '//input[contains(@name, "address") or contains(@id, "address")]',
          '//textarea[contains(@name, "address") or contains(@id, "address")]',
          '//input[contains(@placeholder, "عنوان")]',
          '//textarea[contains(@placeholder, "عنوان")]'
        ].join('\n')
      }
    ],
    // أزرار
    buttons: [
      // زر تسجيل الدخول
      {
        name: 'زر تسجيل الدخول',
        finder: [
          // محددات CSS
          'button[type="submit"], input[type="submit"], button:contains("دخول"), button:contains("تسجيل الدخول"), a:contains("دخول"), a:contains("تسجيل الدخول"), .login-button, .sign-in-button, #login-button, #sign-in-button',
          // محددات XPath
          '//button[contains(text(), "دخول") or contains(text(), "تسجيل الدخول")]',
          '//a[contains(text(), "دخول") or contains(text(), "تسجيل الدخول")]',
          '//input[@type="submit"]',
          '//button[@type="submit"]'
        ].join('\n')
      },
      // زر التسجيل
      {
        name: 'زر التسجيل',
        finder: [
          // محددات CSS
          'button:contains("تسجيل"), button:contains("إنشاء حساب"), a:contains("تسجيل"), a:contains("إنشاء حساب"), .register-button, .sign-up-button, #register-button, #sign-up-button',
          // محددات XPath
          '//button[contains(text(), "تسجيل") or contains(text(), "إنشاء حساب")]',
          '//a[contains(text(), "تسجيل") or contains(text(), "إنشاء حساب")]'
        ].join('\n')
      },
      // زر البحث
      {
        name: 'زر البحث',
        finder: [
          // محددات CSS
          'button:contains("بحث"), button[type="search"], button.search-button, .search-btn, #search-button',
          // محددات XPath
          '//button[contains(text(), "بحث")]',
          '//button[@type="search"]'
        ].join('\n')
      },
      // زر الإرسال
      {
        name: 'زر الإرسال',
        finder: [
          // محددات CSS
          'button[type="submit"], input[type="submit"], button:contains("إرسال"), button:contains("تأكيد"), button:contains("حفظ"), .submit-button, #submit-button',
          // محددات XPath
          '//button[contains(text(), "إرسال") or contains(text(), "تأكيد") or contains(text(), "حفظ")]',
          '//button[@type="submit"]',
          '//input[@type="submit"]'
        ].join('\n')
      }
    ]
  };
  
  return (
    <div className="space-y-6">
      {!serverConnected && !isPreviewMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>تعذر الاتصال بخادم الأتمتة. قد لا تعمل الأتمتة بشكل صحيح.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleServerSettings}
              className="border-red-300 bg-white"
            >
              <Wifi className="h-4 w-4 mr-2" />
              إعدادات الخادم
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {isPreviewMode && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            أنت في بيئة المعاينة. ستعمل الأتمتة في وضع المحاكاة فقط ولن تتصل بالمواقع الخارجية.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">إعدادات الأتمتة</CardTitle>
          <CardDescription>أدخل معلومات الموقع وإعدادات الأتمتة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">اسم المشروع (اختياري)</Label>
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
                placeholder="https://example.com"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">إجراءات الأتمتة</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddAction}
              className="bg-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              إضافة إجراء
            </Button>
          </div>
          <CardDescription>أضف الإجراءات التي ترغب في تنفيذها على الموقع</CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="text-center py-8">
              <List className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">لا توجد إجراءات</h3>
              <p className="text-muted-foreground mb-4">
                أضف إجراءات لتنفيذها على الموقع
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddAction}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                إضافة إجراء جديد
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {actions.map((action, index) => (
                  <ActionEditor
                    key={index}
                    action={action}
                    index={index} // تمرير index كخاصية جديدة
                    onUpdate={(updatedAction) => handleUpdateAction(index, updatedAction)}
                    onRemove={() => handleRemoveAction(index)}
                    commonSelectors={commonSelectors}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button 
            variant="outline" 
            onClick={handleSaveAutomation}
            disabled={isRunning}
          >
            <Save className="h-4 w-4 mr-2" />
            حفظ الأتمتة
          </Button>
          <Button 
            onClick={handleRunAutomation}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
      
      {showResults && automationResponse && (
        <ActionResultsList 
          automationResponse={automationResponse} 
          onHideResults={handleClearResults} 
        />
      )}
    </div>
  );
};

export default AutomationController;
