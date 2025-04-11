
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  RefreshCw, 
  RotateCcw,
  Layout,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  isProcessing: boolean;
  onClearSessionImages?: () => void;
  onRetryProcessing?: () => void;
  onClearQueue?: () => void;
  onRunCleanup?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isProcessing,
  onClearSessionImages,
  onRetryProcessing,
  onClearQueue,
  onRunCleanup
}) => {
  return (
    <div className="mb-8 bg-white dark:bg-gray-800 shadow rounded-xl px-6 py-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Layout className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <BarChart3 className="ml-1 h-3 w-3" />
              إحصائيات المعالجة
            </Badge>
            <p className="text-muted-foreground text-sm">إدارة ومعالجة الصور والبيانات المستخرجة</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {onClearSessionImages && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearSessionImages}
              className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
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
              className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 ml-1" />
              تنظيف السجلات
            </Button>
          )}
          
          {!isProcessing && onRetryProcessing && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={onRetryProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 ml-1" />
              إعادة المعالجة
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

