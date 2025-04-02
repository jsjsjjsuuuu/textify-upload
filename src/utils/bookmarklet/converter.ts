import { ImageData, BookmarkletItem } from "@/types/ImageData";

// تحويل بيانات الصور إلى عناصر بوكماركلت
export const convertImagesToBookmarkletItems = (images: ImageData[]): BookmarkletItem[] => {
  if (!images || images.length === 0) {
    return [];
  }
  
  return images
    .filter(image => 
      image.status === "completed" && 
      image.code && 
      image.senderName && 
      image.phoneNumber
    )
    .map(image => ({
      id: image.id,
      code: image.code || "",
      senderName: image.senderName || "",
      phoneNumber: image.phoneNumber || "",
      province: image.province || "",
      price: image.price || "",
      companyName: image.companyName || "",
      notes: image.notes || "",
      recipientName: image.recipientName || "",
      exportDate: new Date().toISOString(),
      status: "ready"
    }));
};
