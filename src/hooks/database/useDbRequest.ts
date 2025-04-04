
import { useState, useRef, useCallback } from "react";

export const useDbRequest = () => {
  // استخدام مرجع لتخزين طلبات قاعدة البيانات الأخيرة لتجنب الاستدعاءات المتكررة
  const lastDbRequests = useRef<{[key: string]: {time: number, promise: Promise<any>}}>({});

  // وظيفة مساعدة لتخزين مؤقت لطلبات قاعدة البيانات المتكررة
  const cacheDbRequest = useCallback(<T>(key: string, requestFn: () => Promise<T>, ttlMs = 5000): Promise<T> => {
    const now = Date.now();
    const cachedRequest = lastDbRequests.current[key];
    
    if (cachedRequest && (now - cachedRequest.time < ttlMs)) {
      return cachedRequest.promise as Promise<T>;
    }
    
    const promise = requestFn();
    lastDbRequests.current[key] = { time: now, promise };
    return promise;
  }, []);

  // إضافة وظيفة لمسح ذاكرة التخزين المؤقت
  const clearRequestCache = useCallback(() => {
    lastDbRequests.current = {};
  }, []);

  return {
    cacheDbRequest,
    clearRequestCache
  };
};
