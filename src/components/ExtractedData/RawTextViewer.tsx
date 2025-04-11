
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface RawTextViewerProps {
  text?: string;
}

const RawTextViewer = ({ text }: RawTextViewerProps) => {
  if (!text) return null;

  return (
    <div 
      className="text-xs font-mono whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-800 p-3 rounded border overflow-auto max-h-40" 
      dir="ltr"
    >
      {text}
    </div>
  );
};

export default RawTextViewer;
