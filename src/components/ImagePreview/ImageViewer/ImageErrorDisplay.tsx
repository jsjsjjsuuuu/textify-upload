
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageErrorDisplayProps {
  onRetry: () => void;
  retryCount: number;
  errorMessage?: string;
}

const ImageErrorDisplay: React.FC<ImageErrorDisplayProps> = ({ 
  onRetry, 
  retryCount, 
  errorMessage = "تعذر تحميل الصورة"
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/10 text-muted-foreground">
      <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
      <p className="text-sm mb-3 text-center max-w-[80%]">{errorMessage}</p>
      <Button 
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onRetry();
        }}
        className="flex items-center gap-1.5"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>إعادة المحاولة {retryCount > 0 ? `(${retryCount})` : ''}</span>
      </Button>
    </div>
  );
};

export default ImageErrorDisplay;
