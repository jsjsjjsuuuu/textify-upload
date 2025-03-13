
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IRAQ_PROVINCES } from "@/utils/provinces";
import { AlertCircle } from "lucide-react";

interface ProvinceFieldProps {
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  hasError?: boolean;
}

const ProvinceField = ({ value, onChange, isRequired = false, hasError = false }: ProvinceFieldProps) => {
  // ترتيب المحافظات أبجدياً
  const sortedProvinces = [...IRAQ_PROVINCES].sort((a, b) => a.localeCompare(b));
  
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium flex justify-between">
        <span>{`المحافظة:${isRequired ? ' *' : ''}`}</span>
      </label>
      <Select value={value || ''} onValueChange={onChange} dir="rtl">
        <SelectTrigger className={`bg-white dark:bg-gray-900 h-8 text-sm ${hasError ? 'border-destructive ring-1 ring-destructive' : ''}`}>
          <SelectValue placeholder="اختر المحافظة" />
        </SelectTrigger>
        <SelectContent>
          {sortedProvinces.map(province => (
            <SelectItem key={province} value={province}>
              {province}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && (
        <p className="text-xs text-destructive flex items-center">
          <AlertCircle className="h-3 w-3 ml-1" />
          حقل إلزامي
        </p>
      )}
    </div>
  );
};

export default ProvinceField;
