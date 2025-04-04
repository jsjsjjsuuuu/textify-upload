
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useDbRequest } from "./useDbRequest";

export const useDbLoad = () => {
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const { toast } = useToast();
  const { cacheDbRequest } = useDbRequest();

  // تعديل توقيع الوظيفة loadUserImages لتقبل المعاملات
  const loadUserImages = useCallback(async (userId: string | undefined, setAllImages: (images: ImageData[]) => void) => {
    if (!userId) {
      console.log("لا يوجد مستخدم مسجل، لا يمكن تحميل الصور");
      return;
    }

    // استخدام التخزين المؤقت للطلبات لتجنب الاستدعاءات المتكررة
    return cacheDbRequest(`load_user_images_${userId}`, async () => {
      setIsLoadingUserImages(true);
      try {
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("خطأ في جلب صور المستخدم:", error);
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء تحميل الصور الخاصة بك",
            variant: "destructive",
          });
          return;
        }

        if (data && data.length > 0) {
          console.log(`تم العثور على ${data.length} صورة للمستخدم`);
          
          // تحويل بيانات قاعدة البيانات إلى كائنات ImageData
          const loadedImages: ImageData[] = data.map((item: any, index: number) => {
            // إنشاء كائن File افتراضي للصور المخزنة سابقاً
            const dummyFile = new File([""], item.file_name || "unknown.jpg", { type: "image/jpeg" });
            
            // الحصول على عنوان URL العام للصورة من Storage
            let previewUrl = item.preview_url;
            if (item.storage_path) {
              const { data: publicUrlData } = supabase.storage
                .from('receipt_images')
                .getPublicUrl(item.storage_path);
              previewUrl = publicUrlData.publicUrl;
            }
            
            return {
              id: item.id,
              file: dummyFile,
              previewUrl: previewUrl,
              extractedText: item.extracted_text || "",
              code: item.code || "",
              senderName: item.sender_name || "",
              phoneNumber: item.phone_number || "",
              price: item.price || "",
              province: item.province || "",
              companyName: item.company_name || "",
              date: new Date(item.created_at),
              status: item.status as "processing" | "pending" | "completed" | "error" || "completed",
              submitted: item.submitted || false,
              number: data.length - index, // ترقيم تنازلي بناءً على ترتيب الاستلام
              user_id: item.user_id,
              batch_id: item.batch_id || 'default',
              storage_path: item.storage_path || null,
              created_at: item.created_at
            };
          });
          
          // تعيين الصور المحملة
          setAllImages(loadedImages);
        } else {
          console.log("لم يتم العثور على صور للمستخدم");
        }
      } catch (err) {
        console.error("خطأ أثناء تحميل صور المستخدم:", err);
      } finally {
        setIsLoadingUserImages(false);
      }
    }, 3000); // تخزين مؤقت لمدة 3 ثوانٍ
  }, [cacheDbRequest, toast]);

  return {
    loadUserImages,
    isLoadingUserImages
  };
};
