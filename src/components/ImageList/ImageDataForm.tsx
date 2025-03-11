
import { ImageData } from "@/types/ImageData";
import { TextField, PhoneField, ProvinceField, PriceField, ExtractedTextViewer } from "./FormFields";

interface ImageDataFormProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ImageDataForm = ({ image, onTextChange }: ImageDataFormProps) => {
  // Calculate field confidence scores based on overall confidence
  const getFieldConfidence = (field: string): number => {
    if (!image.confidence) return 0;
    return image.confidence;
  };
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-brand-brown dark:text-brand-beige mb-3">البيانات المستخرجة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* اسم الشركة */}
        <TextField 
          image={image}
          field="companyName"
          label="اسم الشركة"
          placeholder="أدخل اسم الشركة"
          confidence={getFieldConfidence("companyName")}
          onTextChange={onTextChange}
        />
        
        {/* الكود */}
        <TextField 
          image={image}
          field="code"
          label="الكود"
          placeholder="أدخل الكود"
          confidence={getFieldConfidence("code")}
          onTextChange={onTextChange}
        />
        
        {/* اسم المرسل */}
        <TextField 
          image={image}
          field="senderName"
          label="اسم المرسل"
          placeholder="أدخل اسم المرسل"
          confidence={getFieldConfidence("senderName")}
          onTextChange={onTextChange}
        />
        
        {/* رقم الهاتف */}
        <PhoneField 
          image={image}
          confidence={getFieldConfidence("phoneNumber")}
          onTextChange={onTextChange}
        />
        
        {/* المحافظة */}
        <ProvinceField 
          image={image}
          confidence={getFieldConfidence("province")}
          onTextChange={onTextChange}
        />
        
        {/* السعر */}
        <PriceField 
          image={image}
          confidence={getFieldConfidence("price")}
          onTextChange={onTextChange}
        />
        
        {/* النص المستخرج */}
        <ExtractedTextViewer image={image} />
      </div>
    </div>
  );
};

export default ImageDataForm;
