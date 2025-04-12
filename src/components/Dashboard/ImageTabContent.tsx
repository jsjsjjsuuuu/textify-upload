
import React, { useState, useEffect } from 'react';
import { ImageData } from "@/types/ImageData";
import ImagePreviewContainer from '@/components/ImageViewer/ImagePreviewContainer';
import StatusBadges from '@/components/ImageViewer/StatusBadges';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ImageTabContentProps {
  images: ImageData[];
  isSubmitting: boolean | Record<string, boolean>;
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
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasHiddenIds, setHasHiddenIds] = useState(false);
  
  // محاولة قراءة الصور المخفية من localStorage لغرض التشخيص فقط
  useEffect(() => {
    const HIDDEN_IMAGES_STORAGE_KEY = 'hiddenImageIds';
    try {
      const storedHiddenImages = localStorage.getItem(HIDDEN_IMAGES_STORAGE_KEY);
      if (storedHiddenImages) {
        const hiddenIds = JSON.parse(storedHiddenImages);
        console.log("ImageTabContent: هناك صور مخفية:", hiddenIds.length);
        setHasHiddenIds(hiddenIds.length > 0);
      } else {
        console.log("ImageTabContent: لا توجد صور مخفية");
        setHasHiddenIds(false);
      }
    } catch (error) {
      console.error("خطأ في قراءة الصور المخفية:", error);
    }
  }, []);
  
  // حساب عدد الصور في كل تصنيف
  const imageCounts = {
    all: images.length,
    pending: images.filter(img => img.status === "pending").length,
    processing: images.filter(img => img.status === "processing").length,
    completed: images.filter(img => img.status === "completed" && img.submitted).length,
    incomplete: images.filter(img => img.status === "completed" && !img.submitted).length,
    error: images.filter(img => img.status === "error").length
  };
  
  // تصفية الصور بناءً على الفلتر المحدد
  const filteredImages = images.filter(image => {
    // تطبيق فلتر الحالة
    if (filter === "all") return true;
    if (filter === "pending") return image.status === "pending";
    if (filter === "processing") return image.status === "processing";
    if (filter === "completed") return image.status === "completed" && image.submitted;
    if (filter === "incomplete") return image.status === "completed" && !image.submitted;
    if (filter === "error") return image.status === "error";
    return true;
  }).filter(image => {
    // تطبيق البحث النصي إذا وجد
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

  // تسجيل معلومات تشخيصية
  useEffect(() => {
    console.log(`ImageTabContent: نوع isSubmitting: ${typeof isSubmitting}, عدد الصور: ${images.length}`);
  }, [isSubmitting, images]);

  return (
    <div>
      {hasHiddenIds && (
        <div className="bg-amber-50 text-amber-800 p-3 mb-4 rounded-md border border-amber-200 text-sm">
          <p className="font-semibold">ملاحظة:</p>
          <p>هناك صور مخفية. يمكنك إعادة إظهارها من الإعدادات إذا كنت تريد ذلك.</p>
        </div>
      )}
      
      {/* شريط التصفية والبحث الموحد */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* حقل البحث */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث عن كود، اسم مرسل، رقم هاتف..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* بادجات الحالة للتصفية */}
        <div className="flex-shrink-0">
          <StatusBadges 
            counts={imageCounts}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
        </div>
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
