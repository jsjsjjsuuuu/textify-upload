
import { Button } from "@/components/ui/button";
import { Check, Edit2, X, Copy, Wand2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ExtractedDataActionsProps {
  editMode: boolean;
  onEditToggle: () => void;
  onCancel: () => void;
  onCopyText: () => void;
  onAutoExtract: () => void;
  hasExtractedText: boolean;
  isProcessing?: boolean; // إضافة الخاصية كاختيارية
}

const ExtractedDataActions = ({ 
  editMode, 
  onEditToggle, 
  onCancel, 
  onCopyText, 
  onAutoExtract,
  hasExtractedText,
  isProcessing = false // تعيين قيمة افتراضية
}: ExtractedDataActionsProps) => {
  const { toast } = useToast();

  const handleCopy = () => {
    onCopyText();
    toast({
      title: "تم نسخ البيانات",
      description: "تم نسخ جميع البيانات المستخرجة إلى الحافظة"
    });
  };

  const handleAutoExtract = () => {
    onAutoExtract();
    toast({
      title: "إعادة استخراج البيانات",
      description: "جاري محاولة استخراج البيانات بشكل تلقائي"
    });
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-brand-brown dark:text-brand-beige">
        البيانات المستخرجة
        {isProcessing && (
          <span className="text-amber-500 text-sm mr-2 inline-flex items-center">
            <Loader2 size={14} className="animate-spin ml-1" />
            جاري المعالجة...
          </span>
        )}
      </h3>
      <motion.div 
        className="flex gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {editMode ? (
          <>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onCancel}
              className="h-8 text-destructive hover:bg-destructive/10"
              disabled={isProcessing}
            >
              <X size={16} className="ml-1" />
              إلغاء
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              onClick={onEditToggle}
              className="h-8 bg-brand-green hover:bg-brand-green/90"
              disabled={isProcessing}
            >
              <Check size={16} className="ml-1" />
              حفظ
            </Button>
          </>
        ) : (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCopy}
              className="h-8"
              disabled={isProcessing}
            >
              <Copy size={16} className="ml-1" />
              نسخ
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleAutoExtract}
              className="h-8"
              disabled={!hasExtractedText || isProcessing}
            >
              {isProcessing ? (
                <Loader2 size={16} className="ml-1 animate-spin" />
              ) : (
                <Wand2 size={16} className="ml-1" />
              )}
              إعادة استخراج
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onEditToggle}
              className="h-8"
              disabled={isProcessing}
            >
              <Edit2 size={16} className="ml-1" />
              تعديل
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ExtractedDataActions;
