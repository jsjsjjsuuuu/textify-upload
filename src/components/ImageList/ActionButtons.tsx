
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Send, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdvancedFillOptions from "@/components/AdvancedFillOptions";

interface ActionButtonsProps {
  imageId: string;
  isSubmitting: boolean;
  isCompleted: boolean;
  isSubmitted: boolean;
  isPhoneNumberValid: boolean;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onExport: (id: string) => void;
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
  const { toast } = useToast();
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  
  const handleDeleteClick = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذه الصورة؟")) {
      onDelete(imageId);
    }
  };

  const handleSubmitClick = () => {
    if (!isPhoneNumberValid) {
      toast({
        title: "خطأ في رقم الهاتف",
        description: "تأكد من إدخال رقم هاتف صحيح (11 رقمًا)",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(imageId);
  };

  const handleExportClick = () => {
    onExport(imageId);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="destructive"
        className="flex items-center gap-1 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
        onClick={handleDeleteClick}
      >
        <Trash2 className="h-3.5 w-3.5" />
        حذف
      </Button>
      
      <Button
        size="sm"
        variant={isSubmitted ? "outline" : "default"}
        className={`flex items-center gap-1 text-xs ${
          isSubmitted
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            : "bg-brand-brown text-white hover:bg-brand-brown/90"
        }`}
        onClick={handleSubmitClick}
        disabled={isSubmitting || !isCompleted || !isPhoneNumberValid}
      >
        {isSubmitted ? (
          <>
            <CheckCircle className="h-3.5 w-3.5" />
            تم الإرسال
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5" />
            {isSubmitting ? "جاري الإرسال..." : "إرسال"}
          </>
        )}
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        className="flex items-center gap-1 text-xs"
        onClick={() => setIsAdvancedOptionsOpen(true)}
        disabled={!isCompleted}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        تعبئة تلقائية
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        className="flex items-center gap-1 text-xs"
        onClick={handleExportClick}
        disabled={!isCompleted}
      >
        <Copy className="h-3.5 w-3.5" />
        تصدير
      </Button>
      
      <AdvancedFillOptions
        isOpen={isAdvancedOptionsOpen}
        onClose={() => setIsAdvancedOptionsOpen(false)}
        imageData={{ id: imageId } as any}
        isMultiMode={false}
      />
    </div>
  );
};

export default ActionButtons;
