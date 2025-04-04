
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader } from 'lucide-react';

interface ProcessingInfoProps {
  isProcessing: boolean;
  progress: {
    total: number;
    current: number;
    errors: number;
  };
}

const ProcessingInfo: React.FC<ProcessingInfoProps> = ({ isProcessing, progress }) => {
  if (!isProcessing && progress.total === 0) {
    return null;
  }

  const calculateProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.min(
      100, 
      Math.round((progress.current / progress.total) * 100)
    );
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Loader className={`mr-2 h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          <h3 className="font-medium">
            {isProcessing ? "جاري معالجة الصور..." : "اكتملت المعالجة"}
          </h3>
        </div>
        <span className="text-sm font-medium">{calculateProgressPercentage()}%</span>
      </div>
      
      <Progress value={calculateProgressPercentage()} className="h-2 mb-2" />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>تم معالجة {progress.current} من {progress.total}</span>
        {progress.errors > 0 && (
          <span className="text-destructive">
            الأخطاء: {progress.errors}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProcessingInfo;
