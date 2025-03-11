
import { Input } from "@/components/ui/input";
import { ImageData } from "@/types/ImageData";

interface TextFieldProps {
  image: ImageData;
  field: "companyName" | "code" | "senderName" | "phoneNumber";
  label: string;
  placeholder: string;
  confidence?: number;
  isValid?: boolean;
  errorMessage?: string;
  onTextChange: (id: string, field: string, value: string) => void;
}

const TextField = ({ 
  image, 
  field, 
  label, 
  placeholder, 
  confidence, 
  isValid = true, 
  errorMessage,
  onTextChange 
}: TextFieldProps) => {
  const value = image[field] || '';
  
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium flex justify-between">
        <span>{label}:</span>
        {confidence !== undefined && (
          <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
            {confidence}%
          </span>
        )}
      </label>
      <div className="space-y-1">
        <Input 
          value={value} 
          onChange={e => onTextChange(image.id, field, e.target.value)} 
          className={`rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm ${!isValid ? "border-destructive" : ""}`}
          placeholder={placeholder}
        />
        {!isValid && errorMessage && (
          <p className="text-xs text-destructive">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default TextField;
