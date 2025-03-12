
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/gemini/utils";

export const useCustomTextHandlers = (handleTextChange: (id: string, field: string, value: string) => void) => {
  const { toast } = useToast();

  // تخصيص معالج تغيير النص لتنسيق السعر تلقائيًا
  const handleCustomTextChange = (id: string, field: string, value: string) => {
    // إذا كان الحقل هو السعر، نتحقق من التنسيق
    if (field === "price" && value) {
      const originalValue = value;
      const formattedValue = formatPrice(value);
      
      // إذا كان التنسيق مختلفًا عن القيمة الأصلية، نستخدم القيمة المنسقة
      if (formattedValue !== originalValue) {
        console.log(`تنسيق السعر تلقائيًا: "${originalValue}" -> "${formattedValue}"`);
        value = formattedValue;
        
        // إظهار إشعار بالتغيير
        toast({
          title: "تم تنسيق السعر تلقائيًا",
          description: `تم تحويل "${originalValue}" إلى "${formattedValue}"`,
          variant: "default"
        });
      }
    }
    
    // استدعاء معالج تغيير النص الأصلي
    handleTextChange(id, field, value);
  };

  return { handleCustomTextChange };
};
