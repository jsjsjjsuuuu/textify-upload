
import { Button } from "@/components/ui/button";
import { Trash, Send } from "lucide-react";

interface ActionButtonsProps {
  imageId: string;
  isSubmitting: boolean;
  isCompleted: boolean;
  isSubmitted: boolean;
  isPhoneNumberValid: boolean;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
}

const ActionButtons = ({ 
  imageId, 
  isSubmitting, 
  isCompleted, 
  isSubmitted, 
  isPhoneNumberValid, 
  onDelete, 
  onSubmit 
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-end gap-2 mt-3">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onDelete(imageId)} 
        className="text-destructive hover:bg-destructive/10 h-8 text-xs"
      >
        <Trash size={14} className="ml-1" />
        حذف
      </Button>
      
      <Button 
        variant="default" 
        size="sm" 
        className="bg-brand-green hover:bg-brand-green/90 h-8 text-xs" 
        disabled={!isCompleted || isSubmitting || isSubmitted || !isPhoneNumberValid} 
        onClick={() => onSubmit(imageId)}
      >
        <Send size={14} className="ml-1" />
        {isSubmitting ? "جاري الإرسال..." : "إرسال البيانات"}
      </Button>
    </div>
  );
};

export default ActionButtons;
