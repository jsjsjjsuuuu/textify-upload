
import { Button } from "@/components/ui/button";

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
  return (
    <div className="flex justify-between w-full mt-4 pt-2 border-t">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete(imageId)} 
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          حذف
        </Button>
      </div>
      
      <Button 
        variant="default" 
        size="sm" 
        className="bg-brand-green hover:bg-brand-green/90 text-white" 
        disabled={!isCompleted || isSubmitting || isSubmitted} 
        onClick={() => onSubmit(imageId)}
      >
        {isSubmitted ? "تم الإرسال" : "إرسال"}
      </Button>
    </div>
  );
};

export default ImageActions;
