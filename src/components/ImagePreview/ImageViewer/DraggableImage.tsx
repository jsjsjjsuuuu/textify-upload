
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ImageData } from "@/types/ImageData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader, AlertTriangle, Search, RotateCcw, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DraggableImageProps {
  image: ImageData;
  onImageClick?: (image: ImageData) => void;
  formatDate: (date: Date) => string;
  onRetryLoad?: (imageId: string) => void;
  onDelete?: (imageId: string) => Promise<boolean>;
}

const DraggableImage: React.FC<DraggableImageProps> = ({
  image,
  onImageClick,
  formatDate,
  onRetryLoad,
  onDelete
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const { toast } = useToast();

  // التعامل مع تحميل الصورة
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // التعامل مع خطأ تحميل الصورة
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // إعادة تحميل الصورة
  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRetryLoad && image.id) {
      setIsLoading(true);
      setHasError(false);
      onRetryLoad(image.id);
    }
  };

  // تكبير/تصغير الصورة
  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  // حذف الصورة
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      try {
        const success = await onDelete(image.id);
        if (success) {
          toast({
            title: "تم الحذف بنجاح",
            description: "تم حذف الصورة بنجاح",
          });
        }
      } catch (error) {
        console.error("خطأ في حذف الصورة:", error);
        toast({
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء محاولة حذف الصورة",
          variant: "destructive",
        });
      }
    }
  };

  // تنسيق حالة الصورة
  const getStatusDetails = () => {
    switch (image.status) {
      case "pending":
        return {
          label: "قيد الانتظار",
          color: "bg-amber-500",
          textColor: "text-white",
        };
      case "processing":
        return {
          label: "قيد المعالجة",
          color: "bg-blue-500",
          textColor: "text-white",
        };
      case "completed":
        return {
          label: "مكتملة",
          color: "bg-green-500",
          textColor: "text-white",
        };
      case "error":
        return {
          label: "خطأ",
          color: "bg-red-500",
          textColor: "text-white",
        };
      default:
        return {
          label: "غير معروفة",
          color: "bg-gray-500",
          textColor: "text-white",
        };
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
      onClick={() => onImageClick && onImageClick(image)}
    >
      {/* شريط الحالة */}
      <div
        className={`absolute top-0 left-0 w-full px-3 py-1 ${statusDetails.color} ${statusDetails.textColor} text-xs font-medium flex justify-between items-center z-10`}
      >
        <span>{statusDetails.label}</span>
        <span>{image.date ? formatDate(new Date(image.date)) : ""}</span>
      </div>

      {/* حاوية الصورة */}
      <div className="w-full aspect-square relative flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {/* الصورة */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Loader className="h-10 w-10 text-gray-400 animate-spin" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-red-500 text-sm text-center">
              فشل في تحميل الصورة
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleRetry}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              إعادة المحاولة
            </Button>
          </div>
        )}

        {image.previewUrl && (
          <motion.img
            src={image.previewUrl}
            alt={`صورة ${image.id}`}
            className={cn(
              "object-contain w-full h-full transition-all duration-300",
              isZoomed ? "scale-150" : "scale-100",
              isLoading || hasError ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={(e) => {
              e.stopPropagation();
              if (onImageClick) onImageClick(image);
            }}
            layout="position"
            layoutId={`image-${image.id}`}
          />
        )}

        {/* أزرار الإجراءات */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm h-8 w-8"
            onClick={toggleZoom}
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={handleDelete}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* معلومات الصورة */}
      <div className="p-3">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>رقم: {image.number || "-"}</span>
          <span dir="ltr">{image.id?.substring(0, 8) || "-"}</span>
        </div>
      </div>
    </div>
  );
};

export default DraggableImage;
