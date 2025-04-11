
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageData } from "@/types/ImageData";
import ImageTabContent from './ImageTabContent';

interface ImageTabsProps {
  images: ImageData[];
  isSubmitting: Record<string, boolean>;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => Promise<boolean>;
  formatDate: (date: Date) => string;
  imageStats: {
    all: number;
    pending: number;
    processing: number;
    completed: number;
    incomplete: number;
    error: number;
  };
}

// دالة للتحقق من اكتمال الصورة
const isImageComplete = (image: ImageData): boolean => {
  return !!(
    image.code && 
    image.senderName && 
    image.province && 
    image.price
  );
};

// دالة للتحقق من وجود خطأ في رقم الهاتف
const hasPhoneError = (image: ImageData): boolean => {
  return !!image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, "").length !== 11;
};

const ImageTabs: React.FC<ImageTabsProps> = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  imageStats
}) => {
  return (
    <Tabs defaultValue="all" className="w-full" dir="rtl">
      <TabsList className="mb-4 w-full justify-start">
        <TabsTrigger value="all">الكل</TabsTrigger>
        <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
        <TabsTrigger value="completed">مكتملة</TabsTrigger>
        <TabsTrigger value="incomplete">غير مكتملة</TabsTrigger>
        <TabsTrigger value="error">أخطاء</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="mt-0">
        <ImageTabContent
          images={images}
          isSubmitting={Object.values(isSubmitting).some(Boolean)}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />
      </TabsContent>
      
      <TabsContent value="pending" className="mt-0">
        <ImageTabContent
          images={images.filter(img => img.status === "pending")}
          isSubmitting={Object.values(isSubmitting).some(Boolean)}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />
      </TabsContent>
      
      <TabsContent value="completed" className="mt-0">
        <ImageTabContent
          images={images.filter(img => img.status === "completed" && isImageComplete(img))}
          isSubmitting={Object.values(isSubmitting).some(Boolean)}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />
      </TabsContent>
      
      <TabsContent value="incomplete" className="mt-0">
        <ImageTabContent
          images={images.filter(img => img.status === "completed" && !isImageComplete(img) && !hasPhoneError(img))}
          isSubmitting={Object.values(isSubmitting).some(Boolean)}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />
      </TabsContent>
      
      <TabsContent value="error" className="mt-0">
        <ImageTabContent
          images={images.filter(img => img.status === "error" || hasPhoneError(img))}
          isSubmitting={Object.values(isSubmitting).some(Boolean)}
          onTextChange={onTextChange}
          onDelete={onDelete}
          onSubmit={onSubmit}
          formatDate={formatDate}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ImageTabs;
