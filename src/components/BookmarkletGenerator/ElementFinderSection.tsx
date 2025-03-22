import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { AutomationConfig, AutomationAction } from "@/utils/automation/types";
import { AutomationService } from "@/utils/automationService";

// استيراد المكونات الفرعية
import ProjectForm from "./ElementFinder/ProjectForm";
import ActionsList from "./ElementFinder/ActionsList";
import ExecutionStatus from "./ElementFinder/ExecutionStatus";
import BrowserToggle from "./ElementFinder/BrowserToggle";
import ExportTools from "./ElementFinder/ExportTools";
import RunButton from "./ElementFinder/RunButton";

interface ElementFinderProps {
  onBookmarkletGenerated?: (code: string) => void;
}

const ElementFinderSection: React.FC<ElementFinderProps> = ({ onBookmarkletGenerated }) => {
  const [actions, setActions] = useState<{ name: string; finder: string; value: string; delay: string }[]>([
    { name: "click", finder: "", value: "", delay: "500" },
  ]);
  const [projectUrl, setProjectUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [useRealBrowser, setUseRealBrowser] = useState(true); // تغيير القيمة الافتراضية إلى true
  const [actionType, setActionType] = useState("click");
  const [customName, setCustomName] = useState("");
  const [automationProgress, setAutomationProgress] = useState(0);
  const [automationStatus, setAutomationStatus] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  
  const { toast: hookToast } = useToast();

  // التحقق من صحة المحددات CSS قبل التنفيذ
  const validateSelectors = (): boolean => {
    let isValid = true;
    const invalidSelectors: string[] = [];
    
    actions.forEach((action, index) => {
      // التحقق من وجود المحدد
      if (!action.finder.trim()) {
        invalidSelectors.push(`الإجراء #${index+1}: محدد CSS فارغ`);
        isValid = false;
        return;
      }
      
      // محاولة التحقق من صحة بناء محدد CSS
      try {
        // تجاهل أخطاء تنسيق CSS إذا كان المحدد يحتوي على عدة محددات
        if (action.finder.includes(',')) return;
        
        // التحقق من صحة المحدد عن طريق محاولة تحديد عنصر (حتى لو كانت النتيجة فارغة)
        document.querySelector(action.finder);
      } catch (error) {
        invalidSelectors.push(`الإجراء #${index+1}: محدد CSS غير صالح (${action.finder})`);
        isValid = false;
      }
    });
    
    if (!isValid) {
      toast.error("يوجد أخطاء في محددات CSS", {
        description: invalidSelectors.join('، '),
        duration: 6000,
      });
    }
    
    return isValid;
  };
  
  const handleAddAction = () => {
    setActions([...actions, { name: actionType, finder: "", value: "", delay: "500" }]);
  };
  
  const handleRemoveAction = (index: number) => {
    const newActions = [...actions];
    newActions.splice(index, 1);
    setActions(newActions);
  };
  
  const handleActionChange = (index: number, field: keyof (typeof actions)[0], value: string) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleRunAutomation = async () => {
    if (!projectUrl) {
      toast.error("يجب إدخال رابط المشروع");
      return;
    }
    
    if (actions.length === 0 || !actions.some(a => a.finder.trim())) {
      toast.error("يجب إضافة إجراء واحد على الأقل مع محدد");
      return;
    }
    
    // التحقق من صحة URL
    if (!projectUrl.startsWith('http://') && !projectUrl.startsWith('https://')) {
      toast.error("يجب أن يبدأ رابط المشروع بـ http:// أو https://");
      return;
    }
    
    // التحقق من صحة المحددات
    if (!validateSelectors()) {
      return;
    }
    
    setIsRunning(true);
    setAutomationProgress(5);
    setAutomationStatus("جاري بدء الأتمتة...");
    setServerError(null);
    
    try {
      // تأكيد إلى المستخدم أن العملية بدأت
      toast.info("جاري بدء عملية الأتمتة", {
        description: "سيتم تنفيذ الأتمتة على الخادم باستخدام متصفح حقيقي. قد يستغرق هذا بضع ثوانٍ."
      });
      
      // تحسين كائن الأتمتة
      const config: AutomationConfig = {
        projectName: customName || "محدد العناصر",
        projectUrl: projectUrl,
        actions: actions.map(action => {
          // تحويل الإجراءات إلى الشكل المطلوب للخادم وإضافة وصف للتسهيل
          const serverAction: AutomationAction = {
            name: action.name === "click" ? "انقر" : 
                 action.name === "type" ? "أدخل نص" : 
                 action.name === "select" ? "اختر من قائمة" : action.name,
            type: action.name, // إضافة خاصية type مطلوبة
            finder: action.finder,
            value: action.value || (action.name === "click" ? "click" : ""),
            delay: action.delay ? parseInt(action.delay, 10) : 500, // زيادة التأخير الافتراضي
            description: `${action.name} - ${action.finder}`
          };
          return serverAction;
        }),
        automationType: 'server' as 'server' | 'client',
        useBrowserData: true,
        forceRealExecution: true, // تأكيد أن التنفيذ يجب أن يكون حقيقياً
        timeout: 60000, // زيادة مهلة التنفيذ إلى 60 ثانية
        retries: 2, // إضافة محاولات إعادة المحاولة
      };
      
      console.log("بدء تنفيذ الأتمتة بالإعدادات:", config);
      
      setAutomationProgress(15);
      setAutomationStatus("جاري الاتصال بالخادم...");
      
      // تحديث حالة التقدم خلال التنفيذ
      const progressInterval = setInterval(() => {
        setAutomationProgress(prev => {
          // زيادة النسبة تدريجياً حتى 90% كحد أقصى
          if (prev < 90) {
            return prev + (prev < 30 ? 1 : prev < 60 ? 2 : 1);
          }
          return prev;
        });
      }, 1000);
      
      // تحديث رسائل الحالة تلقائياً
      setTimeout(() => {
        if (isRunning) {
          setAutomationStatus("جاري تهيئة المتصفح على الخادم...");
        }
      }, 3000);
      
      setTimeout(() => {
        if (isRunning) {
          setAutomationStatus("جاري فتح الموقع المستهدف...");
        }
      }, 8000);
      
      setTimeout(() => {
        if (isRunning) {
          setAutomationStatus("جاري تنفيذ الإجراءات...");
        }
      }, 15000);
      
      // تنفيذ الأتمتة
      const result = await AutomationService.validateAndRunAutomation(config);
      
      // إيقاف التحديث التلقائي
      clearInterval(progressInterval);
      
      setAutomationProgress(100);
      
      if (result.success) {
        setAutomationStatus("تم تنفيذ الأتمتة بنجاح!");
        toast.success("تم تنفيذ الأتمتة بنجاح");
        
        // عرض النتائج بشكل أفضل
        hookToast({
          title: "نتائج الأتمتة",
          description: (
            <div className="mt-2 space-y-2">
              <p>تم تنفيذ {result.results?.filter(r => r.success).length || 0} إجراء بنجاح من أصل {result.results?.length || 0}</p>
              {result.results && result.results.some(r => !r.success) && (
                <p className="text-amber-500">فشل تنفيذ {result.results.filter(r => !r.success).length} إجراء</p>
              )}
              <p>وقت التنفيذ: {(result.executionTime || 0) / 1000} ثانية</p>
            </div>
          ),
        });
      } else {
        setAutomationStatus("فشل تنفيذ الأتمتة");
        setServerError(result.message || "حدث خطأ غير معروف أثناء تنفيذ الأتمتة");
        toast.error(`فشل تنفيذ الأتمتة: ${result.message}`);
      }
    } catch (error) {
      setAutomationProgress(100);
      setAutomationStatus("فشل تنفيذ الأتمتة");
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
      setServerError(errorMessage);
      toast.error(`حدث خطأ أثناء تنفيذ الأتمتة: ${errorMessage}`);
      console.error("خطأ مفصل أثناء تنفيذ الأتمتة:", error);
    } finally {
      setIsRunning(false);
    }
  };
  
  const generateBookmarkletCode = () => {
    const code = `javascript:(function(){
      console.log("محدد العناصر: بدء التشغيل");
      const actions = ${JSON.stringify(actions)};
      const executeActions = async (actions) => {
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          console.log(\`تنفيذ الإجراء \${i+1}: \${action.name}\`);
          
          try {
            // البحث عن العنصر باستخدام المحدد
            const element = document.querySelector(action.finder);
            if (!element) {
              console.error(\`لم يتم العثور على العنصر باستخدام المحدد: \${action.finder}\`);
              alert(\`فشل الإجراء \${i+1}: لم يتم العثور على العنصر\`);
              continue;
            }
            
            // تنفيذ الإجراء حسب النوع
            switch (action.name) {
              case "click":
                element.click();
                break;
              case "input":
              case "type":
                if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                  element.value = action.value;
                  // إطلاق حدث تغيير القيمة
                  element.dispatchEvent(new Event('input', { bubbles: true }));
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                }
                break;
              case "select":
                if (element instanceof HTMLSelectElement) {
                  element.value = action.value;
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                }
                break;
              default:
                console.warn(\`نوع الإجراء غير معروف: \${action.name}\`);
            }
            
            console.log(\`تم تنفيذ الإجراء \${i+1} بنجاح\`);
            
            // انتظار قبل تنفيذ الإجراء التالي
            if (action.delay) {
              await new Promise(resolve => setTimeout(resolve, parseInt(action.delay, 10)));
            }
          } catch (error) {
            console.error(\`خطأ في تنفيذ الإجراء \${i+1}:\`, error);
            alert(\`فشل الإجراء \${i+1}: \${error.message}\`);
          }
        }
        console.log("محدد العناصر: انتهى التنفيذ");
      };
      
      executeActions(actions);
    })();`;
    
    if (onBookmarkletGenerated) {
      onBookmarkletGenerated(code);
    }
    
    return code;
  };
  
  const handleCopyBookmarklet = () => {
    const code = generateBookmarkletCode();
    navigator.clipboard.writeText(code);
    toast.success("تم نسخ الكود إلى الحافظة");
  };
  
  const handleExportJson = () => {
    try {
      const dataStr = JSON.stringify(actions, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportName = `element-finder-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportName);
      linkElement.click();
      
      toast.success("تم تصدير الإجراءات بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تصدير الإجراءات");
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>محدد العناصر</CardTitle>
        <CardDescription>
          أداة تساعدك في البحث عن العناصر على صفحات الويب وتنفيذ إجراءات عليها
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* نموذج المشروع */}
        <ProjectForm
          projectUrl={projectUrl}
          customName={customName}
          isRunning={isRunning}
          onProjectUrlChange={setProjectUrl}
          onCustomNameChange={setCustomName}
        />
        
        {/* قائمة الإجراءات */}
        <ActionsList
          actions={actions}
          isRunning={isRunning}
          onAddAction={handleAddAction}
          onRemoveAction={handleRemoveAction}
          onActionChange={handleActionChange}
        />
        
        {/* حالة التنفيذ */}
        <ExecutionStatus
          isRunning={isRunning}
          automationProgress={automationProgress}
          automationStatus={automationStatus}
          serverError={serverError}
        />
        
        {/* تبديل المتصفح */}
        <BrowserToggle
          useRealBrowser={useRealBrowser}
          isRunning={isRunning}
          onToggle={setUseRealBrowser}
        />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        {/* أدوات التصدير */}
        <ExportTools
          isRunning={isRunning}
          onCopyBookmarklet={handleCopyBookmarklet}
          onExportJson={handleExportJson}
        />
        
        {/* زر التشغيل */}
        <RunButton isRunning={isRunning} onRun={handleRunAutomation} />
      </CardFooter>
    </Card>
  );
};

export default ElementFinderSection;
