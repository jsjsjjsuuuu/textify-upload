
import React, { useState } from "react";
import RecordItem from "./RecordItem";
import { ImageData } from "@/types/ImageData";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { useToast } from "@/hooks/use-toast";

interface RecordsListProps {
  records: ImageData[];
  isLoading: boolean;
  onItemClick?: (item: ImageData) => void;
  formatDate?: (date: Date) => string;
}

const RecordsList: React.FC<RecordsListProps> = ({
  records,
  isLoading,
  onItemClick,
  formatDate = (date) => date.toLocaleString()
}) => {
  const { hiddenImages, unhideAllImages } = useImageProcessing();
  const { toast } = useToast();
  const [showUnhideButton, setShowUnhideButton] = useState(false);

  // التحقق مما إذا كانت هناك صور مخفية عند تحميل المكون
  React.useEffect(() => {
    setShowUnhideButton(hiddenImages && hiddenImages.length > 0);
  }, [hiddenImages]);

  const handleUnhideAllImages = () => {
    if (unhideAllImages()) {
      toast({
        title: "تم إعادة إظهار الصور",
        description: "تم إعادة إظهار جميع الصور المخفية في صفحة المعالجة",
      });
      setShowUnhideButton(false);
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">لا توجد سجلات حاليًا</p>
        {showUnhideButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUnhideAllImages}
            className="inline-flex items-center gap-1"
          >
            <Eye size={16} />
            إظهار الصور المخفية في صفحة المعالجة
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showUnhideButton && (
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUnhideAllImages}
            className="inline-flex items-center gap-1"
          >
            <Eye size={16} />
            إظهار الصور المخفية ({hiddenImages.length})
          </Button>
        </div>
      )}
      
      {records.map((record) => (
        <RecordItem 
          key={record.id} 
          record={record} 
          onClick={() => onItemClick?.(record)}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
};

export default RecordsList;
