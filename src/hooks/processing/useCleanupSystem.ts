
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// متغير لتتبع ما إذا كانت عملية التنظيف جارية
let isCleanupRunning = false;

export const useCleanupSystem = (runDbCleanupNow: (userId: string) => Promise<boolean>, user: any) => {
  const { toast } = useToast();
  const [lastCleanupTime, setLastCleanupTime] = useState<number | null>(null);

  // تنفيذ عملية التنظيف مرة واحدة فقط
  const runCleanupNow = useCallback(async () => {
    if (!user || isCleanupRunning) return false;
    
    // التحقق من الوقت منذ آخر عملية تنظيف (لا تنظف أكثر من مرة كل ساعة)
    const now = Date.now();
    if (lastCleanupTime && now - lastCleanupTime < 3600000) {
      console.log("تم تنفيذ التنظيف مؤخرًا، سيتم تخطي هذا الطلب");
      return false;
    }
    
    isCleanupRunning = true;
    try {
      const result = await runDbCleanupNow(user.id);
      if (result) {
        setLastCleanupTime(now);
      }
      return result;
    } finally {
      // السماح بتشغيل التنظيف مرة أخرى بعد الانتهاء
      setTimeout(() => {
        isCleanupRunning = false;
      }, 5000);
    }
  }, [user, runDbCleanupNow, lastCleanupTime]);

  return {
    runCleanupNow,
    isCleanupRunning: () => isCleanupRunning,
    lastCleanupTime
  };
};
