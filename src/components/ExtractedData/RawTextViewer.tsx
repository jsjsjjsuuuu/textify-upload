
import { useState } from "react";
import { Copy, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface RawTextViewerProps {
  text?: string;
}

const RawTextViewer = ({ text }: RawTextViewerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    if (text) {
      navigator.clipboard.writeText(text);
      setHasCopied(true);
      
      toast({
        title: "تم النسخ",
        description: "تم نسخ النص إلى الحافظة"
      });
      
      setTimeout(() => setHasCopied(false), 2000);
    }
  };
  
  if (!text) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-md shadow-sm bg-white/80 dark:bg-gray-900/80"
    >
      <div className="flex items-center justify-between p-2">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center w-full justify-between text-xs hover:bg-transparent hover:underline p-0 h-auto"
          >
            <span>النص المستخرج ({text.length} حرف)</span>
            <ChevronsUpDown size={16} className="h-4 w-4 ml-1 shrink-0 opacity-50" />
          </Button>
        </CollapsibleTrigger>
        
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          onClick={copyToClipboard}
        >
          <AnimatePresence>
            {hasCopied ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center justify-center"
              >
                <Check className="h-4 w-4 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center justify-center"
              >
                <Copy className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>

      <CollapsibleContent className="px-4 pb-4">
        <div className="text-xs font-mono whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-800 p-3 rounded border overflow-auto max-h-40" dir="ltr">
          {text}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default RawTextViewer;
