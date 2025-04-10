
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageErrorDisplayProps {
  onRetry?: () => void;
}

const ImageErrorDisplay = ({ onRetry }: ImageErrorDisplayProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold">تعذر تحميل الصورة</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        حدث خطأ أثناء تحميل الصورة. قد يكون الملف تالفًا أو غير متاح.
      </p>
      
      {onRetry && (
        <Button 
          variant="outline" 
          className="mt-2 gap-2" 
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4 ml-2" /> إعادة المحاولة
        </Button>
      )}
    </div>
  );
};

export default ImageErrorDisplay;
