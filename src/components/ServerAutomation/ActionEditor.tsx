
import React, { useState } from 'react';
import { AutomationAction } from '@/utils/automation/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Check, X } from 'lucide-react';

interface ActionEditorProps {
  action: AutomationAction;
  index?: number; // إضافة خاصية index كاختيارية
  onSave?: (action: AutomationAction) => void;
  onUpdate?: (action: AutomationAction) => void;
  onCancel?: () => void;
  onRemove?: () => void;
  commonSelectors?: any;
}

const ActionEditor: React.FC<ActionEditorProps> = ({ 
  action, 
  index, 
  onSave, 
  onUpdate, 
  onCancel, 
  onRemove,
  commonSelectors 
}) => {
  const [editedAction, setEditedAction] = useState<AutomationAction>({ ...action });

  const handleInputChange = (field: keyof AutomationAction, value: string | number) => {
    setEditedAction({
      ...editedAction,
      [field]: value
    });
  };

  const handleSliderChange = (value: number[]) => {
    setEditedAction({
      ...editedAction,
      delay: value[0]
    });
  };

  const handleSaveOrUpdate = () => {
    if (onSave) {
      onSave(editedAction);
    } else if (onUpdate) {
      onUpdate(editedAction);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="action-name">اسم الإجراء</Label>
          <Input
            id="action-name"
            value={editedAction.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="اسم الإجراء"
          />
        </div>
        <div>
          <Label htmlFor="action-delay" className="flex justify-between">
            <span>التأخير (مللي ثانية)</span>
            <span className="text-muted-foreground text-sm">{editedAction.delay} مللي ثانية</span>
          </Label>
          <Slider
            value={[editedAction.delay]}
            min={0}
            max={5000}
            step={100}
            onValueChange={handleSliderChange}
            className="py-4"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="action-finder">محدد العنصر (CSS Selector أو XPath)</Label>
        <Input
          id="action-finder"
          value={editedAction.finder}
          onChange={(e) => handleInputChange('finder', e.target.value)}
          placeholder="محدد العنصر مثل #username أو //input[@name='username']"
          dir="ltr"
        />
      </div>

      <div>
        <Label htmlFor="action-value">القيمة</Label>
        <Input
          id="action-value"
          value={editedAction.value}
          onChange={(e) => handleInputChange('value', e.target.value)}
          placeholder="القيمة المراد إدخالها أو الإجراء المراد تنفيذه"
        />
      </div>

      <div className="flex justify-end space-x-2 space-x-reverse">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            إلغاء
          </Button>
        )}
        {onRemove && (
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <X className="w-4 h-4 mr-2" />
            حذف
          </Button>
        )}
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSaveOrUpdate}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Check className="w-4 h-4 mr-2" />
          حفظ
        </Button>
      </div>
    </div>
  );
};

export default ActionEditor;
