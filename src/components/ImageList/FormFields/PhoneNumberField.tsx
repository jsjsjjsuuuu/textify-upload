
import { AlertCircle } from "lucide-react";
import TextField from "./TextField";

interface PhoneNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  label?: string;
  placeholder?: string;
}

const PhoneNumberField = ({ 
  value, 
  onChange, 
  isValid,
  label = "رقم الهاتف:",
  placeholder = "أدخل رقم الهاتف"
}: PhoneNumberFieldProps) => {
  const errorElement = value && !isValid ? (
    <span className="text-xs text-destructive font-normal flex items-center">
      <AlertCircle className="h-3 w-3 ml-1" />
      خطأ
    </span>
  ) : null;

  return (
    <TextField
      label={label}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      hasError={value && !isValid ? true : false}
      errorMessage="يجب أن يكون رقم الهاتف 11 رقم بالضبط"
      rightElement={errorElement}
    />
  );
};

export default PhoneNumberField;
