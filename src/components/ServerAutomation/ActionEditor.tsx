
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { isXPathSelector } from "@/utils/automation";
import { AutomationAction } from "@/utils/automation/types";
import { Info } from 'lucide-react';

interface ActionEditorProps {
  action: AutomationAction;
  onChange: (updatedAction: AutomationAction) => void;
  disabled?: boolean;
  index: number;
}

const ActionEditor: React.FC<ActionEditorProps> = ({ 
  action, 
  onChange, 
  disabled = false,
  index
}) => {
  // تحديد ما إذا كان المحدد بصيغة XPath
  const [isXPath, setIsXPath] = useState<boolean>(false);
  
  // التحقق من صيغة المحدد عند تحميل المكون أو تغيير المحدد
  useEffect(() => {
    if (action.finder) {
      const isXPathFormat = isXPathSelector(action.finder);
      setIsXPath(isXPathFormat);
    } else {
      setIsXPath(false);
    }
  }, [action.finder]);
  
  // أنواع الإجراءات المتاحة
  const actionTypes = [
    { value: 'click', label: 'نقر على عنصر' },
    { value: 'type', label: 'كتابة نص' },
    { value: 'select', label: 'اختيار من قائمة منسدلة' },
    { value: 'wait', label: 'انتظار (مللي ثانية)' },
    { value: 'screenshot', label: 'أخذ لقطة شاشة' },
    { value: 'navigate', label: 'الانتقال إلى URL' },
    { value: 'submit', label: 'إرسال نموذج' },
    { value: 'eval', label: 'تنفيذ كود JavaScript' }
  ];
  
  // تحديث قيمة الإجراء
  const handleChange = (key: keyof AutomationAction, value: string | number) => {
    const updatedAction: AutomationAction = { ...action, [key]: value };
    
    // إذا تم تغيير نوع الإجراء، قم بتحديث خاصية type أيضًا
    if (key === 'name') {
      updatedAction.type = value as string;
    }
    
    onChange(updatedAction);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-gray-100">
          إجراء {index + 1}
        </Badge>
        {isXPath && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Info className="w-3 h-3 mr-1" /> XPath
          </Badge>
        )}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor={`action-type-${index}`}>نوع الإجراء</Label>
        <Select
          value={action.name}
          onValueChange={(value) => handleChange('name', value)}
          disabled={disabled}
        >
          <SelectTrigger id={`action-type-${index}`}>
            <SelectValue placeholder="اختر نوع الإجراء" />
          </SelectTrigger>
          <SelectContent>
            {actionTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {action.name !== 'wait' && action.name !== 'navigate' && action.name !== 'eval' && (
        <div className="grid gap-2">
          <Label htmlFor={`action-finder-${index}`} className="flex items-center justify-between">
            <span>محدد العنصر {action.name === 'screenshot' ? '(اختياري)' : ''}</span>
            {isXPath && (
              <span className="text-xs text-blue-600">XPath</span>
            )}
          </Label>
          <Input
            id={`action-finder-${index}`}
            placeholder={isXPath ? '//input[@id="username"]' : '#username, .input-class, [name="username"]'}
            value={action.finder || ''}
            onChange={(e) => handleChange('finder', e.target.value)}
            disabled={disabled}
            className={isXPath ? 'border-blue-300 bg-blue-50' : ''}
            dir="ltr"
          />
          <p className="text-xs text-gray-500">
            {isXPath 
              ? 'تم اكتشاف صيغة XPath. يمكنك استخدام محددات XPath مثل //div[@class="example"]'
              : 'استخدم محددات CSS مثل #id, .class, [attr=value], أو محددات XPath تبدأ بـ //'
            }
          </p>
        </div>
      )}
      
      {(action.name === 'type' || action.name === 'select' || action.name === 'navigate' || action.name === 'eval') && (
        <div className="grid gap-2">
          <Label htmlFor={`action-value-${index}`}>
            {action.name === 'type' ? 'النص المراد كتابته' : 
             action.name === 'select' ? 'القيمة المراد اختيارها' :
             action.name === 'navigate' ? 'عنوان URL' : 'كود JavaScript'}
          </Label>
          {action.name === 'eval' ? (
            <Textarea
              id={`action-value-${index}`}
              placeholder={action.name === 'eval' ? 'document.querySelector(".element").click();' : ''}
              value={action.value || ''}
              onChange={(e) => handleChange('value', e.target.value)}
              disabled={disabled}
              rows={3}
              dir="ltr"
            />
          ) : (
            <Input
              id={`action-value-${index}`}
              placeholder={
                action.name === 'type' ? 'أدخل النص هنا' : 
                action.name === 'select' ? 'قيمة الخيار' :
                action.name === 'navigate' ? 'https://example.com' : ''
              }
              value={action.value || ''}
              onChange={(e) => handleChange('value', e.target.value)}
              disabled={disabled}
              dir={action.name === 'navigate' ? 'ltr' : 'auto'}
            />
          )}
        </div>
      )}
      
      <div className="grid gap-2">
        <Label htmlFor={`action-delay-${index}`}>التأخير (مللي ثانية)</Label>
        <Input
          id={`action-delay-${index}`}
          type="number"
          placeholder="500"
          value={action.delay || 500}
          onChange={(e) => handleChange('delay', parseInt(e.target.value) || 500)}
          disabled={disabled}
          min="0"
          max="10000"
        />
        <p className="text-xs text-gray-500">
          {action.name === 'wait' ? 'مدة الانتظار بالمللي ثانية' : 'التأخير قبل تنفيذ الإجراء التالي'}
        </p>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor={`action-description-${index}`}>وصف الإجراء (اختياري)</Label>
        <Input
          id={`action-description-${index}`}
          placeholder="وصف مختصر للإجراء"
          value={action.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ActionEditor;
