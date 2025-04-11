
import { Button } from "@/components/ui/button";
import { Trash, Send } from "lucide-react";

interface ActionButtonsProps {
  imageId: string;
  isSubmitting: boolean;
  isCompleted: boolean;
  isSubmitted: boolean;
  isPhoneNumberValid: boolean;
  isAllFieldsFilled: boolean;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
}

const ActionButtons = ({
  imageId,
  isSubmitting,
  isCompleted,
  isSubmitted,
  isPhoneNumberValid,
  isAllFieldsFilled,
  onDelete,
  onSubmit
}: ActionButtonsProps) => {
  // عنوان زر توضيحي للإرشاد
  const getSubmitButtonTitle = () => {
    if (isSubmitted) {
      return "تم إرسال البيانات بالفعل";
    } 
    if (!isAllFieldsFilled) {
      return "يجب ملء جميع الحقول أولاً: الكود، اسم المرسل، رقم الهاتف، المحافظة، السعر";
    }
    if (!isPhoneNumberValid) {
      return "يجب أن يكون رقم الهاتف 11 رقم بالضبط";
    }
    return "انقر لإرسال البيانات وحفظها في قاعدة البيانات";
  };

  return <div className="flex justify-end gap-2 mt-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onDelete(imageId)} 
        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs border-destructive/20 hover:border-destructive/30"
        title="سيتم إزالة الصورة من العرض فقط دون حذفها من قاعدة البيانات"
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
        title={getSubmitButtonTitle()}
      >
        <Send size={14} className="ml-1 opacity-70" />
        {isSubmitting ? "جاري الإرسال..." : isSubmitted ? "تم الإرسال" : "إرسال البيانات"}
      </Button>
    </div>;
};

export default ActionButtons;
