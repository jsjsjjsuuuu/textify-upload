
import { useState, useEffect } from "react";

export const useImageStats = () => {
  const [processingProgress, setProcessingProgress] = useState(0);
  const [bookmarkletStats, setBookmarkletStats] = useState({ total: 0, ready: 0, success: 0, error: 0 });
  
  // مراقبة شريط التقدم للتأكد من عدم توقفه
  useEffect(() => {
    // إعادة تعيين التقدم بعد انتهاء المعالجة بفترة
    if (processingProgress === 100) {
      const resetTimer = setTimeout(() => {
        setProcessingProgress(0);
      }, 3000);
      
      return () => clearTimeout(resetTimer);
    }
    
    // التأكد من أن التقدم لا يتجمد عند قيمة منخفضة لفترات طويلة
    if (processingProgress > 0 && processingProgress < 10) {
      const progressUpdateTimer = setTimeout(() => {
        // لا نحتاج إلى زيادة التقدم هنا، فقط نضمن أنه يتم تحديثه في مكان آخر
      }, 15000); // إذا ظل التقدم ثابتًا لأكثر من 15 ثانية
      
      return () => clearTimeout(progressUpdateTimer);
    }
  }, [processingProgress]);
  
  return {
    processingProgress,
    setProcessingProgress,
    bookmarkletStats,
    setBookmarkletStats
  };
};
