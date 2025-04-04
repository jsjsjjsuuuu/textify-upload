
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// متغير لتتبع ما إذا كانت عملية التنظيف جارية
let isCleanupRunning = false;

export const useCleanupSystem = (runDbCleanupNow: (userId: string) => Promise<boolean>, user: any) => {
  const { toast } = useToast();

  // تنفيذ عملية التنظيف مرة واحدة فقط
  const runCleanupNow = useCallback(async () => {
    if (!user || isCleanupRunning) return false;
    
    isCleanupRunning = true;
    try {
      await runDbCleanupNow(user.id);
      return true;
    } finally {
      // السماح بتشغيل التنظيف مرة أخرى بعد الانتهاء
      setTimeout(() => {
        isCleanupRunning = false;
      }, 5000);
    }
  }, [user, runDbCleanupNow]);

  return {
    runCleanupNow,
    isCleanupRunning: () => isCleanupRunning
  };
};
