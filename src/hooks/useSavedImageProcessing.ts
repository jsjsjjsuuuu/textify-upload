
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useImageDatabase } from "./useImageDatabase";

export const useSavedImageProcessing = (
  updateImage: (id: string, fields: Partial<ImageData>) => void, 
  setAllImages: (images: ImageData[]) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { saveImageToDatabase, loadUserImages } = useImageDatabase(updateImage);
  
  // وظيفة حفظ الصورة المعالجة عند النقر على زر الإرسال
  const saveProcessedImage = async (image: ImageData) => {
    if (!user) {
      console.log("المستخدم غير مسجل الدخول، لا يمكن حفظ الصورة");
      return;
    }

    // التحقق من أن الصورة مكتملة المعالجة وتحتوي على البيانات الأساسية
    const hasRequiredData = image.code || image.senderName || image.phoneNumber;
    
    if (hasRequiredData) {
      console.log("حفظ الصورة في قاعدة البيانات:", image.id);
      console.log("البيانات التي سيتم حفظها:", {
        code: image.code,
        senderName: image.senderName,
        phoneNumber: image.phoneNumber,
        province: image.province,
        price: image.price,
        companyName: image.companyName
      });
      
      try {
        // تعيين حالة الإرسال
        setIsSubmitting(true);
        
        // قبل الحفظ، نتأكد من أن البيانات منسقة بشكل صحيح
        // مثلاً، تنسيق رقم الهاتف إذا لم يكن في الصيغة الصحيحة
        const formattedImage = {
          ...image,
          phoneNumber: formatPhoneNumber(image.phoneNumber)
        };
        
        // حفظ البيانات في قاعدة البيانات
        const savedData = await saveImageToDatabase(formattedImage, user.id);
        
        if (savedData) {
          console.log("البيانات المستردة من قاعدة البيانات بعد الحفظ:", savedData);
          
          // تأخير قبل تحديث واجهة المستخدم لضمان اكتمال العملية
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // تحديث الصورة بمعلومات أنها تم حفظها والبيانات المحدثة من قاعدة البيانات
          const updatedFields: Partial<ImageData> = { 
            submitted: true
          };
          
          // التحقق من كل حقل قبل تحديثه
          if (savedData.code) updatedFields.code = savedData.code;
          if (savedData.sender_name) updatedFields.senderName = savedData.sender_name;
          if (savedData.phone_number) updatedFields.phoneNumber = savedData.phone_number;
          if (savedData.province) updatedFields.province = savedData.province;
          if (savedData.price) updatedFields.price = savedData.price;
          if (savedData.company_name) updatedFields.companyName = savedData.company_name;
          if (savedData.extracted_text) updatedFields.extractedText = savedData.extracted_text;
          
          // طباعة البيانات المحدثة للتحقق منها
          console.log("تحديث الصورة بالبيانات التالية:", updatedFields);
          
          // تحديث الصورة في حالة التطبيق
          updateImage(image.id, updatedFields);
          
          console.log("تم حفظ الصورة بنجاح في قاعدة البيانات:", image.id);
          
          // إعادة تحميل الصور بعد الحفظ لضمان تحديث البيانات في واجهة المستخدم
          await loadUserImages(user.id, setAllImages);
          
          toast({
            title: "تم الحفظ",
            description: "تم حفظ البيانات في قاعدة البيانات بنجاح",
          });
          
          return savedData;
        }
      } catch (error) {
        console.error("خطأ أثناء حفظ الصورة:", error);
        toast({
          title: "خطأ في الحفظ",
          description: "حدث خطأ أثناء محاولة حفظ البيانات",
          variant: "destructive"
        });
        
        throw error; // إعادة رمي الخطأ للتعامل معه في الاستدعاء
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log("البيانات غير مكتملة، تم تخطي الحفظ في قاعدة البيانات:", image.id);
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة أولاً",
        variant: "destructive"
      });
    }
  };

  // وظيفة مساعدة لتنسيق رقم الهاتف
  const formatPhoneNumber = (phone?: string): string => {
    if (!phone) return '';
    
    // إزالة جميع الأحرف غير الرقمية
    let cleaned = phone.replace(/\D/g, '');
    
    // التأكد من أن الرقم يبدأ بـ 0
    if (cleaned.length === 10 && !cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }
    
    // التأكد من الطول الصحيح (11 رقم)
    if (cleaned.length > 11) {
      cleaned = cleaned.substring(0, 11);
    }
    
    return cleaned;
  };

  return {
    isSubmitting,
    setIsSubmitting,
    saveProcessedImage
  };
};
