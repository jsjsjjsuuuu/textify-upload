
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
    clearSessionImages,
    removeDuplicates
  } = useImageState();
  
  const { 
    isProcessing, 
    useGemini, 
    handleFileChange 
  } = useFileUpload({
    images,
    addImage,
    updateImage,
    setProcessingProgress
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
        const loadedImages: ImageData[] = data.map((item, index) => {
          // إنشاء كائن File افتراضي للصور المخزنة سابقاً
          const dummyFile = new File([""], item.file_name, { type: "image/jpeg" });
          
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
            user_id: item.user_id
          };
        });
        
        // بدلاً من استبدال جميع الصور، نضيف السجلات المستوردة إلى مجموعة الصور الكاملة فقط
        setAllImages(loadedImages);
        
        toast({
          title: "تم التحميل",
          description: `تم تحميل ${data.length} صورة من حسابك`
        });
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
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لحفظ البيانات",
        variant: "destructive",
      });
      return null;
    }

    console.log("جاري حفظ البيانات في قاعدة البيانات...", image);

    try {
      // التحقق مما إذا كانت الصورة موجودة بالفعل
      const { data: existingImage } = await supabase
        .from('images')
        .select('id')
        .eq('user_id', user.id)
        .eq('file_name', image.file.name)
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
            submitted: image.submitted
          })
          .eq('id', existingImage.id)
          .select();

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "نجاح",
          description: `تم تحديث البيانات في قاعدة البيانات`,
        });

        console.log("تم تحديث البيانات بنجاح:", updatedData[0]);
        return updatedData[0];
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
          status: image.status
        })
        .select();

      if (error) {
        toast({
          title: "خطأ في حفظ البيانات",
          description: error.message,
          variant: "destructive",
        });
        console.error("خطأ في حفظ البيانات:", error);
        return null;
      }

      // تحديث حالة الصورة ليشير إلى أنها تم حفظها
      updateImage(image.id, { submitted: true, user_id: user.id });

      toast({
        title: "نجاح",
        description: `تم حفظ البيانات في قاعدة البيانات`,
      });

      console.log("تم حفظ البيانات بنجاح:", data[0]);
      
      // تحديث الصور العامة لتشمل الصورة المحفوظة
      setAllImages([...images, data[0] as unknown as ImageData]);
      
      return data[0];
    } catch (error: any) {
      console.error("خطأ في حفظ البيانات:", error);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
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
        description: `تم إرسال البيانات بنجاح لـ ${image.file.name}!`,
      });

      // تحديث السجلات بعد الحفظ
      if (savedData) {
        loadUserImages();
      }

    } catch (error: any) {
      console.error("خطأ في إرسال البيانات:", error);
      updateImage(id, { status: "error" });
      
      toast({
        title: "خطأ",
        description: `فشل إرسال البيانات لـ ${image.file.name}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // حفظ الصورة المعالجة في قاعدة البيانات تلقائياً عند الانتهاء من المعالجة
  const saveProcessedImage = async (image: ImageData) => {
    // التحقق من أن الصورة مكتملة المعالجة وتحتوي على البيانات الأساسية
    if (image.status === "completed" && image.code && image.senderName && image.phoneNumber) {
      console.log("حفظ الصورة المعالجة تلقائياً:", image.id);
      // حفظ البيانات في قاعدة البيانات
      const savedData = await saveImageToDatabase(image);
      
      // تحديث السجلات بعد الحفظ
      if (savedData) {
        loadUserImages();
      }
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
