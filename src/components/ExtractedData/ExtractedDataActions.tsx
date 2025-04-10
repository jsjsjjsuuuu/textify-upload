
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
    <div className="flex justify-between items-center mb-4" dir="rtl">
      <motion.div 
        className="hidden" 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
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
          onClick={handleCopy} 
          className="h-8 bg-gray-900 text-white hover:bg-gray-800 border-none"
        >
          <Copy size={16} className="ml-1" />
          نسخ البيانات
        </Button>
      </motion.div>
    </div>
  );
};

export default ExtractedDataActions;
