
import React, { useState } from 'react';
import { AutomationAction } from '@/utils/automation/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Check, X, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActionEditorProps {
  action: AutomationAction;
  onUpdate: (action: AutomationAction) => void;
  onRemove: () => void;
  index?: number;
  commonSelectors?: any;
}

const ActionEditor: React.FC<ActionEditorProps> = ({ action, onUpdate, onRemove, index, commonSelectors }) => {
  const [editedAction, setEditedAction] = useState<AutomationAction>({ ...action });
  const [showSelectorSuggestions, setShowSelectorSuggestions] = useState(false);

  // تحديد نوع الإجراء بناء على القيمة
  const getActionType = (value: string): string => {
    if (value === 'click' || value === 'انقر') return 'انقر';
    if (value.includes('type') || value.includes('أدخل')) return 'أدخل نص';
    if (value.includes('select') || value.includes('اختر')) return 'اختر قيمة';
    if (value.includes('wait') || value.includes('انتظر')) return 'انتظر';
    return 'أدخل نص';
  };

  const handleInputChange = (field: keyof AutomationAction, value: string | number) => {
    const updatedAction = {
      ...editedAction,
      [field]: value
    };
    
    setEditedAction(updatedAction);
    onUpdate(updatedAction);
  };

  const handleActionTypeChange = (value: string) => {
    let actionValue = editedAction.value;
    
    // تعديل القيمة بناء على نوع الإجراء المختار
    if (value === 'انقر' && !actionValue) {
      actionValue = 'click';
    } else if (value === 'انتظر' && !actionValue) {
      actionValue = 'wait';
    }
    
    const updatedAction = {
      ...editedAction,
      name: value,
      value: actionValue
    };
    
    setEditedAction(updatedAction);
    onUpdate(updatedAction);
  };

  const handleSliderChange = (value: number[]) => {
    const updatedAction = {
      ...editedAction,
      delay: value[0]
    };
    
    setEditedAction(updatedAction);
    onUpdate(updatedAction);
  };

  const handleSelectorSelect = (type: string, selectorName: string, selectorValue: string) => {
    const updatedAction = {
      ...editedAction,
      finder: selectorValue
    };
    
    setEditedAction(updatedAction);
    onUpdate(updatedAction);
    setShowSelectorSuggestions(false);
  };

  return (
    <div className="space-y-3 border rounded-lg p-4 bg-white shadow-sm relative">
      {index !== undefined && (
        <div className="absolute -top-3 -right-3 bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center border border-purple-300 shadow-sm">
          {index + 1}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`action-name-${index}`}>نوع الإجراء</Label>
          <Select value={editedAction.name} onValueChange={handleActionTypeChange}>
            <SelectTrigger id={`action-name-${index}`}>
              <SelectValue placeholder="اختر نوع الإجراء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="انقر">انقر</SelectItem>
              <SelectItem value="أدخل نص">أدخل نص</SelectItem>
              <SelectItem value="اختر قيمة">اختر قيمة</SelectItem>
              <SelectItem value="انتظر">انتظر</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`action-delay-${index}`} className="flex justify-between">
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
        <div className="flex justify-between items-center">
          <Label htmlFor={`action-finder-${index}`}>محدد العنصر (CSS Selector أو XPath)</Label>
          {commonSelectors && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSelectorSuggestions(!showSelectorSuggestions)}
              className="text-xs"
            >
              اقتراحات المحددات
            </Button>
          )}
        </div>
        <Input
          id={`action-finder-${index}`}
          value={editedAction.finder}
          onChange={(e) => handleInputChange('finder', e.target.value)}
          placeholder="محدد العنصر مثل #username أو //input[@name='username']"
          dir="ltr"
        />
        
        {showSelectorSuggestions && commonSelectors && (
          <div className="mt-2 bg-gray-50 p-2 rounded-md border text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {commonSelectors.inputs && (
                <div>
                  <h4 className="font-medium mb-2 text-xs">حقول الإدخال:</h4>
                  <div className="space-y-1">
                    {commonSelectors.inputs.map((selector: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleSelectorSelect('input', selector.name, selector.finder)}
                        className="w-full text-right block py-1 px-2 hover:bg-gray-100 rounded text-xs truncate"
                      >
                        {selector.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {commonSelectors.buttons && (
                <div>
                  <h4 className="font-medium mb-2 text-xs">الأزرار:</h4>
                  <div className="space-y-1">
                    {commonSelectors.buttons.map((selector: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleSelectorSelect('button', selector.name, selector.finder)}
                        className="w-full text-right block py-1 px-2 hover:bg-gray-100 rounded text-xs truncate"
                      >
                        {selector.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor={`action-value-${index}`}>القيمة</Label>
        <Input
          id={`action-value-${index}`}
          value={editedAction.value}
          onChange={(e) => handleInputChange('value', e.target.value)}
          placeholder={editedAction.name === 'انقر' ? 'click' : editedAction.name === 'انتظر' ? 'wait' : 'أدخل القيمة هنا'}
        />
      </div>

      <div className="flex justify-end">
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={onRemove}
          className="flex items-center"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          حذف
        </Button>
      </div>
    </div>
  );
};

export default ActionEditor;
