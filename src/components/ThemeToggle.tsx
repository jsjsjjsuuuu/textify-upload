
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from '@/hooks/use-toast';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // تجنب مشكلة عدم تطابق الـ hydration عن طريق عرض المكون فقط بعد التحميل
  useEffect(() => {
    setMounted(true);
  }, []);

  // تغيير السمة مع تأثير تحوّل سلس
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    
    // إضافة تأثيرات انتقالية إلى العناصر
    document.documentElement.classList.add('theme-transition');
    
    // إظهار رسالة تأكيد
    toast({
      title: newTheme === "dark" ? "تم تفعيل الوضع الليلي" : "تم تفعيل الوضع النهاري",
      description: newTheme === "dark" ? "تم تغيير المظهر إلى الوضع الداكن" : "تم تغيير المظهر إلى الوضع الفاتح",
      duration: 2000,
    });
    
    // إزالة تأثيرات الانتقال بعد اكتمال التحويل
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  };

  if (!mounted) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full dark-transition hover:bg-primary/10"
      onClick={toggleTheme}
      aria-label="تبديل السمة"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-blue-600" />
      )}
    </Button>
  );
}
