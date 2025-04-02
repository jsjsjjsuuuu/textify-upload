
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { useToast } from "@/hooks/use-toast";

const ResetProcessingButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  
  // استخدام hook معالجة الصور للوصول إلى وظائف إعادة التعيين
  const { 
    resetProcessingState, 
    clearImageCache, 
    clearQueue, 
    loadUserImages 
  } = useImageProcessing();
  
  // وظيفة لإعادة تعيين حالة المعالجة
  const handleReset = async () => {
    if (isResetting) return;
    
    setIsResetting(true);
    try {
      // إعادة تعيين حالة المعالجة
      resetProcessingState();
      
      // مسح ذاكرة التخزين المؤقت
      clearImageCache();
      
      // مسح قائمة الانتظار
      clearQueue();
      
      // إعادة تحميل صور المستخدم
      await loadUserImages();
      
      // إعلام المستخدم بنجاح العملية
      toast({
        title: "تم إعادة التعيين",
        description: "تم إعادة تعيين حالة معالجة الصور بنجاح"
      });
      
      // إخفاء الزر بعد الإعادة
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    } catch (error) {
      console.error("خطأ في إعادة تعيين حالة المعالجة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة تعيين حالة المعالجة",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  // إظهار الزر عند الضغط على مفتاح Escape ثلاث مرات متتالية
  const [escapeCount, setEscapeCount] = useState(0);
  const [lastKeyTime, setLastKeyTime] = useState(0);
  
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const now = Date.now();
        
        // إعادة تعيين العداد إذا كان آخر ضغطة منذ أكثر من ثانيتين
        if (now - lastKeyTime > 2000) {
          setEscapeCount(1);
        } else {
          setEscapeCount(prev => prev + 1);
        }
        
        setLastKeyTime(now);
        
        // إظهار الزر بعد 3 ضغطات متتالية
        if (escapeCount >= 2) {
          setIsVisible(true);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [escapeCount, lastKeyTime]);
  
  // إذا كان الزر غير مرئي، لا تعرض شيئًا
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="destructive"
        size="sm"
        className="flex items-center gap-2 shadow-md"
        onClick={handleReset}
        disabled={isResetting}
      >
        <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
        {isResetting ? 'جاري إعادة التعيين...' : 'إعادة تعيين معالجة الصور'}
      </Button>
    </div>
  );
};

export default ResetProcessingButton;
