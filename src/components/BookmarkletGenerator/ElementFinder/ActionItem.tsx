
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionItemProps {
  action: { name: string; finder: string; value: string; delay: string };
  index: number;
  isRunning: boolean;
  onRemove: (index: number) => void;
  onChange: (index: number, field: string, value: string) => void;
}

const ActionItem: React.FC<ActionItemProps> = ({
  action,
  index,
  isRunning,
  onRemove,
  onChange,
}) => {
  // التحقق من صحة محدد CSS
  const validateCssSelector = (selector: string): boolean => {
    if (!selector.trim()) return true;
    
    try {
      // تجاهل التحقق إذا كان المحدد يحتوي على فواصل (محددات متعددة)
      if (selector.includes(',')) return true;
      
      // محاولة تنفيذ المحدد لاختبار صحته
      document.querySelector(selector);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const isSelectorValid = validateCssSelector(action.finder);
  
  // أمثلة للمحددات الشائعة
  const selectorExamples = {
    click: [
      '#submit-button',
      'button[type="submit"]',
      '.login-button',
      'button:contains("تسجيل الدخول")'
    ],
    type: [
      '#username', 
      'input[name="email"]',
      'input[placeholder="البريد الإلكتروني"]', 
      'textarea.message'
    ],
    select: [
      'select#country', 
      'select[name="city"]', 
      '.dropdown-menu'
    ]
  };
  
  // الحصول على أمثلة مناسبة لنوع الإجراء الحالي
  const getExamplesForAction = () => {
    return selectorExamples[action.name as keyof typeof selectorExamples] || selectorExamples.click;
  };

  return (
    <div className={`border rounded-md p-4 space-y-3 ${!isSelectorValid && action.finder ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">الإجراء #{index + 1}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={isRunning}
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
            onValueChange={(value) => onChange(index, "name", value || "click")}
            className="justify-start"
          >
            <ToggleGroupItem value="click">نقر</ToggleGroupItem>
            <ToggleGroupItem value="type">كتابة</ToggleGroupItem>
            <ToggleGroupItem value="select">اختيار</ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor={`finder-${index}`} className={!isSelectorValid && action.finder ? 'text-red-500' : ''}>
              محدد العنصر (CSS Selector)
            </Label>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Info className="h-4 w-4 text-slate-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end" className="w-80">
                  <div className="space-y-2 text-xs">
                    <p className="font-medium">أمثلة على المحددات:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {getExamplesForAction().map((example, i) => (
                        <li key={i} className="font-mono">{example}</li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Textarea
            id={`finder-${index}`}
            placeholder="مثال: #username, .submit-button, button[type='submit']"
            value={action.finder}
            onChange={(e) => onChange(index, "finder", e.target.value)}
            className={`font-mono text-sm ${!isSelectorValid && action.finder ? 'border-red-300 focus:ring-red-500' : ''}`}
            disabled={isRunning}
          />
          
          {!isSelectorValid && action.finder && (
            <p className="text-xs text-red-500 mt-1">
              محدد CSS غير صالح. تأكد من صحة الصيغة.
            </p>
          )}
        </div>
        
        {(action.name === "type" || action.name === "select") && (
          <div>
            <Label htmlFor={`value-${index}`}>القيمة</Label>
            <Input
              id={`value-${index}`}
              placeholder={action.name === "type" ? "النص المراد إدخاله" : "القيمة المراد اختيارها"}
              value={action.value}
              onChange={(e) => onChange(index, "value", e.target.value)}
              disabled={isRunning}
            />
          </div>
        )}
        
        <div>
          <Label htmlFor={`delay-${index}`}>التأخير (مللي ثانية)</Label>
          <Input
            id={`delay-${index}`}
            type="number"
            min="300"
            step="100"
            placeholder="500"
            value={action.delay}
            onChange={(e) => {
              // تأكد من أن التأخير لا يقل عن 300 مللي ثانية
              const value = parseInt(e.target.value);
              onChange(index, "delay", value < 300 ? "300" : e.target.value);
            }}
            disabled={isRunning}
          />
          <p className="text-xs text-muted-foreground mt-1">
            التأخير المقترح: 500-1000 مللي ثانية للحصول على أفضل النتائج
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActionItem;
