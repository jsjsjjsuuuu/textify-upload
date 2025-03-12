
import { ImageData } from "@/types/ImageData";
import { TextField, PhoneNumberField, ProvinceField, PriceField, ExtractedTextDisplay } from "./FormFields";

interface ImageDataFormProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
  onSaveToDatabase?: (id: string) => void;
  isSaving?: boolean;
  isSaved?: boolean;
  formatDate: (date: Date) => string;
}

const ImageDataForm = ({
  image,
  onTextChange,
  onSaveToDatabase,
  isSaving,
  isSaved,
  formatDate
}: ImageDataFormProps) => {
  const handleChange = (field: string) => (value: string) => {
    onTextChange(image.id, field, value);
  };

  // التحقق من صحة رقم الهاتف
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-2">
        <TextField
          label="الكود"
          value={image.code || ''}
          onChange={handleChange('code')}
          placeholder="أدخل الكود"
        />
        
        <TextField
          label="اسم المرسل"
          value={image.senderName || ''}
          onChange={handleChange('senderName')}
          placeholder="أدخل اسم المرسل"
        />
        
        <PhoneNumberField
          value={image.phoneNumber || ''}
          onChange={handleChange('phoneNumber')}
          isValid={isPhoneNumberValid}
        />
        
        <ProvinceField
          value={image.province || ''}
          onChange={handleChange('province')}
        />
        
        <PriceField
          value={image.price || ''}
          onChange={handleChange('price')}
        />
        
        <TextField
          label="اسم الشركة"
          value={image.companyName || ''}
          onChange={handleChange('companyName')}
          placeholder="أدخل اسم الشركة"
        />
        
        <ExtractedTextDisplay
          id={image.id}
          text={image.extractedText}
          confidence={image.confidence}
          onSaveToDatabase={onSaveToDatabase}
          isSaving={isSaving}
          isSaved={isSaved}
        />
      </div>
    </div>
  );
};

export default ImageDataForm;
