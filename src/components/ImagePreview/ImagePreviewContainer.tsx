import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MobileImagePreview } from "./MobileImagePreview";
import DesktopImagePreview from "./DesktopImagePreview";
import ImageEmptyState from "./ImageEmptyState";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting?: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean> | void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
  onReprocess?: (id: string) => Promise<void>;
}

const ImagePreviewContainer: React.FC<ImagePreviewContainerProps> = ({
  images,
  isSubmitting = false,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false,
  onReprocess
}) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isReprocessing, setIsReprocessing] = useState<boolean>(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // إذا كانت هناك صور جديدة، اختر أحدث صورة تلقائياً
  useEffect(() => {
    if (images.length > 0 && (!selectedImageId || !images.some(img => img.id === selectedImageId))) {
      setSelectedImageId(images[0].id);
    }
  }, [images, selectedImageId]);

  // عند وصول صورة جديدة مكتملة المعالجة، اختارها تلقائياً
  useEffect(() => {
    const lastCompletedImage = images.find(img => img.status === "completed");
    if (lastCompletedImage && selectedImageId !== lastCompletedImage.id) {
      setSelectedImageId(lastCompletedImage.id);
    }
  }, [images, selectedImageId]);

  const handleSelectImage = useCallback((id: string) => {
    setSelectedImageId(id);
  }, []);

  // تعديل الدالة لتتناسب مع نوع البيانات المتوقع
  const handleDelete = useCallback(
    async (id: string) => {
      const result = await onDelete(id);
      if (result !== false && id === selectedImageId) {
        // إذا تم حذف الصورة المحددة، اختر صورة أخرى
        if (images.length > 1) {
          const index = images.findIndex((img) => img.id === id);
          const nextIndex = index > 0 ? index - 1 : 0;
          const nextImage = images.filter((img) => img.id !== id)[nextIndex];
          if (nextImage) {
            setSelectedImageId(nextImage.id);
          } else {
            setSelectedImageId(null);
          }
        } else {
          setSelectedImageId(null);
        }
      }
      return true; // إضافة قيمة إرجاع boolean للتوافق مع النوع المطلوب
    },
    [images, onDelete, selectedImageId]
  );

  // تعديل دالة إعادة المعالجة لتتناسب مع نوع البيانات المتوقع
  const handleReprocessImage = useCallback(async (id: string) => {
    if (!onReprocess) return true; // إرجاع true عند عدم وجود دالة إعادة معالجة
    
    setIsReprocessing(true);
    try {
      await onReprocess(id);
      // تحديث حالة الصورة بعد إعادة المعالجة بنجاح
    } catch (error) {
      console.error("فشل في إعادة معالجة الصورة:", error);
      // معالجة الخطأ هنا
    } finally {
      setIsReprocessing(false);
    }
    return true; // إرجاع true عند النجاح
  }, [onReprocess]);

  // الصورة المحددة حالياً
  const selectedImage = useMemo(() => {
    return images.find((img) => img.id === selectedImageId) || null;
  }, [images, selectedImageId]);

  // زر إعادة المعالجة - يظهر فقط للصور المكتملة أو التي بها خطأ
  const reprocessButton = useMemo(() => {
    if (!onReprocess || !selectedImage || selectedImage.status === "processing" || selectedImage.status === "pending") {
      return null;
    }
    
    return (
      <Button 
        variant="outline"
        size="sm"
        onClick={() => handleReprocessImage(selectedImage.id)}
        disabled={isReprocessing}
        className="mr-2"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isReprocessing ? 'animate-spin' : ''}`} />
        إعادة المعالجة
      </Button>
    );
  }, [selectedImage, onReprocess, handleReprocessImage, isReprocessing]);

  // عرض حالة فارغة إذا لم تكن هناك صور
  if (images.length === 0) {
    return <ImageEmptyState />;
  }

  // عرض المكون المناسب حسب حجم الشاشة
  if (isMobile) {
    return (
      <MobileImagePreview
        images={images}
        selectedImageId={selectedImageId}
        onSelectImage={handleSelectImage}
        onTextChange={onTextChange}
        onDelete={handleDelete}
        onSubmit={onSubmit}
        formatDate={formatDate}
        isSubmitting={isSubmitting}
        showOnlySession={showOnlySession}
        reprocessButton={reprocessButton}
      />
    );
  }

  return (
    <DesktopImagePreview
      images={images}
      selectedImageId={selectedImageId}
      onSelectImage={handleSelectImage}
      onTextChange={onTextChange}
      onDelete={handleDelete}
      onSubmit={onSubmit}
      formatDate={formatDate}
      isSubmitting={isSubmitting}
      showOnlySession={showOnlySession}
      reprocessButton={reprocessButton}
    />
  );
};

export default ImagePreviewContainer;
