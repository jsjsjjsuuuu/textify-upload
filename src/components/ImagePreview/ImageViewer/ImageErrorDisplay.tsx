
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ImageErrorDisplayProps {
  onRetry?: () => void;
  title?: string;
  message?: string;
  className?: string;
  icon?: ReactNode;
}

const ImageErrorDisplay = ({ 
  onRetry, 
  title = "تعذر تحميل الصورة",
  message = "حدث خطأ أثناء تحميل الصورة. قد يكون الملف تالفًا أو غير متاح.",
  className = "",
  icon
}: ImageErrorDisplayProps) => {
  return (
    <div className={`flex flex-col items-center justify-center h-full gap-4 text-center p-4 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        {icon || <AlertCircle className="w-10 h-10 text-red-500" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        {message}
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
