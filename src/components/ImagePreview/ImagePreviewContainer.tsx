
import React from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { ImageViewer } from "./ImageViewer";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting?: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
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
  
  // توجيه المستخدم إلى استخدام المكون من المسار الجديد
  React.useEffect(() => {
    console.warn(
      "تحذير: مكون ImagePreviewContainer غير مستخدم بشكل مباشر، يرجى استخدام المكون من مسار src/components/ImageViewer/ImagePreviewContainer بدلاً من ذلك"
    );
  }, []);

  // إذا كانت الصور فارغة، عرض رسالة بديلة
  if (!images || images.length === 0) {
    return <div>لا توجد صور للعرض</div>;
  }

  // استخدام المكون الجديد، مع تمرير صورة واحدة فقط (الأولى)
  return (
    <ImageViewer
      image={images[0]}
      onClose={() => {}}
      hasNext={images.length > 1}
      hasPrev={false}
    />
  );
};

export default ImagePreviewContainer;
