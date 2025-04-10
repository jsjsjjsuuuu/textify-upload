
import { Button } from "@/components/ui/button";
import { Check, Edit2, X, Copy, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ExtractedDataActionsProps {
  editMode: boolean;
  onEditToggle: () => void;
  onCancel: () => void;
  onCopyText: () => void;
  onAutoExtract: () => void;
  hasExtractedText: boolean;
}

const ExtractedDataActions = ({
  editMode,
  onEditToggle,
  onCancel,
  onCopyText,
  onAutoExtract,
  hasExtractedText
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
            >
              <X size={16} className="ml-1" />
              إلغاء
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              onClick={onEditToggle} 
              className="h-8 bg-brand-green hover:bg-brand-green/90"
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
              onClick={handleAutoExtract} 
              disabled={!hasExtractedText} 
              className="h-8 bg-gray-900 text-white hover:bg-gray-800 border-none"
            >
              <RefreshCw size={16} className="ml-1" />
              إعادة استخراج
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onEditToggle} 
              className="h-8 bg-gray-900 text-white hover:bg-gray-800 border-none"
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
