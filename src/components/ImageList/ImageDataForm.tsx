
import { ImageData } from "@/types/ImageData";
import { 
  TextField, 
  ProvinceField, 
  PhoneNumberField, 
  PriceField, 
  ExtractedTextDisplay 
} from "./FormFields";
import CompanyAutofillButton from "@/components/CompanyAutofill/CompanyAutofillButton";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ImageDataFormProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ImageDataForm = ({
  image,
  onTextChange
}: ImageDataFormProps) => {
  const { toast } = useToast();
  const [hasMissingFields, setHasMissingFields] = useState(false);
  
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
  // التحقق من البيانات الإلزامية
  useEffect(() => {
    // التحقق من وجود الحقول الرئيسية
    const requiredFields: Array<{field: keyof ImageData, name: string}> = [
      { field: 'senderName', name: 'اسم المرسل' },
      { field: 'phoneNumber', name: 'رقم الهاتف' },
      { field: 'province', name: 'المحافظة' }
    ];
    
    const missingFields = requiredFields.filter(({ field }) => {
      return !image[field] || (field === 'phoneNumber' && !isPhoneNumberValid);
    });
    
    setHasMissingFields(missingFields.length > 0);
    
    // إظهار تنبيه فقط عند اكتمال معالجة الصورة
    if (image.status === 'completed' && missingFields.length > 0 && !image.submitted) {
      // للتجنب إظهار التنبيه في كل مرة، نضيف تأخيراً
      const timer = setTimeout(() => {
        toast({
          title: "بيانات غير مكتملة",
          description: `يُفضل إكمال الحقول التالية قبل الإرسال: ${missingFields.map(f => f.name).join('، ')}`,
          variant: "default",
          duration: 5000
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [image, isPhoneNumberValid, toast]);

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
      
      {/* تنبيه للحقول المفقودة */}
      {hasMissingFields && !image.submitted && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs">
          <p>يرجى إكمال جميع الحقول الإلزامية قبل الإرسال (الاسم، رقم الهاتف، المحافظة)</p>
        </div>
      )}
      
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
          hasError={!image.senderName && hasMissingFields}
          errorMessage="حقل إلزامي"
        />
        
        {/* رقم الهاتف مع التحقق */}
        <PhoneNumberField
          value={image.phoneNumber || ''}
          onChange={(value) => handleFieldChange("phoneNumber", value)}
          isValid={isPhoneNumberValid}
          isRequired={true}
        />
        
        {/* المحافظة */}
        <ProvinceField
          value={image.province || ''}
          onChange={(value) => handleFieldChange("province", value)}
          isRequired={true}
          hasError={!image.province && hasMissingFields}
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
