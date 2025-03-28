
import { Button } from "@/components/ui/button";
import { Trash, Send } from "lucide-react";

interface ActionButtonsProps {
  imageId: string;
  isSubmitting: boolean;
  isCompleted: boolean;
  isSubmitted: boolean;
  isPhoneNumberValid: boolean;
  isAllFieldsFilled: boolean; // إضافة خاصية جديدة للتحقق من اكتمال الحقول
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
}

const ActionButtons = ({
  imageId,
  isSubmitting,
  isCompleted,
  isSubmitted,
  isPhoneNumberValid,
  isAllFieldsFilled, // استلام الخاصية الجديدة
  onDelete,
  onSubmit
}: ActionButtonsProps) => {
  return <div className="flex justify-end gap-2 mt-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onDelete(imageId)} 
        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs border-destructive/20 hover:border-destructive/30"
      >
        <Trash size={14} className="ml-1 opacity-70" />
        حذف
      </Button>
      
      <Button 
        variant="default" 
        size="sm" 
        className={`${isSubmitted ? 'bg-green-600' : 'bg-brand-green hover:bg-brand-green/90'} text-white transition-colors h-8 text-xs`}
        disabled={!isAllFieldsFilled || isSubmitting || isSubmitted || !isPhoneNumberValid} 
        onClick={() => onSubmit(imageId)}
        title={!isAllFieldsFilled ? "يجب ملء جميع الحقول أولاً" : ""}
      >
        <Send size={14} className="ml-1 opacity-70" />
        {isSubmitting ? "جاري الإرسال..." : isSubmitted ? "تم الإرسال" : "إرسال البيانات"}
      </Button>
    </div>;
};

export default ActionButtons;
