
import { useState, useRef, useCallback } from "react";

export const useDbRequest = () => {
  // استخدام مرجع لتخزين طلبات قاعدة البيانات الأخيرة لتجنب الاستدعاءات المتكررة
  const lastDbRequests = useRef<{[key: string]: {time: number, promise: Promise<any>}}>({});

  // وظيفة مساعدة لتخزين مؤقت لطلبات قاعدة البيانات المتكررة
  const cacheDbRequest = useCallback((key: string, requestFn: () => Promise<any>, ttlMs = 5000): Promise<any> => {
    const now = Date.now();
    const cachedRequest = lastDbRequests.current[key];
    
    if (cachedRequest && (now - cachedRequest.time < ttlMs)) {
      return cachedRequest.promise;
    }
    
    const promise = requestFn();
    lastDbRequests.current[key] = { time: now, promise };
    return promise;
  }, []);

  return {
    cacheDbRequest
  };
};
