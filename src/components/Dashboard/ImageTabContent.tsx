
import React, { useState } from 'react';
import { ImageData } from "@/types/ImageData";
import ImagePreviewContainer from '@/components/ImagePreviewContainer';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { StatusBadges } from '@/components/ImageViewer/StatusBadges';

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
  const [activeFilter, setActiveFilter] = useState("all");
  
  // حساب عدد العناصر لكل تصنيف
  const imageStats = images.reduce((stats, image) => {
    stats.all += 1;
    
    if (!image.code || !image.senderName || !image.phoneNumber || !image.province || !image.price) {
      stats.incomplete += 1;
    }
    
    if (image.status === 'pending') {
      stats.pending += 1;
    } else if (image.status === 'processing') {
      stats.processing += 1;
    } else if (image.status === 'completed') {
      stats.completed += 1;
    }
    
    if (image.error) {
      stats.error += 1;
    }
    
    return stats;
  }, { all: 0, pending: 0, processing: 0, completed: 0, incomplete: 0, error: 0 });

  // فلترة الصور بناءً على مصطلح البحث والفلتر النشط
  const filteredImages = images.filter(image => {
    // فلتر البحث النصي
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (image.code && image.code.toLowerCase().includes(term)) ||
        (image.senderName && image.senderName.toLowerCase().includes(term)) ||
        (image.phoneNumber && image.phoneNumber.toLowerCase().includes(term)) ||
        (image.province && image.province.toLowerCase().includes(term));
        
      if (!matchesSearch) return false;
    }
    
    // فلتر الحالة
    if (activeFilter === "all") return true;
    if (activeFilter === "pending" && image.status === "pending") return true;
    if (activeFilter === "processing" && image.status === "processing") return true;
    if (activeFilter === "completed" && image.status === "completed") return true;
    if (activeFilter === "incomplete" && (!image.code || !image.senderName || !image.phoneNumber || !image.province || !image.price)) return true;
    if (activeFilter === "error" && image.error) return true;
    
    return false;
  });

  return (
    <div className="space-y-8"> {/* زيادة المسافة بين العناصر الرئيسية */}
      <div className="space-y-6"> {/* زيادة المسافة بين عناصر التحكم */}
        {/* شريط الفلاتر المدمج مع العدادات */}
        <StatusBadges 
          counts={imageStats} 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        
        {/* شريط البحث */}
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث عن كود، اسم مرسل، رقم هاتف..."
            className="pl-12 pr-4 py-3 text-lg" /* زيادة حجم حقل البحث */
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* عرض الصور المصفاة مع مسافات أكبر */}
      <div className="pt-4"> {/* إضافة مسافة قبل عرض الصور */}
        <ImagePreviewContainer
          images={filteredImages}
          isSubmitting={isSubmitting}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default ImageTabContent;
