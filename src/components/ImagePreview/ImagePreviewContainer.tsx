
import React from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting?: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => Promise<boolean>;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
  onRetry?: (imageId: string) => void;
}

const ImagePreviewContainer = ({
  images,
  isSubmitting = false,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false,
  onRetry
}: ImagePreviewContainerProps) => {
  const { toast } = useToast();
  
  // إنشاء دالة لاستدعاء الحذف بشكل متوافق مع التوقيع المتوقع
  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      return await onDelete(id);
    } catch (error) {
      console.error("خطأ في حذف الصورة:", error);
      toast({
        title: "خطأ في الحذف",
        description: "فشلت عملية حذف الصورة"
      });
      return false;
    }
  };

  // إنشاء دالة لاستدعاء الإرسال بشكل متوافق مع التوقيع المتوقع
  const handleSubmit = async (id: string): Promise<boolean> => {
    try {
      return await onSubmit(id);
    } catch (error) {
      console.error("خطأ في إرسال الصورة:", error);
      toast({
        title: "خطأ في الإرسال",
        description: "فشلت عملية إرسال الصورة"
      });
      return false;
    }
  };

  // توجيه المستخدم إلى استخدام المكون من المسار الجديد
  React.useEffect(() => {
    console.warn(
      "تحذير: مكون ImagePreviewContainer غير مستخدم بشكل مباشر، يرجى استخدام المكون من مسار src/components/ImageViewer/ImagePreviewContainer بدلاً من ذلك"
    );
  }, []);

  // إرجاع المكون الرئيسي من المسار الصحيح
  const ViewerContainer = React.lazy(() => import("../ImageViewer/ImagePreviewContainer"));
  
  return (
    <React.Suspense fallback={<div>جاري التحميل...</div>}>
      <ViewerContainer 
        images={images}
        isSubmitting={isSubmitting}
        onTextChange={onTextChange}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
        formatDate={formatDate}
        showOnlySession={showOnlySession}
        onRetry={onRetry}
      />
    </React.Suspense>
  );
};

export default ImagePreviewContainer;
