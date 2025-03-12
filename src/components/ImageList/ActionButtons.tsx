
import { Button } from "@/components/ui/button";
import { Trash, Send, ExternalLink } from "lucide-react";

interface ActionButtonsProps {
  imageId: string;
  isSubmitting: boolean;
  isCompleted: boolean;
  isSubmitted: boolean;
  isPhoneNumberValid: boolean;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onExport?: (id: string) => void;
}

const ActionButtons = ({ 
  imageId, 
  isSubmitting, 
  isCompleted, 
  isSubmitted, 
  isPhoneNumberValid, 
  onDelete, 
  onSubmit,
  onExport
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-end gap-2 mt-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onDelete(imageId)} 
        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs border-destructive/20 hover:border-destructive/30"
      >
        <Trash size={14} className="ml-1 opacity-70" />
        حذف
      </Button>
      
      {onExport && isCompleted && !isSubmitting && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onExport(imageId)} 
          className="border-brand-coral/30 text-brand-coral hover:bg-brand-coral/10 hover:text-brand-coral h-8 text-xs"
        >
          <ExternalLink size={14} className="ml-1 opacity-70" />
          تصدير البيانات
        </Button>
      )}
      
      <Button 
        variant="default" 
        size="sm" 
        className="bg-brand-green hover:bg-brand-green/90 h-8 text-xs shadow-sm" 
        disabled={!isCompleted || isSubmitting || isSubmitted || !isPhoneNumberValid} 
        onClick={() => onSubmit(imageId)}
      >
        <Send size={14} className="ml-1 opacity-90" />
        {isSubmitting ? "جاري الإرسال..." : "إرسال البيانات"}
      </Button>
    </div>
  );
};

export default ActionButtons;
