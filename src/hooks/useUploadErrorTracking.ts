
import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorEvent {
  message: string;
  timestamp: number;
  component: string;
}

export const useUploadErrorTracking = (componentName: string) => {
  const { toast } = useToast();
  const errors: ErrorEvent[] = [];

  const trackError = useCallback((error: Error | string) => {
    const errorEvent: ErrorEvent = {
      message: error instanceof Error ? error.message : error,
      timestamp: Date.now(),
      component: componentName
    };
    
    errors.push(errorEvent);
    console.error(`خطأ في ${componentName}:`, errorEvent);
    
    toast({
      title: "خطأ في التحميل",
      description: errorEvent.message,
      variant: "destructive"
    });

    // يمكن إضافة إرسال الأخطاء إلى خدمة تتبع الأخطاء هنا
  }, [componentName, toast]);

  useEffect(() => {
    return () => {
      if (errors.length > 0) {
        console.info(`إحصائيات الأخطاء لـ ${componentName}:`, {
          total: errors.length,
          lastError: errors[errors.length - 1]
        });
      }
    };
  }, [componentName, errors]);

  return { trackError };
};
