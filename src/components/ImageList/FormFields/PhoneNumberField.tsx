
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
  
  // تحسين تجربة المستخدم بإضافة تنسيق تلقائي للأرقام
  const handlePhoneNumberChange = (inputValue: string) => {
    // إزالة جميع الرموز غير الرقمية
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    // إذا كان الرقم يبدأ بـ 964 (رمز العراق الدولي)، نستبدله بـ 0
    let formattedNumber = digitsOnly;
    if (formattedNumber.startsWith('964')) {
      formattedNumber = '0' + formattedNumber.substring(3);
    }
    
    // إذا كان الرقم يبدأ بـ 7 (بدون الصفر)، نضيف 0 في البداية
    if (formattedNumber.startsWith('7') && formattedNumber.length === 10) {
      formattedNumber = '0' + formattedNumber;
    }
    
    // تقييد الطول إلى 11 رقم كحد أقصى
    formattedNumber = formattedNumber.substring(0, 11);
    
    onChange(formattedNumber);
  };

  const errorElement = hasError ? (
    <span className="text-xs text-destructive font-normal flex items-center">
      <AlertCircle className="h-3 w-3 ml-1" />
      {errorMessage || "خطأ"}
    </span>
  ) : null;

  return (
    <TextField
      label={`رقم الهاتف:${isRequired ? ' *' : ''}`}
      value={value || ''}
      onChange={handlePhoneNumberChange}
      placeholder="أدخل رقم الهاتف"
      hasError={hasError}
      errorMessage={errorMessage}
      rightElement={errorElement}
    />
  );
};

export default PhoneNumberField;
