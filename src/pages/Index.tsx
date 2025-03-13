
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import AppHeader from "@/components/AppHeader";
import ImagePreviewContainer from "@/components/ImageViewer/ImagePreviewContainer";
import LearningStats from "@/components/LearningStats";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi
  } = useImageProcessing();
  
  const { toast } = useToast();
  const isInitialized = useRef(false);

  // إضافة معالج الرسائل للتواصل بين النوافذ المختلفة
  useEffect(() => {
    const handleMessages = (event: MessageEvent) => {
      console.log("تم استلام رسالة من نافذة أخرى:", event.data);
      
      // التحقق من أن الرسالة صالحة
      if (!event.data || typeof event.data !== 'object') {
        return;
      }
      
      if (event.data.type === 'autofill-data-request') {
        // عندما تطلب نافذة أخرى البيانات، نرسلها
        const imageId = event.data.imageId;
        const selectedImage = images.find(img => img.id === imageId);
        
        if (selectedImage && event.source && event.source instanceof Window) {
          console.log("إرسال بيانات الإدخال التلقائي:", {
            companyName: selectedImage.companyName,
            code: selectedImage.code,
            senderName: selectedImage.senderName,
            phoneNumber: selectedImage.phoneNumber,
            province: selectedImage.province,
            price: selectedImage.price
          });
          
          // إرسال البيانات للنافذة الطالبة
          try {
            event.source.postMessage({
              type: 'autofill-data-response',
              data: {
                companyName: selectedImage.companyName || "",
                code: selectedImage.code || "",
                senderName: selectedImage.senderName || "",
                phoneNumber: selectedImage.phoneNumber || "",
                province: selectedImage.province || "",
                price: selectedImage.price || ""
              }
            }, '*');
            
            toast({
              title: "تم إرسال البيانات",
              description: "تم إرسال بيانات الإدخال التلقائي إلى النافذة المستهدفة",
              variant: "default"
            });
          } catch (error) {
            console.error("خطأ في إرسال البيانات:", error);
            toast({
              title: "فشل إرسال البيانات",
              description: "تعذر إرسال البيانات إلى النافذة المستهدفة",
              variant: "destructive"
            });
          }
        } else if (!selectedImage) {
          console.error("الصورة المطلوبة غير موجودة:", imageId);
          
          // إذا لم يتم العثور على الصورة بالمعرف المحدد، نرسل بيانات فارغة
          if (event.source && event.source instanceof Window) {
            event.source.postMessage({
              type: 'autofill-data-response',
              data: {
                companyName: "",
                code: "",
                senderName: "",
                phoneNumber: "",
                province: "",
                price: ""
              },
              error: "الصورة المطلوبة غير موجودة"
            }, '*');
          }
        }
      } else if (event.data.type === 'autofill-result') {
        // استلام نتيجة عملية الإدخال التلقائي
        if (event.data.success) {
          toast({
            title: "تم الإدخال التلقائي بنجاح",
            description: event.data.message || "تم إدخال البيانات بنجاح في الموقع المستهدف",
            variant: "default"
          });
        } else {
          toast({
            title: "فشل الإدخال التلقائي",
            description: event.data.error || "حدث خطأ أثناء إدخال البيانات",
            variant: "destructive"
          });
        }
      }
    };
    
    // إضافة مستمع الرسائل وتسجيل جاهزية النافذة
    window.addEventListener("message", handleMessages);
    isInitialized.current = true;
    console.log("تم تهيئة معالج الرسائل بين النوافذ");
    
    return () => {
      window.removeEventListener("message", handleMessages);
    };
  }, [images, toast]);

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />

        <div className="flex flex-col items-center justify-center pt-4">
          <div className="w-full flex justify-center mx-auto">
            <ImageUploader 
              isProcessing={isProcessing}
              processingProgress={processingProgress}
              useGemini={useGemini}
              onFileChange={handleFileChange}
            />
          </div>

          <div className="w-full mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-3">
                <LearningStats />
              </div>
            </div>

            <ImagePreviewContainer 
              images={images}
              isSubmitting={isSubmitting}
              onTextChange={handleTextChange}
              onDelete={handleDelete}
              onSubmit={handleSubmitToApi}
              formatDate={formatDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
