
import { ImageData } from "@/types/ImageData";
import { 
  TextField, 
  ProvinceField, 
  PhoneNumberField, 
  PriceField, 
  ExtractedTextDisplay 
} from "./FormFields";
import { useSaveToDatabase } from "@/hooks/useSaveToDatabase";

interface ImageDataFormProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ImageDataForm = ({
  image,
  onTextChange
}: ImageDataFormProps) => {
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
  // استخدام Hook حفظ البيانات
  const { saveImageToDatabase, isSaving, savedImages } = useSaveToDatabase();

  const handleFieldChange = (field: string, value: string) => {
    onTextChange(image.id, field, value);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-brand-brown dark:text-brand-beige mb-3">البيانات المستخرجة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* اسم الشركة */}
        <TextField
          label="اسم الشركة:"
          value={image.companyName || ''}
          onChange={(value) => handleFieldChange("companyName", value)}
          placeholder="أدخل اسم الشركة"
        />
        
        {/* الكود */}
        <TextField
          label="الكود:"
          value={image.code || ''}
          onChange={(value) => handleFieldChange("code", value)}
          placeholder="أدخل الكود"
        />
        
        {/* اسم المرسل */}
        <TextField
          label="اسم المرسل:"
          value={image.senderName || ''}
          onChange={(value) => handleFieldChange("senderName", value)}
          placeholder="أدخل اسم المرسل"
        />
        
        {/* رقم الهاتف مع التحقق */}
        <PhoneNumberField
          value={image.phoneNumber || ''}
          onChange={(value) => handleFieldChange("phoneNumber", value)}
          isValid={isPhoneNumberValid}
        />
        
        {/* المحافظة */}
        <ProvinceField
          value={image.province || ''}
          onChange={(value) => handleFieldChange("province", value)}
        />
        
        {/* السعر مع زر التحقق والتنبيهات */}
        <PriceField
          value={image.price || ''}
          onChange={(value) => handleFieldChange("price", value)}
        />
        
        {/* النص المستخرج مع خيار الحفظ في قاعدة البيانات */}
        <ExtractedTextDisplay 
          text={image.extractedText} 
          confidence={image.confidence}
          onSaveToDatabase={() => saveImageToDatabase(image)}
          isSaving={isSaving[image.id]}
          isSaved={savedImages[image.id]}
        />
      </div>
    </div>
  );
};

export default ImageDataForm;
