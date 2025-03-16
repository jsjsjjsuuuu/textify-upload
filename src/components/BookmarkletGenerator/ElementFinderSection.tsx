import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Trash, Plus, MoreHorizontal, Repeat, ArrowDownUp, 
  PlayCircle, Download, Copy, AlertCircle, CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AutomationService } from "@/utils/automationService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AutomationAction } from "@/utils/automation/types";

// تحديث واجهة ElementAction لتتوافق مع AutomationAction
interface ElementAction {
  id: string;
  name: string;
  finder: string;
  value: string;
  delay: string; // نبقي على النوع string في واجهة المستخدم لسهولة الإدخال
}

interface ElementFinderSectionProps {
  projectName?: string;
  projectUrl?: string;
}

const ElementFinderSection: React.FC<ElementFinderSectionProps> = ({ 
  projectName = "malhalal-exp.com",
  projectUrl = "https://malhalal-exp.com/add_newwaslinserter.php?add"
}) => {
  
  const [actions, setActions] = useState<ElementAction[]>([
    { id: "1", name: "", finder: "//input[@name=\"id_wasl\"][@id=\"id_wasl\"][@value=\"\"]", value: "12421311", delay: "" },
    { id: "2", name: "", finder: "//input[@name=\"phone_customer\"][@id=\"phone_customer\"]", value: "07710284844", delay: "" },
    { id: "3", name: "", finder: "//*[@id=\"botdiv\"]/div/span/span[1]/span", value: "صلاح الدين", delay: "" },
    { id: "4", name: "", finder: "/html/body/div/div/div[1]/div/div/div[4]/form/div[5]/div/select", value: "الصياد", delay: "1" },
    { id: "5", name: "", finder: "/html/body/div/div/div[1]/div/div/div[4]/form/div[6]/div/select", value: "جاسم دخيل", delay: "" },
    { id: "6", name: "", finder: "//input[@name=\"total_price\"][@id=\"total_price\"][@value", value: "45000", delay: "" },
  ]);
  
  const [enabled, setEnabled] = useState(true);
  const [projectNameInput, setProjectNameInput] = useState(projectName);
  const [projectUrlInput, setProjectUrlInput] = useState(projectUrl);
  
  // إضافة حالات جديدة للأتمتة
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);
  const [automationResults, setAutomationResults] = useState<any>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [automationProgress, setAutomationProgress] = useState(0);
  const [serverStatus, setServerStatus] = useState<{ status: string; message: string } | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const { toast } = useToast();

  // التحقق من حالة الخادم عند تحميل المكون
  useEffect(() => {
    checkServerStatus();
  }, []);

  // التحقق من حالة خادم الأتمتة
  const checkServerStatus = async () => {
    try {
      const status = await AutomationService.checkServerStatus();
      setServerStatus(status);
      setOfflineMode(false);
      if (status.status === 'running') {
        toast({
          title: "خادم الأتمتة متصل",
          description: "تم الاتصال بخادم الأتمتة بنجاح",
        });
      } else {
        toast({
          title: "خادم الأتمتة غير متصل",
          description: "تعذر الاتصال بخادم الأتمتة. تأكد من تشغيل الخادم المحلي.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setServerStatus({
        status: 'error',
        message: 'فشل الاتصال بخادم الأتمتة'
      });
      
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بخادم الأتمتة. تم تفعيل الوضع التجريبي.",
        variant: "destructive"
      });
    }
  };

  // تشغيل الأتمتة مع Puppeteer أو في الوضع التجريبي
  const runAutomation = async () => {
    if (isRunningAutomation) return;
    
    // التحقق من وجود URL للمشروع
    if (!projectUrlInput) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال عنوان URL للمشروع",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من وجود إجراءات
    if (actions.length === 0) {
      toast({
        title: "خطأ",
        description: "لا توجد إجراءات للتنفيذ",
        variant: "destructive"
      });
      return;
    }
    
    setIsRunningAutomation(true);
    setAutomationProgress(10);
    
    try {
      // إعداد تكوين الأتمتة - تحويل delay من string إلى number
      const config = {
        projectName: projectNameInput,
        projectUrl: projectUrlInput,
        actions: actions.map(action => ({
          name: action.name,
          finder: action.finder,
          value: action.value,
          delay: action.delay ? parseInt(action.delay, 10) : 0 // تحويل delay إلى رقم
        })) as AutomationAction[]
      };
      
      setAutomationProgress(30);
      
      // تنفيذ الأتمتة على الخادم أو محاكاة في وضع غير متصل
      let result;
      
      if ((serverStatus?.status === 'running' && !offlineMode)) {
        // استخدام خادم الأتمتة
        result = await AutomationService.runAutomation(config);
      } else {
        // محاكاة الأتمتة في وضع غير متصل (التجريبي)
        setAutomationProgress(50);
        
        // محاكاة تأخير لجعل التجربة واقعية
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setAutomationProgress(70);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // إنشاء نتائج محاكاة
        result = {
          success: true,
          message: "تم تنفيذ المحاكاة بنجاح (وضع غير متصل)",
          results: actions.map(action => ({
            name: action.name || "بلا اسم",
            success: Math.random() > 0.1, // 90% فرصة للنجاح
            message: Math.random() > 0.1 ? "تم تنفيذ الإجراء بنجاح" : "حدثت مشكلة في تنفيذ الإجراء"
          })),
          // صورة مزيفة للعرض في وضع غير متصل
          screenshot: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAET0lEQVR4nO3UQREAAAjDMOZf9DDBwQeSVsAHJiuAwE8BYBKWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlguLbsATrKqz7CAAAAAElFTkSuQmCC"
        };
        
        // تحديث حالة الوضع غير المتصل
        setOfflineMode(true);
      }
      
      setAutomationProgress(100);
      setAutomationResults(result);
      
      if (result.success) {
        toast({
          title: "نجاح",
          description: "تم تنفيذ الأتمتة بنجاح",
        });
        // عرض نتائج الأتمتة
        setShowResultsDialog(true);
      } else {
        toast({
          title: "خطأ",
          description: result.message || "فشل تنفيذ الأتمتة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      
      // الانتقال تلقائيًا إلى وضع المحاكاة عند حدوث خطأ
      setOfflineMode(true);
      
      // إنشاء نتائج محاكاة في حالة الخطأ
      const simulatedResult = {
        success: true,
        message: "تم تنفيذ المحاكاة بنجاح (وضع تجريبي)",
        results: actions.map(action => ({
          name: action.name || "بلا اسم",
          success: true,
          message: "تم تنفيذ الإجراء بنجاح (محاكاة)"
        })),
        screenshot: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAET0lEQVR4nO3UQREAAAjDMOZf9DDBwQeSVsAHJiuAwE8BYBKWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlgEJYABmEJYBCWAAZhCWAQlgAGYQlguLbsATrKqz7CAAAAAElFTkSuQmCC
      };
      
      setAutomationProgress(100);
      setAutomationResults(simulatedResult);
      
      toast({
        title: "تم التشغيل في الوضع التجريبي",
        description: "تعذر الاتصال بالخادم. تم تنفيذ المحاكاة بنجاح.",
      });
      
      // عرض نتائج المحاكاة
      setShowResultsDialog(true);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  
  
  const addNewAction = () => {
    const newId = (actions.length + 1).toString();
    setActions([...actions, { id: newId, name: "", finder: "", value: "", delay: "" }]);
  };
  
  const deleteAction = (id: string) => {
    setActions(actions.filter(action => action.id !== id));
  };
  
  const updateAction = (id: string, field: keyof ElementAction, value: string) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, [field]: value } : action
    ));
  };
  
  // استرجاع البيانات من التخزين المحلي عند بدء التشغيل
  useEffect(() => {
    const savedData = localStorage.getItem('element_finder_data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.actions && Array.isArray(data.actions)) {
          setActions(data.actions);
        }
        if (data.projectName) setProjectNameInput(data.projectName);
        if (data.projectUrl) setProjectUrlInput(data.projectUrl);
        if (data.enabled !== undefined) setEnabled(data.enabled);
      } catch (e) {
        console.error("خطأ في تحليل البيانات المحفوظة:", e);
      }
    }
  }, []);
  
  // حفظ البيانات في التخزين المحلي عند التغيير
  useEffect(() => {
    const dataToSave = {
      actions,
      projectName: projectNameInput,
      projectUrl: projectUrlInput,
      enabled
    };
    localStorage.setItem('element_finder_data', JSON.stringify(dataToSave));
  }, [actions, projectNameInput, projectUrlInput, enabled]);
  
  const generateScript = () => {
    
    
    const scriptTemplate = `// سكريبت تكوين تلقائي تم إنشاؤه
const config = {
  projectName: "${projectNameInput}",
  projectUrl: "${projectUrlInput}",
  actions: [
${actions.map(action => `    {
      name: "${action.name}",
      finder: "${action.finder.replace(/"/g, '\\"')}",
      value: "${action.value.replace(/"/g, '\\"')}",
      delay: ${action.delay ? parseInt(action.delay, 10) : 0}
    }`).join(',\n')}
  ]
};

// تنفيذ الإجراءات
async function runActions() {
  console.log("بدء تنفيذ الإجراءات...");
  
  for (const action of config.actions) {
    try {
      // تأخير قبل كل إجراء
      const delay = action.delay || 0;
      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay * 1000));
      }
      
      // العثور على العنصر
      let element;
      if (action.finder.startsWith("//") || action.finder.startsWith("/html")) {
        // XPath
        const elements = document.evaluate(action.finder, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (elements.snapshotLength > 0) {
          element = elements.snapshotItem(0);
        }
      } else if (action.finder.startsWith("#")) {
        // معرف
        element = document.querySelector(action.finder);
      } else if (action.finder.startsWith(".")) {
        // فئة
        element = document.querySelector(action.finder);
      } else if (action.finder.startsWith("Name::")) {
        // اسم
        const name = action.finder.replace("Name::", "");
        element = document.querySelector(\`[name="\${name}"]\`);
      } else if (action.finder.startsWith("TagName::")) {
        // اسم العلامة
        const tag = action.finder.replace("TagName::", "");
        element = document.querySelector(tag);
      } else if (action.finder.startsWith("ClassName::")) {
        // اسم الفئة
        const className = action.finder.replace("ClassName::", "");
        const classes = className.split(" ");
        let selector = "";
        for (const cls of classes) {
          selector += "." + cls;
        }
        element = document.querySelector(selector);
      } else if (action.finder.startsWith("Selector::")) {
        // محدد CSS
        const selector = action.finder.replace("Selector::", "");
        element = document.querySelector(selector);
      } else if (action.finder.startsWith("SelectorAll::")) {
        // محدد الكل
        const selector = action.finder.replace("SelectorAll::", "");
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          element = elements[0];
        }
      } else {
        // افتراضي: محاولة كمحدد css
        element = document.querySelector(action.finder);
      }
      
      if (!element) {
        console.error(\`لم يتم العثور على العنصر: \${action.finder}\`);
        continue;
      }
      
      // تعيين القيمة حسب نوع العنصر
      if (element.tagName === "SELECT") {
        // القائمة المنسدلة
        for (let i = 0; i < element.options.length; i++) {
          if (element.options[i].text === action.value || element.options[i].value === action.value) {
            element.selectedIndex = i;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      } else if (element.tagName === "INPUT") {
        // حقول الإدخال
        element.value = action.value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (element.tagName === "TEXTAREA") {
        // مناطق النص
        element.value = action.value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // عناصر أخرى (زر، نص)
        if (element.click) {
          element.click();
        } else {
          // محاولة محاكاة النقر
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          element.dispatchEvent(event);
        }
      }
      
      console.log(\`تم تنفيذ الإجراء "\${action.name || 'بلا اسم'}" بنجاح\`);
    } catch (error) {
      console.error(\`خطأ في تنفيذ الإجراء "\${action.name || 'بلا اسم'}":\`, error);
    }
  }
  
  console.log("انتهت جميع الإجراءات");
}

// بدء التنفيذ
if (window.location.href !== config.projectUrl) {
  console.log(\`الانتقال إلى \${config.projectUrl}\`);
  window.location.href = config.projectUrl;
} else {
  // انتظار تحميل الصفحة بالكامل
  if (document.readyState === 'complete') {
    runActions();
  } else {
    window.addEventListener('load', runActions);
  }
}`;

    return scriptTemplate;
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <span>مكتشف العناصر</span>
            <Badge variant="outline" className="mr-2 bg-amber-100">جديد</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-finder-switch" className="ml-2">تمكين التكوين</Label>
            <Switch
              id="auto-finder-switch"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Button variant="outline" size="icon" onClick={checkServerStatus}>
              <Repeat className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setActions([])} 
              title="مسح جميع الإجراءات"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        
        {offlineMode && (
          <Alert className="mt-4 bg-yellow-50 border-yellow-200">
            <CheckCircle2 className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              الوضع التجريبي نشط - سيتم محاكاة العمليات بدون الحاجة للاتصال بالخادم
            </AlertDescription>
          </Alert>
        )}
        
        {serverStatus && serverStatus.status !== 'running' && !offlineMode && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              خادم الأتمتة غير متصل. يُرجى تشغيل الخادم المحلي باستخدام الأمر: <code>node src/server/server.js</code>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 ml-auto mr-2 block bg-white"
                onClick={() => setOfflineMode(true)}
              >
                استخدام الوضع التجريبي
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="project-name">اسم التكوين</Label>
            <Input
              id="project-name"
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="project-url">رابط المشروع <span className="text-red-500">*</span></Label>
            <Input
              id="project-url"
              value={projectUrlInput}
              onChange={(e) => setProjectUrlInput(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-lg">الإجراءات</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={runAutomation}
              disabled={isRunningAutomation}
            >
              <PlayCircle className="h-4 w-4 ml-1" />
              {offlineMode ? "تشغيل المحاكاة" : "تشغيل الأتمتة"}
            </Button>
            <Button variant="outline" size="sm" onClick={addNewAction}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة إجراء
            </Button>
          </div>
        </div>
        
        {isRunningAutomation && (
          <div className="mb-4">
            <Progress value={automationProgress} className="h-2" />
            <p className="text-center text-sm mt-1">جاري تنفيذ الأتمتة... {automationProgress}%</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-right">
                <th className="pb-2 font-medium text-sm">#</th>
                <th className="pb-2 font-medium text-sm">الاسم</th>
                <th className="pb-2 font-medium text-sm">
                  مكتشف العناصر <span className="text-red-500">*</span>
                </th>
                <th className="pb-2 font-medium text-sm">قيمة</th>
                <th className="pb-2 font-medium text-sm">
                  الفاصل الزمني
                </th>
                <th className="pb-2 font-medium text-sm" colSpan={2}></th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id} className="border-t border-gray-200">
                  <td className="py-2 pr-2">{action.id}</td>
                  <td className="py-2 pr-2">
                    <Input 
                      value={action.name}
                      onChange={(e) => updateAction(action.id, 'name', e.target.value)}
                      className="w-full"
                      placeholder="اسم الإجراء"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input 
                      value={action.finder}
                      onChange={(e) => updateAction(action.id, 'finder', e.target.value)}
                      className="w-full"
                      placeholder="//xpath | #id | .class | Name::name"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input 
                      value={action.value}
                      onChange={(e) => updateAction(action.id, 'value', e.target.value)}
                      className="w-full"
                      placeholder="القيمة المُدخلة"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input 
                      value={action.delay}
                      onChange={(e) => updateAction(action.id, 'delay', e.target.value)}
                      className="w-full"
                      placeholder="بالثواني"
                      type="number"
                      min="0"
                      step="1"
                    />
                  </td>
                  <td className="py-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteAction(action.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                  <td className="py-2">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap justify-between gap-2 border-t pt-6">
        <div className="text-sm text-slate-500">
          {actions.length > 0
            ? `${actions.length} عنصر قابل للتنفيذ`
            : 'لا توجد إجراءات محددة بعد'}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // نسخ السكريبت إلى الحافظة
              const script = generateScript();
              navigator.clipboard.writeText(script);
              toast({
                title: "تم النسخ",
                description: "تم نسخ السكريبت إلى الحافظة",
              });
            }}
          >
            <Copy className="h-4 w-4 ml-1" />
            نسخ السكريبت
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              const script = generateScript();
              const blob = new Blob([script], {type: 'text/javascript'});
              const href = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = href;
              link.download = `${projectNameInput || 'config'}.js`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(href);
              toast({
                title: "تم التصدير",
                description: "تم تصدير السكريبت بنجاح",
              });
            }}
          >
            <Download className="h-4 w-4 ml-1" />
            تصدير
          </Button>
        </div>
      </CardFooter>
      
      {/* مربع حوار لعرض نتائج الأتمتة */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>نتائج التشغيل الآلي {offlineMode ? "(الوضع التجريبي)" : ""}</DialogTitle>
          </DialogHeader>
          
          {automationResults && (
            <div className="space-y-4">
              <div className="flex items-center">
                <Badge variant={automationResults.success ? "success" : "destructive"} className="ml-2">
                  {automationResults.success ? "ناجح" : "فشل"}
                </Badge>
                <span>{automationResults.message}</span>
              </div>
              
              {automationResults.results && (
                <div>
                  <h4 className="text-sm font-medium mb
