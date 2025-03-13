
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IRAQ_PROVINCES } from "@/utils/provinces";

interface ProvinceFieldProps {
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  hasError?: boolean;
}

const ProvinceField = ({ value, onChange, isRequired = false, hasError = false }: ProvinceFieldProps) => {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium flex justify-between">
        <span>{`المحافظة:${isRequired ? ' *' : ''}`}</span>
      </label>
      <Select value={value || ''} onValueChange={onChange} dir="rtl">
        <SelectTrigger className={`bg-white dark:bg-gray-900 h-8 text-sm ${hasError ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="اختر المحافظة" />
        </SelectTrigger>
        <SelectContent>
          {IRAQ_PROVINCES.map(province => (
            <SelectItem key={province} value={province}>
              {province}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && <p className="text-xs text-destructive">حقل إلزامي</p>}
    </div>
  );
};

export default ProvinceField;
