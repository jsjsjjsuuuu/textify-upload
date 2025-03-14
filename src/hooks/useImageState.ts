
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";

export const useImageState = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const { toast } = useToast();

  const addImage = (newImage: ImageData) => {
    setImages(prev => [newImage, ...prev]);
  };

  const updateImage = (id: string, updatedFields: Partial<ImageData>) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updatedFields } : img
    ));
  };

  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الصورة بنجاح"
    });
  };

  const handleTextChange = (id: string, field: string, value: string) => {
    console.log(`Updating ${field} to "${value}" for image ${id}`);
    updateImage(id, { [field]: value } as any);
  };

  // Get sorted images
  const getSortedImages = () => {
    return [...images].sort((a, b) => {
      const aNum = a.number || 0;
      const bNum = b.number || 0;
      return bNum - aNum;
    });
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, [images]);

  return {
    images: getSortedImages(),
    addImage,
    updateImage,
    deleteImage,
    handleTextChange
  };
};
