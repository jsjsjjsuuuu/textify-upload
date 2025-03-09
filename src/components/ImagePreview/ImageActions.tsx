
import { Button } from "@/components/ui/button";
import { Trash2, Send, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ImageActionsProps {
  imageId: string;
  isSubmitting: boolean;
  isSubmitted: boolean;
  isCompleted: boolean;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
}

const ImageActions = ({
  imageId,
  isSubmitting,
  isSubmitted,
  isCompleted,
  onDelete,
  onSubmit
}: ImageActionsProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(imageId);
      toast({
        title: "تم الحذف",
        description: "تم حذف الصورة بنجاح"
      });
    } else {
      setConfirmDelete(true);
      // إعادة تعيين حالة التأكيد بعد 3 ثوانٍ
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleSubmitClick = () => {
    onSubmit(imageId);
    if (!isSubmitted) {
      toast({
        title: "جاري الإرسال",
        description: "جاري إرسال البيانات إلى الخادم"
      });
    }
  };

  return (
    <div className="flex justify-between w-full mt-4 pt-2 border-t">
      <div className="flex gap-2">
        <AnimatePresence>
          {confirmDelete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteClick} 
                className="text-white"
              >
                <AlertTriangle size={14} className="mr-1" />
                تأكيد الحذف
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeleteClick} 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={14} className="mr-1" />
                حذف
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <Button 
        variant="default" 
        size="sm" 
        className={`${isSubmitted ? 'bg-green-600' : 'bg-brand-green hover:bg-brand-green/90'} text-white transition-colors`}
        disabled={!isCompleted || isSubmitting || isSubmitted} 
        onClick={handleSubmitClick}
      >
        <Send size={14} className="mr-1" />
        {isSubmitting ? "جاري الإرسال..." : isSubmitted ? "تم الإرسال" : "إرسال"}
      </Button>
    </div>
  );
};

export default ImageActions;
