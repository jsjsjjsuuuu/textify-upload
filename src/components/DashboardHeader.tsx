
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  RefreshCw, 
  ImagePlus, 
  PauseCircle, 
  PlayCircle,
  RotateCcw
} from "lucide-react";

interface DashboardHeaderProps {
  isProcessing: boolean;
  onClearSessionImages?: () => void;
  onRetryProcessing?: () => void;
  onPauseProcessing?: () => void;
  onClearQueue?: () => void;
  onRunCleanup?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isProcessing,
  onClearSessionImages,
  onRetryProcessing,
  onPauseProcessing,
  onClearQueue,
  onRunCleanup
}) => {
  return (
    <div className="mb-6 flex flex-wrap gap-2 justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">إدارة ومعالجة الصور والبيانات المستخرجة</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {onClearSessionImages && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearSessionImages}
          >
            <Trash2 className="h-4 w-4 ml-1" />
            مسح الصور المؤقتة
          </Button>
        )}
        
        {onRunCleanup && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRunCleanup}
          >
            <RotateCcw className="h-4 w-4 ml-1" />
            تنظيف السجلات القديمة
          </Button>
        )}
        
        {isProcessing && onPauseProcessing && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onPauseProcessing}
          >
            <PauseCircle className="h-4 w-4 ml-1" />
            إيقاف المعالجة
          </Button>
        )}
        
        {isProcessing && onClearQueue && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearQueue}
          >
            <Trash2 className="h-4 w-4 ml-1" />
            مسح قائمة الانتظار
          </Button>
        )}
        
        {!isProcessing && onRetryProcessing && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={onRetryProcessing}
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            إعادة المعالجة
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
