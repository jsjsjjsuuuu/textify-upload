import { Button } from "@/components/ui/button";
import { Trash, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ActionButtonsProps {
  imageId: string;
  isSubmitting: boolean | Record<string, boolean>;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  // مراقبة حالة التقديم لتتبع العملية
  useEffect(() => {
    // التحقق من نوع isSubmitting وتحويله للقيمة المناسبة
    const submittingState = typeof isSubmitting === 'boolean' 
      ? isSubmitting 
      : isSubmitting?.[imageId] || false;
    
    if (submittingState) {
      setIsProcessing(true);
    } else {
      // تأخير صغير لإظهار "تم الإرسال" قبل إخفاء الزر
      const timer = setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting, imageId]);

  // عنوان زر توضيحي للإرشاد
  const getSubmitButtonTitle = () => {
    if (isSubmitted) {
      return "تم إرسال البيانات بالفعل وإخفاء العنصر";
    } 
    if (!isAllFieldsFilled) {
      return "يجب ملء جميع الحقول أولاً: الكود، اسم المرسل، رقم الهاتف، المحافظة، السعر";
    }
    if (!isPhoneNumberValid) {
      return "يجب أن يكون رقم الهاتف 11 رقم بالضبط";
    }
    return "انقر لإرسال البيانات وحفظها في قاعدة البيانات وإخفاء الصورة من العرض";
  };

  const handleSubmit = () => {
    console.log("زر الإرسال: بدء إرسال الصورة:", imageId);
    
    // إظهار رسالة تأكيد
    toast({
      title: "جاري إرسال البيانات",
      description: "سيتم إخفاء العنصر بعد الإرسال الناجح"
    });
    
    onSubmit(imageId);
  };

  const handleDelete = () => {
    console.log("زر الحذف: بدء حذف الصورة:", imageId);
    onDelete(imageId);
    toast({
      title: "تمت إزالة الصورة",
      description: "تم إخفاء الصورة من العرض",
    });
  };

  return (
    <div className="flex justify-end gap-2 mt-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDelete} 
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
        disabled={!isAllFieldsFilled || 
                 (typeof isSubmitting === 'boolean' ? isSubmitting : isSubmitting?.[imageId]) || 
                 isSubmitted || 
                 !isPhoneNumberValid} 
        onClick={handleSubmit}
        title={getSubmitButtonTitle()}
      >
        <Send size={14} className="ml-1 opacity-70" />
        {(typeof isSubmitting === 'boolean' ? isSubmitting : isSubmitting?.[imageId]) ? "جاري الإرسال..." : isSubmitted ? "تم الإرسال" : "إرسال وإخفاء"}
      </Button>
    </div>
  );
};

export default ActionButtons;
