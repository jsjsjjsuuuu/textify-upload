
import { BookmarkletItem } from "@/types/ImageData";

/**
 * وظائف ملء النموذج المحسن
 */
export const fillForm = (data: BookmarkletItem) => {
  // ملء الحقول بناءً على البيانات المستخرجة
  if (data.code) {
    const codeField = document.querySelector("#code");
    if (codeField) {
      (codeField as HTMLInputElement).value = data.code;
    }
  }

  if (data.senderName) {
    const senderNameField = document.querySelector("#senderName");
    if (senderNameField) {
      (senderNameField as HTMLInputElement).value = data.senderName;
    }
  }

  if (data.phoneNumber) {
    const phoneField = document.querySelector("#phone");
    if (phoneField) {
      (phoneField as HTMLInputElement).value = data.phoneNumber;
    }
  }

  if (data.province) {
    const provinceField = document.querySelector("#province");
    if (provinceField) {
      (provinceField as HTMLSelectElement).value = data.province;
    }
  }

  if (data.price) {
    const priceField = document.querySelector("#price");
    if (priceField) {
      (priceField as HTMLInputElement).value = data.price;
    }
  }

  // تنفيذ أي إجراءات إضافية مثل النقر على زر الإرسال
  const submitButton = document.querySelector("#submit");
  if (submitButton) {
    (submitButton as HTMLButtonElement).click();
  }
};

// تصدير الدالة الرئيسية لملء النماذج المحسن
export const enhancedFormFiller = () => {
  console.log('تم تشغيل ملء النموذج المحسن');
  // هنا يمكن وضع منطق ملء النموذج المحسن
  alert('تم تشغيل أداة ملء النموذج المحسنة!');
  
  // مثال على كيفية استخدام الدالة
  const sampleData: BookmarkletItem = {
    id: '1',
    code: 'ABC123',
    senderName: 'محمد أحمد',
    phoneNumber: '07701234567',
    province: 'بغداد',
    price: '25000',
    companyName: 'شركة النقل السريع',
    exportDate: new Date().toISOString(),
    status: 'ready'
  };
  
  // استدعاء دالة ملء النموذج
  fillForm(sampleData);
};
