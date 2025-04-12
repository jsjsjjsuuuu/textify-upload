
import { useState, useRef, useEffect, useCallback } from 'react';

interface CacheObject<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  ttl?: number; // وقت الصلاحية بالمللي ثانية (الافتراضي هو 5 دقائق)
}

/**
 * هوك لتخزين البيانات مؤقتًا وتحسين الأداء
 */
export const useCache = <T>(key: string, options: CacheOptions = {}) => {
  const { ttl = 5 * 60 * 1000 } = options; // 5 دقائق كقيمة افتراضية
  
  const cache = useRef<Map<string, CacheObject<T>>>(new Map());
  const [isStale, setIsStale] = useState<boolean>(true);
  
  // تحقق من صلاحية البيانات المخزنة مؤقتًا
  const checkFreshness = useCallback(() => {
    const cachedItem = cache.current.get(key);
    
    if (!cachedItem) {
      return false;
    }
    
    const now = Date.now();
    const isExpired = (now - cachedItem.timestamp) > ttl;
    
    if (isExpired) {
      cache.current.delete(key);
      return false;
    }
    
    return true;
  }, [key, ttl]);
  
  // تخزين البيانات في المخبأ
  const setCache = useCallback((data: T) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });
    setIsStale(false);
  }, [key]);
  
  // استرداد البيانات من المخبأ
  const getCache = useCallback((): T | null => {
    if (!checkFreshness()) {
      return null;
    }
    
    return cache.current.get(key)?.data || null;
  }, [key, checkFreshness]);
  
  // تنظيف المخبأ منتظمًا
  useEffect(() => {
    const interval = setInterval(() => {
      if (!checkFreshness() && !isStale) {
        setIsStale(true);
      }
    }, Math.min(ttl / 2, 60000)); // تحقق كل دقيقة أو نصف مدة الصلاحية (أيهما أقل)
    
    return () => clearInterval(interval);
  }, [checkFreshness, ttl, isStale]);
  
  return {
    getCache,
    setCache,
    isStale,
    invalidate: () => setIsStale(true),
    clear: () => {
      cache.current.delete(key);
      setIsStale(true);
    }
  };
};
