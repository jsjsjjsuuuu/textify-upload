
import { ImageData } from "@/types/ImageData";
import { 
  TextField, 
  ProvinceField, 
  PhoneNumberField, 
  PriceField, 
  ExtractedTextDisplay 
} from "./FormFields";
import CompanyAutofillButton from "@/components/CompanyAutofill/CompanyAutofillButton";

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

  const handleFieldChange = (field: string, value: string) => {
    onTextChange(image.id, field, value);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-brand-brown dark:text-brand-beige">البيانات المستخرجة</h3>
        
        {/* إضافة زر الإدخال التلقائي للشركات */}
        <CompanyAutofillButton 
          imageData={image} 
          size="sm"
        />
      </div>
      
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
        
        {/* النص المستخرج */}
        <ExtractedTextDisplay 
          text={image.extractedText} 
          confidence={image.confidence} 
        />
      </div>
    </div>
  );
};

export default ImageDataForm;
