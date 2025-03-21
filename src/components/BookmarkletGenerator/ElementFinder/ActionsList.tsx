
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ActionItem from "./ActionItem";

interface ActionsListProps {
  actions: { name: string; finder: string; value: string; delay: string }[];
  isRunning: boolean;
  onAddAction: () => void;
  onRemoveAction: (index: number) => void;
  onActionChange: (index: number, field: string, value: string) => void;
}

const ActionsList: React.FC<ActionsListProps> = ({
  actions,
  isRunning,
  onAddAction,
  onRemoveAction,
  onActionChange,
}) => {
  return (
    <div className="border-t pt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">الإجراءات</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddAction}
          disabled={isRunning}
        >
          <Plus className="h-4 w-4 mr-1" /> إضافة إجراء
        </Button>
      </div>
      
      <div className="space-y-4">
        {actions.map((action, index) => (
          <ActionItem
            key={index}
            action={action}
            index={index}
            isRunning={isRunning}
            onRemove={onRemoveAction}
            onChange={onActionChange}
          />
        ))}
      </div>
    </div>
  );
};

export default ActionsList;
