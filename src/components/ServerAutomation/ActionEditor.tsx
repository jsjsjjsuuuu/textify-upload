
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Code, Info, Wand2 } from "lucide-react";
import { AutomationAction } from "@/utils/automation/types";
import { isXPathSelector } from "@/utils/automation";

interface ActionEditorProps {
  action: AutomationAction;
  onChange: (updatedAction: AutomationAction) => void;
  disabled?: boolean;
  index: number;
}

const ActionEditor: React.FC<ActionEditorProps> = ({ action, onChange, disabled, index }) => {
  // تحديث الإجراء مع القيم الجديدة
  const updateAction = <K extends keyof AutomationAction>(key: K, value: AutomationAction[K]) => {
    onChange({
      ...action,
      [key]: value
    });
  };
  
  // التحقق مما إذا كان المحدد هو محدد XPath
  const isXPath = isXPathSelector(action.finder);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={isXPath ? "default" : "outline"} className={isXPath ? "bg-purple-600" : ""}>
            {`الإجراء ${index + 1}`}
          </Badge>
          {isXPath && (
            <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700 text-xs">
              <Code className="h-3 w-3 mr-1" />
              XPath
            </Badge>
          )}
        </div>
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    // هنا يمكن إضافة وظيفة مساعدة لتحسين المحدد
                  }}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="w-80">
                <div className="space-y-2">
                  <p className="font-medium">محددات XPath مدعومة</p>
                  <p className="text-xs">يمكنك استخدام محددات CSS القياسية أو محددات XPath.</p>
                  <p className="text-xs font-mono bg-gray-100 p-1 rounded">مثال: //input[@placeholder='القيمة']</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div>
        <Label htmlFor={`action-type-${index}`}>
          نوع الإجراء <span className="text-red-500">*</span>
        </Label>
        <Select
          disabled={disabled}
          value={action.name}
          onValueChange={(value) => updateAction('name', value)}
        >
          <SelectTrigger id={`action-type-${index}`}>
            <SelectValue placeholder="اختر نوع الإجراء" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="click">نقر (click)</SelectItem>
            <SelectItem value="type">كتابة نص (type)</SelectItem>
            <SelectItem value="select">اختيار من قائمة (select)</SelectItem>
            <SelectItem value="wait">انتظار (wait)</SelectItem>
            <SelectItem value="navigate">انتقال (navigate)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`action-finder-${index}`} className="mb-1">
            محدد العنصر <span className="text-red-500">*</span>
          </Label>
          {isXPath && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700 text-xs cursor-help">
                    <Wand2 className="h-3 w-3 mr-1" />
                    تم اكتشاف XPath
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="w-80">
                  <div className="space-y-2">
                    <p className="font-medium">تم اكتشاف محدد XPath</p>
                    <p className="text-xs">
                      تم اكتشاف أن المحدد الذي أدخلته هو محدد XPath. سيتم استخدام محرك XPath لاستهداف العنصر.
                    </p>
                    <p className="text-xs font-mono bg-gray-100 p-1 rounded dir-ltr">{action.finder}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Textarea
          id={`action-finder-${index}`}
          placeholder="أدخل محدد CSS أو XPath مثل #id أو .class أو //input[@placeholder='القيمة']"
          value={action.finder}
          onChange={(e) => updateAction('finder', e.target.value)}
          disabled={disabled}
          className={`font-mono text-sm h-20 ${isXPath ? 'bg-purple-50 border-purple-200' : ''}`}
          dir="ltr"
        />
        {isXPath && (
          <p className="text-xs text-purple-700 mt-1">
            <Code className="h-3 w-3 inline mr-1" />
            تم اكتشاف صيغة XPath. سيتم استخدام محرك XPath للبحث عن العنصر.
          </p>
        )}
      </div>
      
      {/* حقل قيمة الإجراء - يظهر فقط للإجراءات التي تحتاج إلى قيمة */}
      {(action.name === 'type' || action.name === 'select' || action.name === 'navigate') && (
        <div>
          <Label htmlFor={`action-value-${index}`}>
            قيمة الإجراء {(action.name === 'type' || action.name === 'navigate') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={`action-value-${index}`}
            placeholder={
              action.name === 'type' 
                ? "النص المراد كتابته" 
                : action.name === 'select' 
                ? "القيمة المراد اختيارها" 
                : "عنوان URL المراد الانتقال إليه"
            }
            value={action.value || ''}
            onChange={(e) => updateAction('value', e.target.value)}
            disabled={disabled}
            dir={action.name === 'navigate' ? "ltr" : "auto"}
          />
        </div>
      )}
      
      <div>
        <Label htmlFor={`action-delay-${index}`}>
          تأخير (مللي ثانية)
        </Label>
        <Input
          id={`action-delay-${index}`}
          type="number"
          placeholder="تأخير بعد الإجراء (بالمللي ثانية)"
          value={action.delay?.toString() || "500"}
          onChange={(e) => updateAction('delay', parseInt(e.target.value) || 0)}
          disabled={disabled}
          min={0}
          max={10000}
          dir="ltr"
        />
        <p className="text-xs text-gray-500 mt-1">
          التأخير بعد تنفيذ الإجراء (القيمة الافتراضية: 500 مللي ثانية)
        </p>
      </div>
      
      <div>
        <Label htmlFor={`action-description-${index}`}>
          وصف الإجراء (اختياري)
        </Label>
        <Input
          id={`action-description-${index}`}
          placeholder="وصف موجز للإجراء"
          value={action.description || ''}
          onChange={(e) => updateAction('description', e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ActionEditor;
