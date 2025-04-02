
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, RefreshCw, Send } from "lucide-react";

interface ImageActionsProps {
  imageId: string;
  status: string;
  isSubmitting: boolean;
  submitted?: boolean;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onReprocess?: (id: string) => void;
  canReprocess?: boolean;
}

const ImageActions: React.FC<ImageActionsProps> = ({
  imageId,
  status,
  isSubmitting,
  submitted = false,
  onDelete,
  onSubmit,
  onReprocess,
  canReprocess = true
}) => {
  const isCompleted = status === "completed";
  const isProcessing = status === "processing";
  
  const handleDelete = () => {
    if (isProcessing) {
      if (confirm("هذه الصورة قيد المعالجة حالياً. هل أنت متأكد من حذفها؟")) {
        onDelete(imageId);
      }
    } else {
      onDelete(imageId);
    }
  };
  
  const handleReprocess = () => {
    if (onReprocess) {
      onReprocess(imageId);
    }
  };

  return (
    <div className="flex justify-between items-center gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isSubmitting}
          className="h-8"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          حذف
        </Button>
        
        {onReprocess && canReprocess && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReprocess}
            disabled={isSubmitting || isProcessing}
            className="h-8"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            إعادة معالجة
          </Button>
        )}
      </div>
      
      <Button
        variant="default"
        size="sm"
        onClick={() => onSubmit(imageId)}
        disabled={isSubmitting || !isCompleted || submitted}
        className="h-8"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            جاري الإرسال...
          </>
        ) : submitted ? (
          "تم الإرسال"
        ) : (
          <>
            <Send className="h-4 w-4 mr-1" />
            إرسال
          </>
        )}
      </Button>
    </div>
  );
};

export default ImageActions;
