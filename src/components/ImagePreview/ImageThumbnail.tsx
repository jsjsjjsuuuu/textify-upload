
import React from "react";
import { ImageData } from "@/types/ImageData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FileImage, AlertTriangle, Check, Clock } from "lucide-react";

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
  // تحديد الحالة للعرض في الواجهة
  const getStatusIndicator = () => {
    switch (image.status) {
      case "completed":
        return (
          <div className="absolute top-1 left-1 rounded-full bg-green-100 p-0.5 dark:bg-green-900">
            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
        );
      case "error":
        return (
          <div className="absolute top-1 left-1 rounded-full bg-red-100 p-0.5 dark:bg-red-900">
            <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
          </div>
        );
      case "processing":
        return (
          <div className="absolute top-1 left-1 rounded-full bg-blue-100 p-0.5 dark:bg-blue-900">
            <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
        );
      default:
        return (
          <div className="absolute top-1 left-1 rounded-full bg-amber-100 p-0.5 dark:bg-amber-900">
            <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-md cursor-pointer transition-all duration-200 border-2",
        isSelected
          ? "border-primary dark:border-primary shadow-md"
          : "border-transparent dark:border-transparent hover:border-muted-foreground/20 dark:hover:border-muted-foreground/20"
      )}
      onClick={onClick}
    >
      {getStatusIndicator()}
      
      {image.previewUrl ? (
        <img
          src={image.previewUrl}
          alt={`صورة ${image.number || ""}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            // في حالة فشل تحميل الصورة، نستبدلها بأيقونة
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              const placeholder = document.createElement("div");
              placeholder.className = "flex h-full w-full items-center justify-center bg-muted";
              placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground opacity-50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
              parent.appendChild(placeholder);
            }
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <FileImage className="h-6 w-6 text-muted-foreground opacity-50" />
        </div>
      )}
      
      <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
        <p className="text-xs text-white truncate">
          {image.code || image.senderName || `صورة ${image.number || ""}`}
        </p>
      </div>
    </div>
  );
};

export default ImageThumbnail;
