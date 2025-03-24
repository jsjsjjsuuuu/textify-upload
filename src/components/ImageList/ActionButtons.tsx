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
  return <div className="flex justify-end gap-2 mt-3">
      <Button variant="outline" size="sm" onClick={() => onDelete(imageId)} className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs border-destructive/20 hover:border-destructive/30">
        <Trash size={14} className="ml-1 opacity-70" />
        حذف
      </Button>
      
      
    </div>;
};
export default ActionButtons;