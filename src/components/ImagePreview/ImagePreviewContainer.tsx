
import React from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting?: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
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

  // إرجاع المكون الرئيسي من المسار الصحيح
  const ViewerContainer = React.lazy(() => import("../ImageViewer/ImagePreviewContainer"));
  
  return (
    <React.Suspense fallback={<div>جاري التحميل...</div>}>
      <ViewerContainer 
        images={images}
        isSubmitting={isSubmitting}
        onTextChange={onTextChange}
        onDelete={onDelete}
        onSubmit={onSubmit}
        formatDate={formatDate}
        showOnlySession={showOnlySession}
      />
    </React.Suspense>
  );
};

export default ImagePreviewContainer;
