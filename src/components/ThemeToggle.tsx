
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from '@/components/ui/use-toast';

export function ThemeToggle() {
  // بما أننا نستخدم ثيم واحد داكن، فنحن نحتفظ فقط بحالة مركبة للإظهار فقط
  const [mounted, setMounted] = useState(false);

  // تجنب مشكلة عدم تطابق الـ hydration عن طريق عرض المكون فقط بعد التحميل
  useEffect(() => {
    setMounted(true);
  }, []);

  // تغيير السمة مع تأثير تحوّل سلس - تم تبسيطها لمجرد إظهار رسالة
  const toggleTheme = () => {
    // إظهار رسالة تأكيد
    toast({
      title: "الوضع الليلي مفعل دائمًا",
      description: "تم تصميم هذا التطبيق بحيث يكون في الوضع الليلي بشكل دائم",
      duration: 2000,
    });
  };

  if (!mounted) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full dark-transition hover:bg-primary/10 bg-transparent border border-white/10"
      onClick={toggleTheme}
      aria-label="وضع الظلام مفعل"
      title="وضع الظلام مفعل"
    >
      <Moon className="h-5 w-5 text-blue-400" />
    </Button>
  );
}
