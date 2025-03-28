
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { useImageState } from "@/hooks/useImageState";
import { useFileUpload } from "@/hooks/useFileUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useImageProcessingCore = () => {
  const [processingProgress, setProcessingProgress] = useState(0);
  const [bookmarkletStats, setBookmarkletStats] = useState({ total: 0, ready: 0, success: 0, error: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUserImages, setIsLoadingUserImages] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { 
    images, 
    sessionImages,
    addImage, 
    updateImage, 
    deleteImage, 
    handleTextChange,
    setAllImages,
    addDatabaseImages,
    clearSessionImages,
    removeDuplicates
  } = useImageState();
  
  // تعريف وظيفة حفظ الصورة أولاً حتى نتمكن من تمريرها لـ useFileUpload
  const saveProcessedImage = async (image: ImageData) => {
    if (!user) {
      console.log("المستخدم غير مسجل الدخول، لا يمكن حفظ الصورة");
      return;
    }

    // التحقق من أن الصورة مكتملة المعالجة وتحتوي على البيانات الأساسية
    if (image.code && image.senderName && image.phoneNumber) {
      console.log("حفظ الصورة المعالجة في قاعدة البيانات:", image.id);
      
      try {
        // حفظ البيانات في قاعدة البيانات
        const savedData = await saveImageToDatabase(image);
        
        if (savedData) {
          // تحديث الصورة بمعلومات أنها تم حفظها
          updateImage(image.id, { submitted: true });
          console.log("تم حفظ الصورة بنجاح في قاعدة البيانات:", image.id);
          
          // إعادة تحميل الصور بعد الحفظ
          await loadUserImages();
        }
      } catch (error) {
        console.error("خطأ أثناء حفظ الصورة:", error);
      }
    } else {
      console.log("البيانات غير مكتملة، تم تخطي الحفظ في قاعدة البيانات:", image.id);
    }
  };
  
  const { 
    isProcessing, 
    useGemini, 
    handleFileChange 
  } = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress,
    saveProcessedImage // تمرير وظيفة حفظ الصورة
  });

  // جلب صور المستخدم من قاعدة البيانات عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      console.log("تم تسجيل الدخول، جاري جلب صور المستخدم:", user.id);
      loadUserImages();
    }
  }, [user]);

  // وظيفة لتحميل صور المستخدم من قاعدة البيانات
  const loadUserImages = async () => {
    if (!user) {
      console.log("لا يوجد مستخدم مسجل، لا يمكن تحميل الصور");
      return;
    }

    setIsLoadingUserImages(true);
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
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
          
          return {
            id: item.id,
            file: dummyFile,
            previewUrl: item.preview_url || "",
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
            batch_id: item.batch_id || 'default' // إضافة معرف الدفعة مع قيمة افتراضية
          };
        });
        
        // استخدام الوظيفة الجديدة لإضافة الصور من قاعدة البيانات
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

  // وظيفة لحفظ بيانات الصورة في Supabase
  const saveImageToDatabase = async (image: ImageData) => {
    if (!user) {
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
            batch_id: image.batch_id || "default" // تحديث معرف الدفعة
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
          user_id: user.id,
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
          batch_id: image.batch_id || "default" // إضافة معرف الدفعة
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

  // وظيفة إرسال البيانات إلى API وحفظها في قاعدة البيانات
  const handleSubmitToApi = async (id: string, image: ImageData) => {
    setIsSubmitting(true);
    try {
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
      const savedData = await saveImageToDatabase(image);
      
      // تحديث حالة الصورة
      updateImage(id, { status: "completed", submitted: true });
      
      toast({
        title: "نجاح",
        description: `تم إرسال البيانات بنجاح!`,
      });

      // تحديث السجلات بعد الحفظ
      if (savedData) {
        await loadUserImages();
      }

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
    images,
    sessionImages,
    isProcessing,
    processingProgress,
    isSubmitting,
    isLoadingUserImages,
    useGemini,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi,
    saveImageToDatabase,
    saveProcessedImage,
    loadUserImages,
    clearSessionImages,
    removeDuplicates
  };
};
