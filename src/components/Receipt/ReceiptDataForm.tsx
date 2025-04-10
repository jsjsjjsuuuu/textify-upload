
import React from "react";
import { ImageData } from "@/types/ImageData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReceiptDataFormProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ReceiptDataForm: React.FC<ReceiptDataFormProps> = ({
  image,
  onTextChange,
}) => {
  // تنسيق رقم الهاتف
  const formatPhoneNumber = (value: string) => {
    // إزالة كل شيء ما عدا الأرقام
    const numericValue = value.replace(/[^\d]/g, '');
    return numericValue;
  };

  // التحقق من صحة رقم الهاتف (11 رقم)
  const hasPhoneError = (): boolean => {
    return !!image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11;
  };

  // معالجة تغيير قيمة الحقل
  const handleChange = (field: string, value: string) => {
    // تطبيق التنسيق المناسب حسب نوع الحقل
    if (field === "phoneNumber") {
      value = formatPhoneNumber(value);
    }
    
    onTextChange(image.id, field, value);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-bold text-white mb-4 text-center">
        البيانات المستخرجة
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* الكود */}
        <div className="space-y-2">
          <Label htmlFor="code" className="text-white">
            الكود<span className="text-red-500">*</span>:
          </Label>
          <Input
            id="code"
            value={image.code || ""}
            onChange={(e) => handleChange("code", e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            placeholder="أدخل الكود"
          />
        </div>
        
        {/* اسم الشركة */}
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-white">
            اسم الشركة:
          </Label>
          <Input
            id="companyName"
            value={image.companyName || ""}
            onChange={(e) => handleChange("companyName", e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            placeholder="أدخل اسم الشركة"
          />
        </div>
        
        {/* اسم المرسل */}
        <div className="space-y-2">
          <Label htmlFor="senderName" className="text-white">
            اسم المرسل<span className="text-red-500">*</span>:
          </Label>
          <Input
            id="senderName"
            value={image.senderName || ""}
            onChange={(e) => handleChange("senderName", e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            placeholder="أدخل اسم المرسل"
          />
        </div>
        
        {/* رقم الهاتف */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className={`${hasPhoneError() ? 'text-red-500' : 'text-white'}`}>
            رقم الهاتف<span className="text-red-500">*</span>:
          </Label>
          <Input
            id="phoneNumber"
            value={image.phoneNumber || ""}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            className={`bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 
              ${hasPhoneError() ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="أدخل رقم الهاتف (11 رقم)"
          />
          {hasPhoneError() && (
            <p className="text-red-500 text-xs mt-1">
              يجب أن يكون رقم الهاتف 11 رقم بالضبط
            </p>
          )}
        </div>
        
        {/* المحافظة */}
        <div className="space-y-2">
          <Label htmlFor="province" className="text-white">
            المحافظة<span className="text-red-500">*</span>:
          </Label>
          <Input
            id="province"
            value={image.province || ""}
            onChange={(e) => handleChange("province", e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            placeholder="أدخل المحافظة"
          />
        </div>
        
        {/* السعر */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-white">
            السعر<span className="text-red-500">*</span>:
          </Label>
          <Input
            id="price"
            value={image.price || ""}
            onChange={(e) => handleChange("price", e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            placeholder="أدخل السعر"
          />
        </div>
      </div>
      
      {/* معلومات الحقول المطلوبة */}
      <p className="text-gray-400 text-xs mt-4">
        <span className="text-red-500">*</span> حقول مطلوبة
      </p>
    </div>
  );
};

export default ReceiptDataForm;
