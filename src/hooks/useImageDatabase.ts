
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const useImageDatabase = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  const { toast } = useToast();

  // وظيفة لحفظ بيانات الصورة في Supabase
  const saveImageToDatabase = async (image: ImageData, userId: string | undefined) => {
    if (!userId) {
      console.log("لا يوجد مستخدم مسجل، لا يمكن حفظ البيانات");
      return null;
    }

    console.log("جاري حفظ البيانات في قاعدة البيانات...", image);

    try {
      // التحقق مما إذا كانت الصورة موجودة بالفعل
      const { data: existingImage } = await supabase
        .from('images')
        .select('id')
        .eq('id', image.id)
        .maybeSingle();

      if (existingImage) {
        console.log("الصورة موجودة بالفعل، جاري التحديث:", existingImage.id);
        
        const { data: updatedData, error: updateError } = await supabase
          .from('images')
          .update({
            preview_url: image.previewUrl,
            extracted_text: image.extractedText,
            company_name: image.companyName || "",
            sender_name: image.senderName || "",
            phone_number: image.phoneNumber || "",
            code: image.code || "",
            price: image.price || "",
            province: image.province || "",
            status: image.status,
            submitted: true,
            batch_id: image.batch_id || "default",
            storage_path: image.storage_path || null // تحديث مسار التخزين
          })
          .eq('id', existingImage.id)
          .select();

        if (updateError) {
          console.error("خطأ في تحديث البيانات:", updateError);
          throw updateError;
        }

        console.log("تم تحديث البيانات بنجاح:", updatedData?.[0]);
        return updatedData?.[0];
      }

      // إذا لم تكن الصورة موجودة، قم بإدراجها
      const { data, error } = await supabase
        .from('images')
        .insert({
          id: image.id, // استخدم نفس المعرف لضمان الانسجام بين الواجهة وقاعدة البيانات
          user_id: userId,
          file_name: image.file.name,
          preview_url: image.previewUrl,
          extracted_text: image.extractedText,
          company_name: image.companyName || "",
          sender_name: image.senderName || "",
          phone_number: image.phoneNumber || "",
          code: image.code || "",
          price: image.price || "",
          province: image.province || "",
          status: image.status,
          submitted: true,
          batch_id: image.batch_id || "default",
          storage_path: image.storage_path || null // إضافة مسار التخزين
        })
        .select();

      if (error) {
        console.error("خطأ في حفظ البيانات:", error);
        toast({
          title: "خطأ",
          description: `فشل حفظ البيانات: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }

      // تحديث حالة الصورة ليشير إلى أنها تم حفظها
      updateImage(image.id, { submitted: true });

      console.log("تم حفظ البيانات بنجاح:", data?.[0]);
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ البيانات بنجاح",
      });
      
      return data?.[0];
    } catch (error: any) {
      console.error("خطأ في حفظ البيانات:", error);
      return null;
    }
  };

  // وظيفة لتحميل صور المستخدم من قاعدة البيانات
  const loadUserImages = async (userId: string | undefined, setAllImages: (images: ImageData[]) => void) => {
    if (!userId) {
      console.log("لا يوجد مستخدم مسجل، لا يمكن تحميل الصور");
      return;
    }

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
            storage_path: item.storage_path || null
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
  };

  // وظيفة إرسال البيانات إلى API وحفظها في قاعدة البيانات
  const handleSubmitToApi = async (id: string, image: ImageData, userId: string | undefined) => {
    // نستخدم useState في واجهة Hook عادية وليس داخل دالة أخرى
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    try {
      setIsSubmitting(true);
      // إعداد البيانات للإرسال
      const extractedData = {
        company_name: image.companyName || "",
        sender_name: image.senderName || "",
        phone_number: image.phoneNumber || "",
        code: image.code || "",
        price: image.price || "",
        province: image.province || ""
      };
      
      console.log("جاري إرسال البيانات إلى API...", extractedData);
      
      // إرسال البيانات إلى ويب هوك n8n
      const response = await fetch("https://ahmed0770.app.n8n.cloud/webhook-test/a9ee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extractedData)
      });
      
      const data = await response.json();
      console.log("تم إرسال البيانات بنجاح:", data);

      // حفظ البيانات في قاعدة البيانات Supabase
      const savedData = await saveImageToDatabase(image, userId);
      
      // تحديث حالة الصورة
      updateImage(id, { status: "completed", submitted: true });
      
      toast({
        title: "نجاح",
        description: `تم إرسال البيانات بنجاح!`,
      });
    } catch (error: any) {
      console.error("خطأ في إرسال البيانات:", error);
      updateImage(id, { status: "error" });
      
      toast({
        title: "خطأ",
        description: `فشل إرسال البيانات: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isLoadingUserImages,
    saveImageToDatabase,
    loadUserImages,
    handleSubmitToApi
  };
};
