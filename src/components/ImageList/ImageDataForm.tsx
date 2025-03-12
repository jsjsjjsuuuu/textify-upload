
import { ImageData } from "@/types/ImageData";
import { FormFields } from "./FormFields";
import ExtractedTextDisplay from "./FormFields/ExtractedTextDisplay";

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
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-2">
        <FormFields.TextField
          id={image.id}
          label="الكود"
          value={image.code}
          field="code"
          onChange={onTextChange}
        />
        
        <FormFields.TextField
          id={image.id}
          label="اسم المرسل"
          value={image.senderName}
          field="senderName"
          onChange={onTextChange}
          className="col-span-1"
        />
        
        <FormFields.PhoneNumberField
          id={image.id}
          label="رقم الهاتف"
          value={image.phoneNumber}
          field="phoneNumber"
          onChange={onTextChange}
        />
        
        <FormFields.ProvinceField
          id={image.id}
          label="المحافظة"
          value={image.province}
          field="province"
          onChange={onTextChange}
        />
        
        <FormFields.PriceField
          id={image.id}
          label="السعر"
          value={image.price}
          field="price"
          onChange={onTextChange}
        />
        
        <FormFields.TextField
          id={image.id}
          label="اسم الشركة"
          value={image.companyName}
          field="companyName"
          onChange={onTextChange}
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
