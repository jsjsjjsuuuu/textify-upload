
import React from 'react';
import { AutomationAction } from '@/utils/automation/types';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

export interface ActionEditorProps {
  action: AutomationAction;
  onChange: (updatedAction: AutomationAction) => void;
  disabled: boolean;
  index: number;
}

const ActionEditor: React.FC<ActionEditorProps> = ({ action, onChange, disabled, index }) => {
  // تحديث قيمة الإجراء
  const updateValue = (key: keyof AutomationAction, value: string | number) => {
    onChange({
      ...action,
      [key]: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2 text-gray-600">
        الإجراء #{index + 1}
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`action-type-${index}`}>نوع الإجراء</Label>
          <Select
            value={action.name}
            onValueChange={(value) => updateValue('name', value)}
            disabled={disabled}
          >
            <SelectTrigger id={`action-type-${index}`}>
              <SelectValue placeholder="اختر نوع الإجراء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="click">نقر</SelectItem>
              <SelectItem value="type">إدخال نص</SelectItem>
              <SelectItem value="select">اختيار من قائمة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`finder-${index}`}>محدد العنصر (CSS Selector)</Label>
          <Input
            id={`finder-${index}`}
            placeholder="مثال: #id أو .class"
            value={action.finder}
            onChange={(e) => updateValue('finder', e.target.value)}
            disabled={disabled}
            dir="ltr"
          />
        </div>
      </div>
      
      {(action.name === 'type' || action.name === 'select') && (
        <div className="space-y-2">
          <Label htmlFor={`value-${index}`}>القيمة</Label>
          <Input
            id={`value-${index}`}
            placeholder="أدخل القيمة"
            value={action.value}
            onChange={(e) => updateValue('value', e.target.value)}
            disabled={disabled}
          />
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor={`delay-${index}`}>التأخير (مللي ثانية)</Label>
          <span className="text-xs text-gray-500">{action.delay} مللي ثانية</span>
        </div>
        <Slider
          id={`delay-${index}`}
          min={100}
          max={2000}
          step={100}
          value={[action.delay]}
          onValueChange={(value) => updateValue('delay', value[0])}
          disabled={disabled}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`description-${index}`}>وصف الإجراء (اختياري)</Label>
        <Textarea
          id={`description-${index}`}
          placeholder="أدخل وصفاً للإجراء"
          value={action.description || ''}
          onChange={(e) => updateValue('description', e.target.value)}
          disabled={disabled}
          rows={2}
        />
      </div>
    </div>
  );
};

export default ActionEditor;
