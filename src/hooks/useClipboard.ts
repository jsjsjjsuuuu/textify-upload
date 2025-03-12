
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرابط بنجاح"
      });
      
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      toast({
        title: "خطأ في النسخ",
        description: "لم يتم نسخ الرابط. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    copied,
    copyToClipboard
  };
};
