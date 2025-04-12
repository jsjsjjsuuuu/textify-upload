
import React from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting?: boolean | Record<string, boolean>;  // تحديث النوع ليشمل Record<string, boolean>
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;  // تحديث النوع إلى Promise<boolean>
  onSubmit: (id: string) => Promise<boolean>;  // تحديث النوع إلى Promise<boolean>
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
}

const ImagePreviewContainer = ({
  images,
  isSubmitting = false,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false
}: ImagePreviewContainerProps) => {
  const { toast } = useToast();
  
  // توجيه المستخدم إلى استخدام المكون من المسار الجديد
  React.useEffect(() => {
    console.warn(
      "تحذير: مكون ImagePreviewContainer غير مستخدم بشكل مباشر، يرجى استخدام المكون من مسار src/components/ImageViewer/ImagePreviewContainer بدلاً من ذلك"
    );
  }, []);

  // إنشاء دوال وسيطة لتحويل النوع من void إلى Promise<boolean>
  const handleDelete = async (id: string) => {
    try {
      onDelete(id);
      return true;
    } catch (error) {
      console.error("خطأ عند حذف الصورة:", error);
      return false;
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      onSubmit(id);
      return true;
    } catch (error) {
      console.error("خطأ عند إرسال الصورة:", error);
      return false;
    }
  };

  // إرجاع المكون الرئيسي من المسار الصحيح
  const ViewerContainer = React.lazy(() => import("../ImageViewer/ImagePreviewContainer"));
  
  return (
    <React.Suspense fallback={<div>جاري التحميل...</div>}>
      <ViewerContainer 
        images={images}
        isSubmitting={isSubmitting}
        onTextChange={onTextChange}
        onDelete={handleDelete}  // استخدام الدالة الوسيطة
        onSubmit={handleSubmit}  // استخدام الدالة الوسيطة
        formatDate={formatDate}
        showOnlySession={showOnlySession}
      />
    </React.Suspense>
  );
};

export default ImagePreviewContainer;
