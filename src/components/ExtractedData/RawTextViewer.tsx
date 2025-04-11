
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RawTextViewerProps {
  text?: string;
}

const RawTextViewer = ({ text }: RawTextViewerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!text) return null;

  return (
    <div dir="rtl">
      <button 
        onClick={() => setIsVisible(!isVisible)} 
        className="text-xs text-muted-foreground hover:underline mb-2 block"
      >
        {isVisible ? 'إخفاء النص المستخرج' : 'عرض النص المستخرج'}
      </button>
      
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="text-xs font-mono whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-800 p-3 rounded border overflow-auto max-h-40" 
        >
          {text}
        </motion.div>
      )}
    </div>
  );
};

export default RawTextViewer;
