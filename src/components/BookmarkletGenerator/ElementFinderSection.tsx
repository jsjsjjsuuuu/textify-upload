import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash, Plus, PenLine, PlayCircle, Check, AlertTriangle, Copy, FileDown, File, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { AutomationConfig, AutomationAction } from "@/utils/automation/types";
import { AutomationService } from "@/utils/automationService";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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
  
  const handleActionTypeChange = (value: string) => {
    if (value) {
      setActionType(value);
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
        <div className="space-y-2">
          <Label htmlFor="projectUrl">رابط المشروع</Label>
          <Input
            id="projectUrl"
            placeholder="https://example.com"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customName">اسم مخصص (اختياري)</Label>
          <Input
            id="customName"
            placeholder="اسم المشروع المخصص"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">الإجراءات</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAction}
              disabled={isRunning}
            >
              <Plus className="h-4 w-4 mr-1" /> إضافة إجراء
            </Button>
          </div>
          
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div key={index} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">الإجراء #{index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAction(index)}
                    disabled={isRunning || actions.length === 1}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label>نوع الإجراء</Label>
                    <ToggleGroup
                      type="single"
                      value={action.name}
                      onValueChange={(value) => handleActionChange(index, "name", value || "click")}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="click">نقر</ToggleGroupItem>
                      <ToggleGroupItem value="type">كتابة</ToggleGroupItem>
                      <ToggleGroupItem value="select">اختيار</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  
                  <div>
                    <Label htmlFor={`finder-${index}`}>محدد العنصر (CSS Selector)</Label>
                    <Textarea
                      id={`finder-${index}`}
                      placeholder="مثال: #username, .submit-button, button[type='submit']"
                      value={action.finder}
                      onChange={(e) => handleActionChange(index, "finder", e.target.value)}
                      className="font-mono text-sm"
                      disabled={isRunning}
                    />
                  </div>
                  
                  {(action.name === "type" || action.name === "select") && (
                    <div>
                      <Label htmlFor={`value-${index}`}>القيمة</Label>
                      <Input
                        id={`value-${index}`}
                        placeholder="القيمة المراد إدخالها"
                        value={action.value}
                        onChange={(e) => handleActionChange(index, "value", e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor={`delay-${index}`}>التأخير (مللي ثانية)</Label>
                    <Input
                      id={`delay-${index}`}
                      type="number"
                      min="0"
                      step="100"
                      placeholder="300"
                      value={action.delay}
                      onChange={(e) => handleActionChange(index, "delay", e.target.value)}
                      disabled={isRunning}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {isRunning && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span>{automationStatus}</span>
              <span>{automationProgress}%</span>
            </div>
            <Progress value={automationProgress} className="h-2" />
          </div>
        )}
        
        {serverError && (
          <AlertComponent variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>فشل تنفيذ الأتمتة</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </AlertComponent>
        )}
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Switch
            id="use-real-browser"
            checked={useRealBrowser}
            onCheckedChange={setUseRealBrowser}
            disabled={isRunning}
          />
          <Label htmlFor="use-real-browser">استخدام متصفح حقيقي للتنفيذ</Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopyBookmarklet}
            disabled={isRunning}
          >
            <Copy className="h-4 w-4 mr-1" />
            نسخ Bookmarklet
          </Button>
          <Button
            variant="outline"
            onClick={handleExportJson}
            disabled={isRunning}
          >
            <FileDown className="h-4 w-4 mr-1" />
            تصدير JSON
          </Button>
        </div>
        <Button
          onClick={handleRunAutomation}
          disabled={isRunning}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              جاري التنفيذ...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 mr-1" />
              تنفيذ الأتمتة
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ElementFinderSection;
