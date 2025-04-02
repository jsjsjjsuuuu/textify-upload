
import React from "react";
import { ImageData } from "@/types/ImageData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageDataFormProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ImageDataForm: React.FC<ImageDataFormProps> = ({ image, onTextChange }) => {
  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onTextChange(image.id, field, e.target.value);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`code-${image.id}`}>الكود</Label>
        <Input
          id={`code-${image.id}`}
          value={image.code || ""}
          onChange={handleChange("code")}
          placeholder="أدخل الكود"
          disabled={image.status === "processing"}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`senderName-${image.id}`}>اسم المرسل</Label>
        <Input
          id={`senderName-${image.id}`}
          value={image.senderName || ""}
          onChange={handleChange("senderName")}
          placeholder="أدخل اسم المرسل"
          disabled={image.status === "processing"}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`phoneNumber-${image.id}`}>رقم الهاتف</Label>
        <Input
          id={`phoneNumber-${image.id}`}
          value={image.phoneNumber || ""}
          onChange={handleChange("phoneNumber")}
          placeholder="أدخل رقم الهاتف"
          disabled={image.status === "processing"}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`province-${image.id}`}>المحافظة</Label>
        <Input
          id={`province-${image.id}`}
          value={image.province || ""}
          onChange={handleChange("province")}
          placeholder="أدخل المحافظة"
          disabled={image.status === "processing"}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`price-${image.id}`}>السعر</Label>
        <Input
          id={`price-${image.id}`}
          value={image.price || ""}
          onChange={handleChange("price")}
          placeholder="أدخل السعر"
          disabled={image.status === "processing"}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`companyName-${image.id}`}>اسم الشركة</Label>
        <Input
          id={`companyName-${image.id}`}
          value={image.companyName || ""}
          onChange={handleChange("companyName")}
          placeholder="أدخل اسم الشركة"
          disabled={image.status === "processing"}
        />
      </div>
    </div>
  );
};

export default ImageDataForm;
