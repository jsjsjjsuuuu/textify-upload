
import { ImageData } from "@/types/ImageData";

interface ImageMetadataProps {
  image: ImageData;
  formatDate: (date: Date) => string;
  hasError?: boolean;
}

const ImageMetadata = ({ image, formatDate, hasError = false }: ImageMetadataProps) => {
  // في حالة وجود خطأ، لا نعرض بيانات وصفية للصورة
  if (hasError) {
    return null;
  }

  return (
    <>
      <div className="text-xs text-muted-foreground mt-1 text-center">
        {formatDate(image.date)}
      </div>
      
      {image.confidence !== undefined && (
        <div className="mt-1 text-center">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            دقة الاستخراج: {Math.round(image.confidence)}%
          </span>
        </div>
      )}
    </>
  );
};

export default ImageMetadata;
