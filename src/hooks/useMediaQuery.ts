
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // تعيين الحالة المبدئية
    setMatches(mediaQuery.matches);

    // إنشاء دالة المستمع
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    
    // إضافة المستمع
    mediaQuery.addEventListener('change', handler);
    
    // تنظيف المستمع عند تفكيك المكون
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
