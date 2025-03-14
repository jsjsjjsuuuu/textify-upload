
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
    
    // الحقول الجديدة المناسبة للموقع المستهدف - جعلها أكثر دقة
    customerName: image.customerName || image.senderName || "", // استخدام الاسم المخصص أو اسم المرسل
    customerPhone: image.customerPhone || cleanedPhoneNumber || "", // استخدام رقم الهاتف المخصص أو رقم الهاتف الأساسي
    totalAmount: image.totalAmount || image.price || "", // استخدام المبلغ الكلي المخصص أو السعر
    receiverName: image.receiverName || image.recipientName || "", // اسم المستلم
    area: image.area || image.region || correctedProvince || "", // المنطقة
    packageType: image.packageType || image.category || "بضائع متنوعة", // نوع البضاعة
    pieceCount: image.pieceCount || "1", // عدد القطع، الافتراضي 1
    notes1: image.notes1 || image.notes || "", // الملاحظات
    notes2: image.notes2 || "", // ملاحظات خاصة إضافية
    customerFee: image.customerFee || "", // زيادة أجرة العميل
    deliveryAgentFee: image.deliveryAgentFee || "", // زيادة أجرة المندوب
    status1: image.status1 || image.orderStatus || "قيد التنفيذ", // الحالة
    exchangeStatus: image.exchangeStatus || "لا", // استبدال (الافتراضي: لا)
    paymentStatus: image.paymentType || "نقدي", // حالة الدفع (الافتراضي: نقدي)
    deliveryDate: image.deliveryDate || "", // تاريخ التسليم
    delegateName: image.delegateName || "" // اسم المندوب
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
