
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import ImageList from "@/components/ImageList";
import ImageTable from "@/components/ImageTable";
import { Loader2 } from "lucide-react";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean; // إضافة خيار لعرض صور الجلسة فقط
}

const ImagePreviewContainer = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false // القيمة الافتراضية هي false
}: ImagePreviewContainerProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // تحديث حالة التحميل عند تغيير الصور
  useEffect(() => {
    if (images.length > 0) {
      // تأخير قصير للسماح بتحميل الصور
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [images]);

  const handleImageClick = async (image: ImageData) => {
    console.log("تم النقر على الصورة:", image.id);
    // لن يتم عمل أي شيء عند النقر على الصورة - تم إلغاء النافذة المنبثقة
  };

  if (isLoading && images.length > 0) {
    return (
      <div className="flex items-center justify-center w-full py-16">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">جاري تحميل الصور...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8">
      {images.length === 0 ? (
        <div className="flex items-center justify-center w-full py-16 border-2 border-dashed rounded-md border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-lg font-medium">لا توجد صور لعرضها</p>
            <p className="text-muted-foreground mt-1">قم بتحميل صور جديدة للبدء</p>
          </div>
        </div>
      ) : (
        <>
          <ImageList 
            images={images}
            isSubmitting={isSubmitting}
            onImageClick={handleImageClick}
            onTextChange={onTextChange}
            onDelete={onDelete}
            onSubmit={onSubmit}
            formatDate={formatDate}
          />

          {!showOnlySession && (
            <ImageTable 
              images={images}
              isSubmitting={isSubmitting}
              onImageClick={handleImageClick}
              onDelete={onDelete}
              onSubmit={onSubmit}
              formatDate={formatDate}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ImagePreviewContainer;
