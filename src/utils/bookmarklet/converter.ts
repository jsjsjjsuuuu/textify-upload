
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

  // تنسيق السعر: إزالة أي فواصل موجودة ثم إعادة تنسيقه
  const formattedPrice = image.price ? 
    image.price.replace(/[,\s]/g, '') : "";
  
  // تحويل أي قيمة null أو undefined إلى سلسلة فارغة
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  // بناء كائن BookmarkletItem مع مراعاة الحقول الجديدة
  const item: BookmarkletItem = {
    id: image.id,
    code: safeString(image.code),
    senderName: safeString(image.senderName),
    phoneNumber: cleanedPhoneNumber,
    province: correctedProvince,
    price: formattedPrice,
    companyName: safeString(image.companyName),
    exportDate: new Date().toISOString(),
    status: "ready",
    
    // الحقول الإضافية الأساسية
    address: safeString(image.address),
    notes: safeString(image.notes),
    recipientName: safeString(image.recipientName),
    customerCode: safeString(image.customerCode),
    region: safeString(image.region),
    
    // الحقول الجديدة المناسبة للموقع المستهدف - جعلها أكثر دقة
    customerName: safeString(image.customerName || image.senderName), // استخدام الاسم المخصص أو اسم المرسل
    customerPhone: safeString(image.customerPhone || cleanedPhoneNumber), // استخدام رقم الهاتف المخصص أو رقم الهاتف الأساسي
    totalAmount: safeString(image.totalAmount || formattedPrice), // استخدام المبلغ الكلي المخصص أو السعر
    receiverName: safeString(image.receiverName || image.recipientName), // اسم المستلم
    area: safeString(image.area || image.region || correctedProvince), // المنطقة
    packageType: safeString(image.packageType || image.category || "بضائع متنوعة"), // نوع البضاعة
    pieceCount: safeString(image.pieceCount || "1"), // عدد القطع، الافتراضي 1
    notes1: safeString(image.notes1 || image.notes), // الملاحظات
    notes2: safeString(image.notes2), // ملاحظات خاصة إضافية
    customerFee: safeString(image.customerFee || "0"), // زيادة أجرة العميل
    deliveryAgentFee: safeString(image.deliveryAgentFee || "0"), // زيادة أجرة المندوب
    status1: safeString(image.status1 || image.orderStatus || "قيد التنفيذ"), // الحالة
    exchangeStatus: safeString(image.exchangeStatus || "لا"), // استبدال (الافتراضي: لا)
    paymentStatus: safeString(image.paymentType || "نقدي"), // حالة الدفع (الافتراضي: نقدي)
    deliveryDate: safeString(image.deliveryDate), // تاريخ التسليم
    delegateName: safeString(image.delegateName), // اسم المندوب
    
    // إضافة حقول التتبع والتصحيح
    fieldsFilled: 0,
    fieldsAttempted: 0,
    errorFields: [],
    successFields: [],
    fillAttemptDate: new Date().toISOString(),
    debugInfo: "تم إنشاء العنصر بتاريخ: " + new Date().toLocaleString()
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

/**
 * تحضير البيانات للاستخدام في مواقع مختلفة
 * هذه الدالة تنسق البيانات بطريقة تناسب مواقع مختلفة
 */
export const prepareItemForSiteInput = (item: BookmarkletItem): Record<string, string> => {
  // إعداد كائن بالقيم المنسقة المناسبة للإدخال
  const inputReady: Record<string, string> = {
    // البيانات الأساسية
    code: item.code || "",
    customerName: item.customerName || item.senderName || "", 
    customerPhone: item.customerPhone || item.phoneNumber || "",
    totalAmount: item.totalAmount || item.price || "",
    receiverName: item.receiverName || item.recipientName || "",
    area: item.area || item.province || "",
    packageType: item.packageType || "بضائع متنوعة",
    pieceCount: item.pieceCount || "1",
    
    // تنسيق الأسعار: إزالة الفواصل والمسافات لتجنب مشاكل الإدخال
    price: (item.price || "").replace(/[,\s]/g, ''),
    customerFee: (item.customerFee || "0").replace(/[,\s]/g, ''),
    deliveryAgentFee: (item.deliveryAgentFee || "0").replace(/[,\s]/g, ''),
    
    // البيانات الإضافية
    notes: item.notes || item.notes1 || "",
    notes1: item.notes1 || "",
    notes2: item.notes2 || "",
    status1: item.status1 || "قيد التنفيذ",
    exchangeStatus: item.exchangeStatus || "لا",
    paymentStatus: item.paymentStatus || "نقدي",
    deliveryDate: item.deliveryDate || "",
    delegateName: item.delegateName || "",
    address: item.address || ""
  };
  
  // تأكد من تنسيق رقم الهاتف بشكل صحيح (إزالة أحرف غير رقمية)
  if (inputReady.customerPhone) {
    // الاحتفاظ بالبادئة + إذا وجدت، ثم الأرقام فقط
    inputReady.customerPhone = inputReady.customerPhone.replace(/[^\d+]/g, '');
    
    // التأكد من أن رقم الهاتف العراقي يبدأ بـ 07
    if (inputReady.customerPhone.startsWith('7') && inputReady.customerPhone.length === 10) {
      inputReady.customerPhone = '0' + inputReady.customerPhone;
    }
  }
  
  // تنظيف الأسعار من أي أحرف غير رقمية
  ['price', 'totalAmount', 'customerFee', 'deliveryAgentFee'].forEach(key => {
    if (inputReady[key]) {
      // إزالة جميع الأحرف غير الرقمية باستثناء النقطة
      inputReady[key] = inputReady[key].replace(/[^\d.]/g, '');
    }
  });
  
  // إضافة تسميات بديلة لزيادة فرص العثور على الحقول المناسبة
  const aliases: Record<string, string> = {
    // أسماء بديلة للحقول
    sender: inputReady.customerName,
    sender_name: inputReady.customerName,
    customer: inputReady.customerName,
    client: inputReady.customerName,
    
    phone: inputReady.customerPhone,
    mobile: inputReady.customerPhone,
    sender_phone: inputReady.customerPhone,
    
    receiver: inputReady.receiverName,
    recipient: inputReady.receiverName,
    destination_name: inputReady.receiverName,
    
    province: inputReady.area,
    city: inputReady.area,
    governorate: inputReady.area,
    
    amount: inputReady.totalAmount,
    total: inputReady.totalAmount,
    
    parcel_type: inputReady.packageType,
    goods_type: inputReady.packageType,
    
    pieces: inputReady.pieceCount,
    count: inputReady.pieceCount,
    quantity: inputReady.pieceCount,
    
    comment: inputReady.notes,
    description: inputReady.notes
  };
  
  // دمج الأسماء البديلة مع القيم الأصلية
  return { ...inputReady, ...aliases };
};
