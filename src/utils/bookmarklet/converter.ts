
import { ImageData } from "@/types/ImageData";
import { BookmarkletItem } from "./types";

/**
 * تحويل بيانات الصورة إلى تنسيق يمكن استخدامه بواسطة Bookmarklet
 */
export const convertImageToBookmarkletItem = (image: ImageData): BookmarkletItem | null => {
  // التحقق من توفر البيانات الأساسية المطلوبة
  if (!image.code || !image.senderName || !image.phoneNumber || !image.province) {
    return null;
  }

  return {
    id: image.id,
    code: image.code || "",
    senderName: image.senderName || "",
    phoneNumber: image.phoneNumber || "",
    province: image.province || "",
    price: image.price || "",
    companyName: image.companyName || "",
    exportDate: new Date().toISOString(),
    status: "ready"
  };
};
