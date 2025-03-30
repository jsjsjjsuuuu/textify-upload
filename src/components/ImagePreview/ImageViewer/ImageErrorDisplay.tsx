
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageErrorDisplayProps {
  onRetry: () => void;
  errorMessage?: string;
}

const ImageErrorDisplay: React.FC<ImageErrorDisplayProps> = ({ 
  onRetry,
  errorMessage = "تعذر تحميل الصورة"
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 bg-gray-50 dark:bg-gray-800/50 rounded-md">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-center text-muted-foreground mb-4">{errorMessage}</p>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={onRetry}
      >
        <RefreshCw className="h-4 w-4" />
        إعادة المحاولة
      </Button>
    </div>
  );
};

export default ImageErrorDisplay;
