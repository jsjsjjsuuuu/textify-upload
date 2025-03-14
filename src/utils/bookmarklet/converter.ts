
import { ImageData } from "@/types/ImageData";
import { BookmarkletItem } from "./types";
import { correctProvinceName } from "@/utils/provinces";

/**
 * تحويل بيانات الصورة إلى تنسيق يمكن استخدامه بواسطة Bookmarklet
 */
export const convertImageToBookmarkletItem = (image: ImageData): BookmarkletItem | null => {
  // طباعة بيانات الصورة للتشخيص
  console.log("تحويل الصورة إلى عنصر Bookmarklet:", image);

  // التحقق من توفر البيانات الأساسية المطلوبة
  if (!image.code || !image.senderName || !image.phoneNumber) {
    console.warn("صورة غير كاملة:", image.id, "تنقصها البيانات الأساسية");
    return null;
  }

  // تصحيح اسم المحافظة قبل التخزين
  const correctedProvince = image.province ? correctProvinceName(image.province) : "";

  // تنظيف رقم الهاتف من أي أحرف غير رقمية
  const cleanedPhoneNumber = image.phoneNumber.replace(/[^\d+]/g, '');

  // بناء كائن BookmarkletItem مع مراعاة الحقول الجديدة
  const item: BookmarkletItem = {
    id: image.id,
    code: image.code || "",
    senderName: image.senderName || "",
    phoneNumber: cleanedPhoneNumber || "",
    province: correctedProvince || "",
    price: image.price || "",
    companyName: image.companyName || "",
    exportDate: new Date().toISOString(),
    status: "ready",
    
    // الحقول الإضافية الأساسية
    address: image.address || "",
    notes: image.notes || "",
    recipientName: image.recipientName || "",
    customerCode: image.customerCode || "",
    region: image.region || "",
    
    // الحقول الجديدة المناسبة للموقع
    customerName: image.recipientName || image.senderName || "", // استخدام اسم المستلم أو المرسل كاسم للعميل
    customerPhone: cleanedPhoneNumber || "", // استخدام نفس رقم الهاتف المنظف
    totalAmount: image.price || "", // استخدام حقل السعر كمبلغ كلي
    receiverName: image.recipientName || "", // اسم المستلم
    area: image.province || "", // استخدام المحافظة كمنطقة
    packageType: image.category || "بضائع متنوعة", // نوع البضاعة
    pieceCount: image.packageCount || "1", // عدد القطع، الافتراضي 1
    notes1: image.notes || "", // الملاحظات
    notes2: image.notes ? "انظر الملاحظات الأساسية" : "", // ملاحظات خاصة إضافية
  };

  console.log("تم تحويل الصورة بنجاح:", item);
  return item;
};

/**
 * تحويل مصفوفة من بيانات الصور إلى عناصر Bookmarklet
 */
export const convertImagesToBookmarkletItems = (images: ImageData[]): BookmarkletItem[] => {
  console.log("تحويل مجموعة صور:", images.length, "صورة");
  console.log("حالات الصور:", images.map(img => ({ id: img.id, status: img.status })));

  // نقبل أي صورة مكتملة للحد الأدنى من البيانات
  const filteredImages = images.filter(img => 
    img.code && img.senderName && img.phoneNumber
  );

  console.log("عدد الصور المؤهلة بعد التصفية:", filteredImages.length);

  const result = filteredImages
    .map(img => convertImageToBookmarkletItem(img))
    .filter((item): item is BookmarkletItem => item !== null);

  console.log("عدد العناصر بعد التحويل:", result.length);
  return result;
};
