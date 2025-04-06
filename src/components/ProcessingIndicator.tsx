
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Loader, AlertCircle, Check, Clock } from "lucide-react";

interface ProcessingIndicatorProps {
  isProcessing: boolean;
  processingProgress: number;
  activeUploads: number;
  queueLength: number;
  error?: string;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  isProcessing,
  processingProgress,
  activeUploads,
  queueLength,
  error
}) => {
  if (!isProcessing && processingProgress === 0 && activeUploads === 0 && queueLength === 0) {
    return null;
  }

  const getStatusMessage = () => {
    if (error) {
      return (
        <div className="flex items-center text-red-500">
          <AlertCircle className="h-4 w-4 ml-1" />
          <span>{error}</span>
        </div>
      );
    }

    if (!isProcessing && processingProgress === 100) {
      return (
        <div className="flex items-center text-green-500">
          <Check className="h-4 w-4 ml-1" />
          <span>تمت معالجة جميع الصور بنجاح</span>
        </div>
      );
    }

    if (isProcessing && queueLength > 0) {
      return (
        <div className="flex items-center text-blue-500">
          <Loader className="h-4 w-4 ml-1 animate-spin" />
          <span>جاري معالجة {activeUploads} من {queueLength} صورة...</span>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="flex items-center text-blue-500">
          <Loader className="h-4 w-4 ml-1 animate-spin" />
          <span>جاري معالجة الصور...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-yellow-500">
        <Clock className="h-4 w-4 ml-1" />
        <span>في انتظار معالجة الصور...</span>
      </div>
    );
  };

  return (
    <div className="mb-4 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="mb-2 flex justify-between items-center">
        <span className="font-medium">حالة المعالجة</span>
        {getStatusMessage()}
      </div>
      
      <Progress value={processingProgress} className="h-2" />
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {processingProgress > 0 && (
          <span>{Math.round(processingProgress)}% مكتمل</span>
        )}
        {queueLength > 0 && (
          <span className="mr-2">
            {queueLength - activeUploads} في قائمة الانتظار
          </span>
        )}
      </div>
    </div>
  );
};

export default ProcessingIndicator;
