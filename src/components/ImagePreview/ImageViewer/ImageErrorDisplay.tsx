
import React from 'react';
import { AlertCircle, RefreshCw, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useImageStats } from "@/hooks/useImageStats";

interface ImageErrorDisplayProps {
  onRetry: () => void;
  errorMessage?: string;
  retryCount?: number;
  isApiKeyError?: boolean; // إضافة خاصية للتحقق مما إذا كان الخطأ متعلقًا بمفتاح API
}

const ImageErrorDisplay: React.FC<ImageErrorDisplayProps> = ({ 
  onRetry,
  errorMessage = "تعذر تحميل الصورة",
  retryCount = 0,
  isApiKeyError = false
}) => {
  const { user } = useAuth();
  const { clearProcessedImagesCache } = useImageStats();
  
  // التحقق مما إذا كان الخطأ متعلقًا بمفتاح API
  const isApiError = isApiKeyError || 
    errorMessage.includes('API key') || 
    errorMessage.includes('مفتاح API') ||
    errorMessage.includes('API_KEY_INVALID') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('حصة');
  
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 bg-gray-50 dark:bg-gray-800/50 rounded-md">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      
      <p className="text-center text-muted-foreground mb-4 whitespace-pre-line">{errorMessage}</p>
      
      {retryCount > 0 && (
        <p className="text-sm text-muted-foreground mb-2">
          عدد المحاولات: {retryCount}
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
        
        {isApiError && user?.is_admin && (
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => window.location.href = '/app#gemini-api-manager'}
          >
            <Key className="h-4 w-4" />
            إدارة مفتاح API
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImageErrorDisplay;
