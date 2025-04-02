
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // تحقق من إذا كان في بيئة المتصفح
    if (typeof window === "undefined") {
      return;
    }

    // إنشاء كائن mediaQuery
    const mediaQuery = window.matchMedia(query);

    // تعيين الحالة الأولية
    setMatches(mediaQuery.matches);

    // إنشاء وظيفة المستمع للتغييرات
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // إضافة المستمع للتغييرات
    mediaQuery.addEventListener("change", handler);

    // تنظيف عند إلغاء تحميل المكون
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}
