
import { Button } from "@/components/ui/button";
import { Check, Edit2, X, Copy } from "lucide-react";

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
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-brand-brown">البيانات المستخرجة</h3>
      <div className="flex gap-2">
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
              onClick={onCopyText}
              className="h-8"
            >
              <Copy size={16} className="ml-1" />
              نسخ
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onAutoExtract}
              className="h-8"
              disabled={!hasExtractedText}
            >
              إعادة استخراج
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onEditToggle}
              className="h-8"
            >
              <Edit2 size={16} className="ml-1" />
              تعديل
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExtractedDataActions;
