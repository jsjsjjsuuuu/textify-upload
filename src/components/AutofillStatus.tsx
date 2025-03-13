
import { useState, useEffect } from 'react';
import { ImageData } from '@/types/ImageData';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AutofillStatusProps {
  image: ImageData;
}

export const AutofillStatus = ({ image }: AutofillStatusProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!image.autoFillResult || image.autoFillResult.length === 0) {
    return null;
  }
  
  // ترتيب نتائج الإدخال التلقائي من الأحدث للأقدم
  const sortedResults = [...image.autoFillResult].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
  
  const lastResult = sortedResults[0];
  
  // حساب إحصائيات الإدخال التلقائي
  const totalAttempts = sortedResults.length;
  const successfulAttempts = sortedResults.filter(r => r.success).length;
  const successRate = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0;
  
  return (
    <div className="mt-3 border rounded-md p-2">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          {lastResult.success ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          )}
          <span className="text-sm font-medium">حالة الإدخال التلقائي:</span>
          <Badge variant={lastResult.success ? "success" : "destructive"} className="text-xs">
            {lastResult.success ? 'ناجح' : 'فاشل'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {new Date(lastResult.timestamp).toLocaleString('ar-EG')}
          </span>
          <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-2 pt-2 border-t text-xs">
          <div className="grid grid-cols-2 gap-y-1">
            <div className="text-gray-600">الشركة:</div>
            <div>{lastResult.company}</div>
            
            <div className="text-gray-600">الحقول المكتشفة:</div>
            <div>{lastResult.fieldsFound}</div>
            
            <div className="text-gray-600">الحقول التي تم ملؤها:</div>
            <div>{lastResult.fieldsFilled}</div>
            
            <div className="text-gray-600">معدل النجاح:</div>
            <div className="flex items-center">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${successRate >= 70 ? 'bg-green-500' : successRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                  style={{ width: `${successRate}%` }}
                />
              </div>
              <span className="ml-2">{successRate}%</span>
            </div>
            
            <div className="text-gray-600">عدد المحاولات:</div>
            <div>{totalAttempts}</div>
            
            {lastResult.error && (
              <>
                <div className="text-gray-600">الخطأ:</div>
                <div className="text-red-500">{lastResult.error}</div>
              </>
            )}
          </div>
          
          {totalAttempts > 1 && (
            <div className="mt-2">
              <h4 className="font-semibold mb-1">سجل المحاولات:</h4>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {sortedResults.slice(1).map((result, index) => (
                  <div key={index} className="flex items-center gap-1 text-2xs py-1 border-b last:border-0">
                    {result.success ? (
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                    ) : (
                      <XCircle size={12} className="text-red-500 shrink-0" />
                    )}
                    <span className="truncate">
                      {new Date(result.timestamp).toLocaleTimeString('ar-EG')}
                    </span>
                    <span className="truncate flex-1">
                      {result.success ? `تم ملء ${result.fieldsFilled} حقل` : result.error || 'فشل'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutofillStatus;
