
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IRAQ_PROVINCES } from "@/utils/provinces";
import { ImageData } from "@/types/ImageData";

interface ProvinceFieldProps {
  image: ImageData;
  confidence: number;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ProvinceField = ({ image, confidence, onTextChange }: ProvinceFieldProps) => {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium flex justify-between">
        <span>المحافظة:</span>
        {confidence && (
          <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
            {confidence}%
          </span>
        )}
      </label>
      <Select
        value={image.province || ''}
        onValueChange={value => onTextChange(image.id, "province", value)}
        dir="rtl"
      >
        <SelectTrigger className="bg-white dark:bg-gray-900 h-8 text-sm">
          <SelectValue placeholder="اختر المحافظة" />
        </SelectTrigger>
        <SelectContent>
          {IRAQ_PROVINCES.map((province) => (
            <SelectItem key={province} value={province}>
              {province}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProvinceField;
