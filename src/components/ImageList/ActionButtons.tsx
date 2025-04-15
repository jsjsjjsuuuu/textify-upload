
import { Button } from "@/components/ui/button";
import { Trash, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
  imageId: string;
  isSubmitting: boolean;
  isCompleted: boolean;
  isSubmitted: boolean;
  isPhoneNumberValid: boolean;
  isAllFieldsFilled: boolean;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  compact?: boolean;
}

const ActionButtons = ({ 
  imageId, 
  isSubmitting, 
  isCompleted, 
  isSubmitted, 
  isPhoneNumberValid,
  isAllFieldsFilled,
  onDelete, 
  onSubmit,
  compact = false 
}: ActionButtonsProps) => {
  return (
    <div className={cn(
      "flex justify-end space-x-2 space-x-reverse w-full",
      compact && "space-x-1" // تقليل المسافة بين الأزرار
    )}>
      <Button 
        variant="ghost" 
        size={compact ? "icon" : "default"} 
        onClick={() => onDelete(imageId)} 
        className={cn(
          "text-destructive hover:bg-destructive/10",
          compact && "h-6 w-6 text-sm"
        )}
      >
        <Trash size={compact ? 12 : 16} />
      </Button>
      
      <Button 
        variant="ghost" 
        size={compact ? "icon" : "default"} 
        className={cn(
          "text-brand-green hover:bg-brand-green/10", 
          compact && "h-6 w-6 text-sm"
        )}
        disabled={
          !isCompleted || 
          isSubmitting || 
          isSubmitted || 
          !isPhoneNumberValid || 
          !isAllFieldsFilled
        } 
        onClick={() => onSubmit(imageId)}
      >
        <Send size={compact ? 12 : 16} />
      </Button>
    </div>
  );
};

export default ActionButtons;
