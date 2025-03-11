
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Trash, Send } from "lucide-react";

interface RowActionsProps {
  imageId: string;
  status: "processing" | "completed" | "error";
  submitted?: boolean;
  isSubmitting: boolean;
  isPhoneNumberValid: boolean;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onDetails: (id: string) => void;
}

const RowActions: React.FC<RowActionsProps> = ({
  imageId,
  status,
  submitted,
  isSubmitting,
  isPhoneNumberValid,
  onDelete,
  onSubmit,
  onDetails
}) => {
  return (
    <div className="flex gap-2 justify-center">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-full bg-muted/70 text-muted-foreground hover:bg-accent/70 hover:text-foreground transition-colors"
        title="عرض التفاصيل"
        onClick={() => onDetails(imageId)}
      >
        <FileText size={16} />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-full bg-muted/70 text-destructive hover:bg-destructive/20 transition-colors" 
        onClick={() => onDelete(imageId)}
        title="حذف"
      >
        <Trash size={16} />
      </Button>
      {status === "completed" && !submitted && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-muted/70 text-brand-green hover:bg-brand-green/20 transition-colors" 
          disabled={isSubmitting || !isPhoneNumberValid} 
          onClick={() => onSubmit(imageId)}
          title="إرسال"
        >
          <Send size={16} />
        </Button>
      )}
    </div>
  );
};

export default RowActions;
