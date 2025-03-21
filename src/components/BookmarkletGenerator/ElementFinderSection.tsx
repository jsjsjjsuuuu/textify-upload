
import React, { useState } from "react";
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
    { name: "click", finder: "", value: "", delay: "300" },
  ]);
  const [projectUrl, setProjectUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [useRealBrowser, setUseRealBrowser] = useState(false);
  const [actionType, setActionType] = useState("click");
  const [customName, setCustomName] = useState("");
  const [automationProgress, setAutomationProgress] = useState(0);
  const [automationStatus, setAutomationStatus] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  
  const { toast: hookToast } = useToast();
  
  const handleAddAction = () => {
    setActions([...actions, { name: actionType, finder: "", value: "", delay: "300" }]);
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
    
    setIsRunning(true);
    setAutomationProgress(10);
    setAutomationStatus("جاري بدء الأتمتة...");
    setServerError(null);
    
    try {
      // إعداد كائن الأتمتة
      const config: AutomationConfig = {
        projectName: customName || "محدد العناصر",
        projectUrl: projectUrl,
        actions: actions.map(action => ({
          name: action.name,
          finder: action.finder,
          value: action.value,
          delay: action.delay ? parseInt(action.delay, 10) : 0 // تحويل delay إلى رقم
        })) as AutomationAction[],
        automationType: 'server' as 'server' | 'client',
        useBrowserData: true,
        forceRealExecution: true // إضافة خاصية forceRealExecution
      };
      
      setAutomationProgress(30);
      setAutomationStatus("جاري الاتصال بالخادم...");
      
      // تنفيذ الأتمتة
      const result = await AutomationService.validateAndRunAutomation(config);
      
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
                <p className="text-red-500">فشل تنفيذ {result.results.filter(r => !r.success).length} إجراء</p>
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
