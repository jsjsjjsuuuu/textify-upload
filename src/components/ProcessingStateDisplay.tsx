
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Clock, Pause, RefreshCw, Trash2 } from 'lucide-react';
import { getNextApiKey, getApiKeyStats } from '@/lib/gemini/apiKeyManager';

interface ProcessingStateDisplayProps {
  activeUploads: number;
  queueLength: number;
  onRetry: () => void;
  onPause: () => void;
  onClear: () => void;
  isProcessing: boolean;
}

const ProcessingStateDisplay: React.FC<ProcessingStateDisplayProps> = ({
  activeUploads,
  queueLength,
  onRetry,
  onPause,
  onClear,
  isProcessing
}) => {
  // التحقق من حالة مفاتيح API
  const apiKeyStats = useMemo(() => getApiKeyStats(), []);
  
  // التحقق من وجود مفتاح API نشط
  const currentApiKey = getNextApiKey();
  const hasValidApiKey = currentApiKey && currentApiKey.length > 20;
  
  // إذا لم تكن هناك عمليات معالجة نشطة أو قائمة انتظار، لا تعرض المكون
  if (!isProcessing && activeUploads === 0 && queueLength === 0) {
    return null;
  }
  
  return (
    <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center">
            {isProcessing ? (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin ml-2" />
            ) : (
              <Clock className="h-5 w-5 text-blue-500 ml-2" />
            )}
            
            <div className="mr-2">
              <h4 className="font-medium">حالة معالجة الصور</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  الصور النشطة: {activeUploads}
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  في قائمة الانتظار: {queueLength}
                </Badge>
                <Badge variant="outline" className={`
                  ${hasValidApiKey ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}
                `}>
                  مفاتيح API: {apiKeyStats.active}/{apiKeyStats.total}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 self-end sm:self-auto">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onPause} 
              className="text-yellow-600 border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
            >
              <Pause className="h-3 w-3 ml-1" />
              إيقاف مؤقت
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRetry} 
              className="text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100"
              disabled={!hasValidApiKey}
            >
              <RefreshCw className="h-3 w-3 ml-1" />
              إعادة تشغيل
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onClear} 
              className="text-red-600 border-red-300 bg-red-50 hover:bg-red-100"
            >
              <Trash2 className="h-3 w-3 ml-1" />
              مسح القائمة
            </Button>
          </div>
        </div>
        
        {!hasValidApiKey && (
          <div className="mt-3 flex items-center text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
            <AlertCircle className="h-4 w-4 ml-1 flex-shrink-0" />
            <span>لا يوجد مفتاح API صالح. يرجى إضافة مفتاح API في الإعدادات.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingStateDisplay;
