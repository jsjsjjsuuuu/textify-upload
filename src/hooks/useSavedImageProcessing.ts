
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useCallback } from "react";
import { useImageDatabase } from "./useImageDatabase";
import { useDuplicateDetection } from "./useDuplicateDetection";

// المفتاح الموحد للتخزين المحلي
const PROCESSED_SAVED_IMAGES_KEY = 'processedUnifiedSavedImages';

export const useSavedImageProcessing = (
  updateImage: (id: string, fields: Partial<ImageData>) => void, 
  setAllImages: (images: ImageData[]) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { saveImageToDatabase, loadUserImages } = useImageDatabase(updateImage);
  const duplicateDetection = useDuplicateDetection({ enabled: true });
  
  // وظيفة مساعدة للتسجيل في نظام التخزين الموحد
  const markImageAsSaved = useCallback((imageId: string) => {
    try {
      // الحصول على القائمة الحالية
      const currentIds = localStorage.getItem(PROCESSED_SAVED_IMAGES_KEY) || '[]';
      let idsArray = JSON.parse(currentIds);
      
      // إضافة المعرف إذا لم يكن موجودًا بالفعل
      if (!idsArray.includes(imageId)) {
        idsArray.push(imageId);
        localStorage.setItem(PROCESSED_SAVED_IMAGES_KEY, JSON.stringify(idsArray));
        console.log(`تم تسجيل الصورة ${imageId} في التخزين الموحد كمحفوظة`);
      }
    } catch (error) {
      console.error('خطأ في تسجيل الصورة في التخزين الموحد:', error);
    }
  }, []);
  
  // التحقق مما إذا كانت الصورة محفوظة بالفعل
  const isImageAlreadySaved = useCallback((imageId: string): boolean => {
    try {
      const savedIds = localStorage.getItem(PROCESSED_SAVED_IMAGES_KEY) || '[]';
      const idsArray = JSON.parse(savedIds);
      return idsArray.includes(imageId);
    } catch (error) {
      console.error('خطأ في التحقق من حالة حفظ الصورة:', error);
      return false;
    }
  }, []);
  
  // وظيفة حفظ الصورة المعالجة عند النقر على زر الإرسال
  const saveProcessedImage = async (image: ImageData): Promise<void> => {
    // تسجيل الصورة في نظام اكتشاف التكرار
    duplicateDetection.markImageAsProcessed(image);
    
    // التحقق مما إذا كانت الصورة محفوظة بالفعل
    if (isImageAlreadySaved(image.id)) {
      console.log(`الصورة ${image.id} محفوظة بالفعل، تخطي الحفظ المتكرر`);
      toast({
        title: "تم الحفظ مسبقًا",
        description: "تم حفظ هذه الصورة بالفعل"
      });
      return;
    }
    
    if (!user) {
      console.log("المستخدم غير مسجل الدخول، لا يمكن حفظ الصورة");
      toast({
        title: "غير مسجل الدخول",
        description: "يجب تسجيل الدخول لحفظ البيانات",
        variant: "destructive"
      });
      return;
    }

    // التحقق من أن الصورة تحتوي على البيانات الأساسية
    if (image.code && image.senderName && image.phoneNumber) {
      console.log("حفظ الصورة في قاعدة البيانات بواسطة زر الإرسال:", image.id);
      
      try {
        setIsSubmitting(true);
        // حفظ البيانات في قاعدة البيانات
        const savedData = await saveImageToDatabase(image);
        
        if (savedData) {
          // تسجيل الصورة كمحفوظة في التخزين الموحد
          markImageAsSaved(image.id);
          
          // تحديث الصورة بمعلومات أنها تم حفظها
          updateImage(image.id, { 
            submitted: true,
            status: "completed"
          });
          
          console.log("تم حفظ الصورة بنجاح في قاعدة البيانات:", image.id);
          
          // إعادة تحميل الصور بعد الحفظ
          if (user) {
            await loadUserImages(user.id, setAllImages);
          }
          
          toast({
            title: "تم الحفظ",
            description: "تم حفظ البيانات في قاعدة البيانات بنجاح",
          });
        }
      } catch (error) {
        console.error("خطأ أثناء حفظ الصورة:", error);
        
        // تحديث حالة الصورة لتعكس أنها لم يتم حفظها بنجاح
        updateImage(image.id, { 
          error: "حدث خطأ أثناء محاولة حفظ البيانات",
          status: "error"
        });
        
        toast({
          title: "خطأ في الحفظ",
          description: "حدث خطأ أثناء محاولة حفظ البيانات",
          variant: "destructive"
        });
        
        // إعادة إلقاء الخطأ للتعامل معه في المستدعي
        throw new Error("حدث خطأ أثناء محاولة حفظ البيانات");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log("البيانات غير مكتملة، تم تخطي الحفظ في قاعدة البيانات:", image.id);
      
      // تحديث حالة الصورة لتعكس أن البيانات غير مكتملة
      updateImage(image.id, { 
        error: "البيانات غير مكتملة",
        status: "error"
      });
      
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة أولاً",
        variant: "destructive"
      });
      
      // إلقاء خطأ ليتم التعامل معه في المستدعي
      throw new Error("يرجى ملء جميع الحقول المطلوبة أولاً");
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    saveProcessedImage,
    markImageAsSaved,
    isImageAlreadySaved
  };
};
