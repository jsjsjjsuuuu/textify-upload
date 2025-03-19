
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Check, X } from 'lucide-react';

interface ActionEditorProps {
  action: any;
  onSave: (action: any) => void;
  onCancel: () => void;
}

const ActionEditor: React.FC<ActionEditorProps> = ({ action, onSave, onCancel }) => {
  const [editedAction, setEditedAction] = useState<any>({ ...action });

  const handleInputChange = (field: string, value: string | number) => {
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
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          إلغاء
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => onSave(editedAction)}
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
