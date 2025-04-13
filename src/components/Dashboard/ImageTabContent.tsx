
import React, { useState } from 'react';
import { ImageData } from "@/types/ImageData";
import ImagePreviewContainer from '@/components/ImagePreviewContainer';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ImageTabContentProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => Promise<boolean>;
  formatDate: (date: Date) => string;
}

const ImageTabContent: React.FC<ImageTabContentProps> = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // فلترة الصور بناءً على مصطلح البحث فقط (نقلنا منطق الفلترة إلى ImagePreviewContainer)
  const filteredImages = images.filter(image => {
    if (!searchTerm) return true;
    
    // البحث في جميع الحقول النصية
    const term = searchTerm.toLowerCase();
    return (
      (image.code && image.code.toLowerCase().includes(term)) ||
      (image.senderName && image.senderName.toLowerCase().includes(term)) ||
      (image.phoneNumber && image.phoneNumber.toLowerCase().includes(term)) ||
      (image.province && image.province.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      {/* شريط البحث فقط - تمت إزالة الفلاتر من هنا لأنها ستكون في ImagePreviewContainer */}
      <div className="relative flex-grow mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث عن كود، اسم مرسل، رقم هاتف..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* عرض الصور المصفاة */}
      <ImagePreviewContainer
        images={filteredImages}
        isSubmitting={isSubmitting}
        onTextChange={onTextChange}
        onDelete={onDelete}
        onSubmit={onSubmit}
        formatDate={formatDate}
      />
    </div>
  );
};

export default ImageTabContent;
