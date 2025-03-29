
import React from 'react';
import { ImageData } from '@/types/ImageData';
import { Image, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageThumbnailProps {
  image: ImageData;
  isSelected: boolean;
  onClick: () => void;
}

const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  image,
  isSelected,
  onClick,
}) => {
  // إنشاء مؤشر لحالة الصورة
  const getStatusBadge = () => {
    if (image.status === 'processing') {
      return (
        <div className="absolute top-1 left-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-sm flex items-center gap-1">
          <Loader className="h-3 w-3 animate-spin" />
          <span>معالجة</span>
        </div>
      );
    }
    
    if (image.status === 'completed') {
      return (
        <div className="absolute top-1 left-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-sm">
          مكتملة
        </div>
      );
    }
    
    if (image.status === 'error') {
      return (
        <div className="absolute top-1 left-1 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-sm">
          فشل
        </div>
      );
    }
    
    return null;
  };

  return (
    <div
      className={cn(
        "relative border rounded-md overflow-hidden cursor-pointer transition-colors",
        isSelected ? "border-primary ring-1 ring-primary" : "border-muted hover:border-muted-foreground/50"
      )}
      onClick={onClick}
    >
      <div className="relative h-24 bg-muted flex items-center justify-center">
        {image.previewUrl ? (
          <img
            src={image.previewUrl}
            alt={`صورة ${image.number || ""}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              e.currentTarget.parentElement?.classList.add("flex", "items-center", "justify-center");
              const icon = document.createElement("div");
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
              e.currentTarget.parentElement?.appendChild(icon);
            }}
          />
        ) : (
          <Image className="h-8 w-8 text-muted-foreground" />
        )}
        {getStatusBadge()}
      </div>
      <div className="p-2">
        <p className="text-sm font-medium truncate">
          {image.code || image.number || "بدون رقم"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {image.senderName || (image.date ? new Date(image.date).toLocaleDateString('ar-EG') : "لا يوجد اسم")}
        </p>
      </div>
    </div>
  );
};

export default ImageThumbnail;
