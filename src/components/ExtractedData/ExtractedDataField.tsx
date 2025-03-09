
import { Input } from "@/components/ui/input";

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
      <label className="block text-sm font-medium mb-1">{label}:</label>
      {editMode ? (
        <Input 
          value={value} 
          onChange={e => onChange?.(e.target.value)} 
          className="rtl-textarea" 
          dir="rtl" 
          placeholder={placeholder}
        />
      ) : (
        <div className="border rounded p-2 bg-gray-50 min-h-10 flex items-center">
          {value || <span className="text-muted-foreground text-sm">غير متوفر</span>}
        </div>
      )}
    </div>
  );
};

export default ExtractedDataField;
