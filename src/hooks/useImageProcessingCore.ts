
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
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastSavedIds, setLastSavedIds] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { 
    images, 
    addImage, 
    updateImage, 
    deleteImage, 
    handleTextChange,
    setImages,
    renumberImages,
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

  // وظيفة لجلب صور المستخدم من قاعدة البيانات
  const fetchUserImages = async () => {
    if (!user) {
      console.log("لا يوجد مستخدم مسجل الدخول، لا يمكن جلب الصور");
      return [];
    }

    if (isLoading) {
      console.log("جاري بالفعل تحميل الصور، تجاهل طلب التحميل الإضافي");
      return [];
    }

    try {
      setIsLoading(true);
      console.log("جاري جلب صور المستخدم من قاعدة البيانات...", user.id);

      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("خطأ في جلب صور المستخدم:", error);
        toast({
          title: "خطأ",
          description: `فشل في تحميل الصور: ${error.message}`,
          variant: "destructive",
        });
        return [];
      }

      console.log(`تم جلب ${data.length} صورة للمستخدم:`, user.id);
      
      // إنشاء مجموعة من معرفات الصور المحفوظة مسبقًا
      const loadedIds = new Set(data.map(item => item.id));
      setLastSavedIds(loadedIds);
      
      // تحويل البيانات من Supabase إلى نموذج ImageData
      const convertedImages = data.map((item, index) => {
        const image: Partial<ImageData> = {
          id: item.id || `db-${Date.now()}-${index}`,
          previewUrl: item.preview_url || '',
          extractedText: item.extracted_text || '',
          companyName: item.company_name || '',
          senderName: item.sender_name || '',
          phoneNumber: item.phone_number || '',
          code: item.code || '',
          price: item.price || '',
          province: item.province || '',
          status: item.status as "processing" | "pending" | "completed" | "error" || "completed",
          date: new Date(item.created_at),
          submitted: item.submitted || false,
          number: data.length - index, // ترقيم تنازلي بناءً على الترتيب
          // إنشاء كائن File وهمي لأن البيانات المستردة من قاعدة البيانات لا تحتوي على الملف الأصلي
          file: new File([], item.file_name || "unknown_file.jpg", { type: "image/jpeg" })
        };
        
        return image as ImageData;
      });

      return convertedImages;
    } catch (error: any) {
      console.error("خطأ غير متوقع في جلب الصور:", error);
      toast({
        title: "خطأ",
        description: `فشل في تحميل الصور: ${error.message}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل بيانات المستخدم عند تغيير حالة تسجيل الدخول - تحسين منع التحميل المتكرر
  useEffect(() => {
    // فقط تحميل البيانات إذا كان المستخدم مسجل الدخول ولم يتم تحميل البيانات من قبل
    if (user && !dataLoaded) {
      console.log("تم اكتشاف تسجيل دخول مستخدم، جاري تحميل بياناته...");
      
      const loadUserData = async () => {
        const userImages = await fetchUserImages();
        
        if (userImages.length > 0) {
          console.log(`تم تحميل ${userImages.length} صورة للمستخدم وإضافتها إلى الحالة`);
          
          // استبدال الصور بدلاً من إضافتها لمنع التكرار - تنظيف شامل للحالة
          setImages(userImages);
          
          // تطبيق الترقيم التسلسلي بعد تحميل البيانات
          setTimeout(() => {
            renumberImages();
          }, 100);
          
          toast({
            title: "تم التحميل",
            description: `تم تحميل ${userImages.length} سجل من بياناتك بنجاح`,
          });
        } else {
          console.log("لم يتم العثور على سجلات للمستخدم أو فشل التحميل");
        }
        
        // تحديد حالة التحميل بعد اكتمال العملية بنجاح
        setDataLoaded(true);
      };
      
      loadUserData();
    }
  }, [user, dataLoaded]);

  // وظيفة لحفظ بيانات الصورة في Supabase - تحسين منع الحفظ المتكرر
  const saveImageToDatabase = async (image: ImageData) => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لحفظ البيانات",
        variant: "destructive",
      });
      return null;
    }

    // تحقق من أن الصورة ليست محفوظة بالفعل - تجنب الحفظ المتكرر
    if (image.submitted && lastSavedIds.has(image.id)) {
      console.log("الصورة محفوظة بالفعل في قاعدة البيانات، تجاهل:", image.id);
      return null;
    }

    console.log("جاري حفظ البيانات في قاعدة البيانات...", image.id);

    try {
      // التحقق من وجود السجل
      const { data: existingData, error: checkError } = await supabase
        .from('images')
        .select('id')
        .eq('id', image.id)
        .maybeSingle();
        
      if (checkError) {
        console.error("خطأ في التحقق من وجود السجل:", checkError);
      }
      
      let result;
      
      // إذا كان السجل موجودًا، قم بتحديثه
      if (existingData) {
        console.log("السجل موجود بالفعل، جاري التحديث:", image.id);
        const { data, error } = await supabase
          .from('images')
          .update({
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
            submitted: true // تعيين حالة الإرسال إلى true عند الحفظ
          })
          .eq('id', image.id)
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        result = data;
      } else {
        // إذا لم يكن موجودًا، قم بإضافته
        console.log("إنشاء سجل جديد للصورة:", image.id);
        const { data, error } = await supabase
          .from('images')
          .insert({
            id: image.id,
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
            submitted: true // تعيين حالة الإرسال إلى true عند الحفظ
          })
          .select();

        if (error) {
          throw error;
        }
        
        result = data[0];
      }

      // تحديث حالة الصورة ليشير إلى أنها تم حفظها
      updateImage(image.id, { submitted: true });
      
      // إضافة معرف الصورة إلى قائمة المعرفات المحفوظة
      setLastSavedIds(prev => new Set(prev).add(image.id));

      toast({
        title: "نجاح",
        description: `تم حفظ البيانات في قاعدة البيانات`,
      });

      console.log("تم حفظ البيانات بنجاح:", result);
      return result;
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
    // تجاهل إذا كانت الصورة مرسلة بالفعل
    if (image.submitted) {
      console.log("الصورة مرسلة بالفعل، تجاهل:", id);
      toast({
        title: "معلومات",
        description: "تم إرسال هذه البيانات بالفعل",
      });
      return;
    }
    
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

  // حفظ الصورة المعالجة في قاعدة البيانات تلقائياً عند الانتهاء من المعالجة - تحسين منع الحفظ المتكرر
  const saveProcessedImage = async (image: ImageData) => {
    // التحقق من أن الصورة مكتملة المعالجة وتحتوي على البيانات الأساسية
    // والتحقق من أنها لم تحفظ من قبل
    if (image.status === "completed" && 
        image.code && 
        image.senderName && 
        image.phoneNumber && 
        !image.submitted && 
        !lastSavedIds.has(image.id)) {
      console.log("حفظ الصورة المعالجة تلقائياً:", image.id);
      // حفظ البيانات في قاعدة البيانات
      await saveImageToDatabase(image);
    }
  };

  // إجراء تحميل جديد للبيانات مع تحسين إزالة التكرار
  const refreshUserData = async () => {
    if (isLoading) {
      console.log("جاري بالفعل تحميل البيانات، تجاهل طلب التحديث");
      return;
    }
    
    setDataLoaded(false); // إعادة ضبط حالة التحميل ليتم إعادة تحميل البيانات
    const userImages = await fetchUserImages();
    
    if (userImages.length > 0) {
      // استبدال الصور بدلاً من إضافتها لمنع التكرار
      console.log(`استبدال الصور القديمة (${images.length}) بالصور المحدثة (${userImages.length})`);
      setImages(userImages);
      
      // بعد تعيين الصور، قم بإعادة ترقيمها
      setTimeout(() => {
        renumberImages();
      }, 100);
      
      toast({
        title: "تم التحديث",
        description: `تم تحديث ${userImages.length} سجل من بياناتك بنجاح`,
      });
    }
    
    setDataLoaded(true);
    
    // تطبيق إزالة التكرار بعد التحميل
    const duplicatesRemoved = removeDuplicates();
    
    if (duplicatesRemoved) {
      toast({
        title: "تم التنظيف",
        description: "تم إزالة السجلات المكررة بنجاح",
      });
    }
  };

  return {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    isLoading,
    dataLoaded,
    useGemini,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete: deleteImage,
    handleSubmitToApi,
    saveImageToDatabase,
    saveProcessedImage,
    fetchUserImages,
    refreshUserData,
    renumberImages,
    removeDuplicates
  };
};
