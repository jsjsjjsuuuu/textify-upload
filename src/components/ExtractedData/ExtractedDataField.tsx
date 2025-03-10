
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";

interface ExtractedDataFieldProps {
  label: string;
  value: string;
  editMode: boolean;
  placeholder: string;
  onChange?: (value: string) => void;
  options?: string[]; // Added options array for dropdowns like provinces
  fieldType?: "text" | "phone" | "code" | "price"; // نوع الحقل للتحقق
}

const ExtractedDataField = ({ 
  label, 
  value, 
  editMode, 
  placeholder,
  onChange,
  options,
  fieldType = "text"
}: ExtractedDataFieldProps) => {
  // التحقق من طول رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = fieldType !== "phone" || !value || (value.replace(/[^\d]/g, '').length === 11);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1 flex items-center justify-between">
        {label}:
        {value && !editMode && !isPhoneNumberValid && fieldType === "phone" && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs text-destructive font-normal flex items-center"
          >
            <AlertCircle size={12} className="mr-1" /> طول الرقم غير صحيح
          </motion.span>
        )}
        {value && !editMode && isPhoneNumberValid && (
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
          {options ? (
            // Use Select component for dropdown options
            <Select
              value={value}
              onValueChange={onChange}
              dir="rtl"
            >
              <SelectTrigger className="bg-white dark:bg-gray-900">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // Regular input for other fields
            <div className="space-y-1">
              <Input 
                value={value} 
                onChange={e => onChange?.(e.target.value)} 
                className={`rtl-textarea bg-white dark:bg-gray-900 ${fieldType === "phone" && value && !isPhoneNumberValid ? "border-destructive" : ""}`}
                dir="rtl" 
                placeholder={placeholder}
              />
              {fieldType === "phone" && value && !isPhoneNumberValid && (
                <p className="text-xs text-destructive">
                  يجب أن يكون رقم الهاتف 11 رقم بالضبط
                </p>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          className={`border rounded p-2 ${value ? (isPhoneNumberValid ? 'bg-gray-50 dark:bg-gray-800/60' : 'bg-red-50 dark:bg-red-900/10 border-destructive/30') : 'bg-gray-100 dark:bg-gray-800/30'} min-h-10 flex items-center transition-colors`}
          whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        >
          <div className="flex-1">
            {value || <span className="text-muted-foreground text-sm">غير متوفر</span>}
          </div>
          {fieldType === "phone" && value && !isPhoneNumberValid && (
            <span className="text-xs text-destructive mr-2 flex items-center">
              <AlertCircle size={12} className="mr-1" /> رقم غير صحيح
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ExtractedDataField;
