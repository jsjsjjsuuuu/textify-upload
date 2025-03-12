
import { Input } from "@/components/ui/input";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  errorMessage?: string;
  hasError?: boolean;
  rightElement?: React.ReactNode;
}

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  errorMessage,
  hasError = false,
  rightElement
}: TextFieldProps) => {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium flex justify-between">
        <span>{label}</span>
        {rightElement && (
          <div className="flex items-center space-x-2 space-x-reverse">
            {rightElement}
          </div>
        )}
      </label>
      <div className="space-y-1">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm ${hasError ? "border-destructive" : ""}`}
          placeholder={placeholder}
        />
        {errorMessage && hasError && <p className="text-xs text-destructive">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default TextField;
