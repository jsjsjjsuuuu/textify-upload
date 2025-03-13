
import { AlertCircle } from "lucide-react";
import TextField from "./TextField";

interface PhoneNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  isRequired?: boolean;
}

const PhoneNumberField = ({ value, onChange, isValid, isRequired = false }: PhoneNumberFieldProps) => {
  const hasError = (value && !isValid) || (isRequired && !value);
  const errorMessage = value && !isValid 
    ? "يجب أن يكون رقم الهاتف 11 رقم بالضبط" 
    : isRequired && !value 
      ? "حقل إلزامي" 
      : "";
  
  const errorElement = hasError ? (
    <span className="text-xs text-destructive font-normal flex items-center">
      <AlertCircle className="h-3 w-3 ml-1" />
      خطأ
    </span>
  ) : null;

  return (
    <TextField
      label={`رقم الهاتف:${isRequired ? ' *' : ''}`}
      value={value || ''}
      onChange={onChange}
      placeholder="أدخل رقم الهاتف"
      hasError={hasError}
      errorMessage={errorMessage}
      rightElement={errorElement}
    />
  );
};

export default PhoneNumberField;
