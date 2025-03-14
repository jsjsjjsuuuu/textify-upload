
import { ImageData } from "@/types/ImageData";
import { BookmarkletItem } from "./types";
import { correctProvinceName } from "@/utils/provinces";

/**
 * تحويل بيانات الصورة إلى تنسيق يمكن استخدامه بواسطة Bookmarklet
 */
export const convertImageToBookmarkletItem = (image: ImageData): BookmarkletItem | null => {
  // التحقق من توفر البيانات الأساسية المطلوبة
  if (!image.code || !image.senderName || !image.phoneNumber || !image.province) {
    return null;
  }

  // تصحيح اسم المحافظة قبل التخزين
  const correctedProvince = correctProvinceName(image.province);

  // تنظيف رقم الهاتف من أي أحرف غير رقمية
  const cleanedPhoneNumber = image.phoneNumber.replace(/[^\d+]/g, '');

  return {
    id: image.id,
    code: image.code || "",
    senderName: image.senderName || "",
    phoneNumber: cleanedPhoneNumber || "",
    province: correctedProvince || "",
    price: image.price || "",
    companyName: image.companyName || "",
    exportDate: new Date().toISOString(),
    status: "ready",
    // إضافة حقول إضافية إذا كانت متاحة
    address: image.address || "",
    notes: image.notes || "",
    recipientName: image.recipientName || ""
  };
};

/**
 * تحويل مصفوفة من بيانات الصور إلى عناصر Bookmarklet
 */
export const convertImagesToBookmarkletItems = (images: ImageData[]): BookmarkletItem[] => {
  return images
    .filter(img => img.status === "completed" && img.code && img.senderName && img.phoneNumber)
    .map(img => convertImageToBookmarkletItem(img))
    .filter((item): item is BookmarkletItem => item !== null);
};
