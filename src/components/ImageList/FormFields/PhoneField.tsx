
import { AlertCircle } from "lucide-react";
import TextField from "./TextField";
import { ImageData } from "@/types/ImageData";

interface PhoneFieldProps {
  image: ImageData;
  confidence: number;
  onTextChange: (id: string, field: string, value: string) => void;
}

const PhoneField = ({ image, confidence, onTextChange }: PhoneFieldProps) => {
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
  // تعديل القيمة حسب صحة الرقم
  const adjustedConfidence = isPhoneNumberValid ? confidence : Math.floor(confidence * 0.7);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium flex justify-between">
        <span>رقم الهاتف:</span>
        <div className="flex items-center space-x-2 space-x-reverse">
          {confidence && (
            <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
              {adjustedConfidence}%
            </span>
          )}
          {image.phoneNumber && !isPhoneNumberValid && (
            <span className="text-xs text-destructive font-normal flex items-center">
              <AlertCircle className="h-3 w-3 ml-1" />
              خطأ
            </span>
          )}
        </div>
      </label>
      <div className="space-y-1">
        <TextField 
          image={image}
          field="phoneNumber"
          label=""
          placeholder="أدخل رقم الهاتف"
          isValid={isPhoneNumberValid}
          errorMessage={!isPhoneNumberValid ? "يجب أن يكون رقم الهاتف 11 رقم بالضبط" : undefined}
          onTextChange={onTextChange}
        />
      </div>
    </div>
  );
};

export default PhoneField;
