
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash } from "lucide-react";

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
  return (
    <div className="border rounded-md p-4 space-y-3">
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
          <Label htmlFor={`finder-${index}`}>محدد العنصر (CSS Selector)</Label>
          <Textarea
            id={`finder-${index}`}
            placeholder="مثال: #username, .submit-button, button[type='submit']"
            value={action.finder}
            onChange={(e) => onChange(index, "finder", e.target.value)}
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
            min="0"
            step="100"
            placeholder="300"
            value={action.delay}
            onChange={(e) => onChange(index, "delay", e.target.value)}
            disabled={isRunning}
          />
        </div>
      </div>
    </div>
  );
};

export default ActionItem;
