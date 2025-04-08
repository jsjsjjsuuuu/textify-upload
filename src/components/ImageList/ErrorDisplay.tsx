
import React from 'react';
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageErrorDisplayProps {
  onRetry: () => void;
  errorMessage?: string;
  retryCount?: number;
}

const ErrorDisplay = ({ onRetry, errorMessage, retryCount = 0 }: ImageErrorDisplayProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-4 text-red-500"
      >
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <path d="m6 6 12 12" />
        <circle cx="10" cy="10" r="1" />
      </svg>

      <h3 className="text-lg font-semibold mb-1 text-red-500">
        خطأ في تحميل الصورة
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        {errorMessage || "تعذر تحميل الصورة، الرجاء المحاولة مرة أخرى"}
      </p>
      
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onRetry}
        className="gap-1"
      >
        <RefreshCcw className="w-4 h-4" />
        إعادة المحاولة
        {retryCount > 0 && (
          <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 px-1 rounded-full">
            {retryCount}
          </span>
        )}
      </Button>
    </div>
  );
};

export default ErrorDisplay;
