
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/utils/parsing/formatters";

export const useTextHandler = (handleTextChange: (id: string, field: string, value: string) => void) => {
  const { toast } = useToast();

  const handleCustomTextChange = (id: string, field: string, value: string) => {
    if (field === "price" && value) {
      const originalValue = value;
      const formattedValue = formatPrice(value);
      
      if (formattedValue !== originalValue) {
        console.log(`تنسيق السعر تلقائيًا: "${originalValue}" -> "${formattedValue}"`);
        value = formattedValue;
        
        toast({
          title: "تم تنسيق السعر تلقائيًا",
          description: `تم تحويل "${originalValue}" إلى "${formattedValue}"`,
          variant: "default"
        });
      }
    }
    
    handleTextChange(id, field, value);
  };

  return { handleCustomTextChange };
};
