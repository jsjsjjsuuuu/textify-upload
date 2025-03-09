
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ExtractedDataFieldProps {
  label: string;
  value: string;
  editMode: boolean;
  placeholder: string;
  onChange?: (value: string) => void;
}

const ExtractedDataField = ({ 
  label, 
  value, 
  editMode, 
  placeholder,
  onChange 
}: ExtractedDataFieldProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1 flex items-center justify-between">
        {label}:
        {value && !editMode && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs text-green-600 dark:text-green-400 font-normal flex items-center"
          >
            <Check size={12} className="mr-1" /> تم التعبئة
          </motion.span>
        )}
      </label>
      {editMode ? (
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Input 
            value={value} 
            onChange={e => onChange?.(e.target.value)} 
            className="rtl-textarea bg-white dark:bg-gray-900" 
            dir="rtl" 
            placeholder={placeholder}
          />
        </motion.div>
      ) : (
        <motion.div 
          className={`border rounded p-2 ${value ? 'bg-gray-50 dark:bg-gray-800/60' : 'bg-gray-100 dark:bg-gray-800/30'} min-h-10 flex items-center transition-colors`}
          whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        >
          {value || <span className="text-muted-foreground text-sm">غير متوفر</span>}
        </motion.div>
      )}
    </div>
  );
};

export default ExtractedDataField;
