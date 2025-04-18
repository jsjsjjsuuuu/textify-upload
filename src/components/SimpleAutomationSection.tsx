
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AutomationService, AutomationConfig, AutomationAction } from "@/utils/automationService";
import { shouldUseBrowserData } from "@/utils/automation";

const SimpleAutomationSection = () => {
  const [url, setUrl] = useState("");
  const [actions, setActions] = useState<AutomationAction[]>([
    { name: "أدخل النص", finder: "", value: "", delay: 500 }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const handleAddAction = () => {
    setActions([...actions, { name: "أدخل النص", finder: "", value: "", delay: 500 }]);
  };

  const handleActionChange = (index: number, field: keyof AutomationAction, value: string | number) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleRun = async () => {
    if (!url) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان URL",
        variant: "destructive"
      });
      return;
    }

    if (!actions.some(action => action.finder && action.finder.trim() !== "")) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال محدد CSS واحد على الأقل",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);

    try {
      const config: AutomationConfig = {
        projectName: "أتمتة بسيطة",
        projectUrl: url,
        actions: actions.filter(action => action.finder && action.finder.trim() !== ""),
        automationType: "server",
        useBrowserData: shouldUseBrowserData()
      };

      const result = await AutomationService.validateAndRunAutomation(config);

      if (result.success) {
        toast({
          title: "تمت العملية بنجاح",
          description: result.message
        });
      } else {
        toast({
          title: "فشلت العملية",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("خطأ في تنفيذ الأتمتة:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="url">عنوان URL للموقع</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="mt-1"
          />
        </div>

        <div className="space-y-4">
          <Label>الإجراءات</Label>
          
          {actions.map((action, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between">
                  <Label>محدد CSS</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveAction(index)}
                    className="text-destructive h-6 px-2"
                  >
                    حذف
                  </Button>
                </div>
                
                <Input
                  value={action.finder}
                  onChange={(e) => handleActionChange(index, "finder", e.target.value)}
                  placeholder="#login-form input[name='username']"
                />
                
                <div>
                  <Label>القيمة</Label>
                  <Textarea
                    value={action.value}
                    onChange={(e) => handleActionChange(index, "value", e.target.value)}
                    placeholder="النص المراد إدخاله"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label>التأخير (مللي ثانية)</Label>
                  <Input
                    type="number"
                    value={action.delay}
                    onChange={(e) => handleActionChange(index, "delay", parseInt(e.target.value))}
                    className="mt-1"
                    min="0"
                    max="10000"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleAddAction}
            className="w-full mt-2"
          >
            إضافة إجراء جديد
          </Button>
        </div>
      </div>

      <Button 
        onClick={handleRun} 
        className="w-full" 
        disabled={isRunning}
      >
        {isRunning ? "جاري التنفيذ..." : "تشغيل الأتمتة"}
      </Button>
    </div>
  );
};

export default SimpleAutomationSection;
