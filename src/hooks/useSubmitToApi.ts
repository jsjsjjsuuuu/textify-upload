
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { submitTextToApi } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

export const useSubmitToApi = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitToApi = async (id: string, image: ImageData) => {
    if (!image || image.status !== "completed") {
      toast({
        title: "خطأ في الإرسال",
        description: "يرجى التأكد من اكتمال معالجة الصورة واستخراج النص",
        variant: "destructive"
      });
      return;
    }
    
    // إنشاء تقرير تفصيلي عن عملية التحقق من البيانات
    const validationReport: Record<string, any> = {
      imageId: id,
      validationTime: new Date().toISOString(),
      fieldsChecked: ["senderName", "phoneNumber", "province", "price"],
      fieldsStatus: {}
    };
    
    // التحقق من صحة اسم المرسل
    if (!image.senderName || image.senderName.trim() === '') {
      validationReport.fieldsStatus.senderName = "مفقود";
    } else if (image.senderName.length < 3) {
      validationReport.fieldsStatus.senderName = "قصير جداً";
    } else {
      validationReport.fieldsStatus.senderName = "صالح";
    }
    
    // التحقق من صحة رقم الهاتف
    if (!image.phoneNumber || image.phoneNumber.trim() === '') {
      validationReport.fieldsStatus.phoneNumber = "مفقود";
    } else if (image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
      validationReport.fieldsStatus.phoneNumber = "غير صالح - يجب أن يكون 11 رقم";
    } else {
      validationReport.fieldsStatus.phoneNumber = "صالح";
    }
    
    // التحقق من صحة المحافظة
    if (!image.province || image.province.trim() === '') {
      validationReport.fieldsStatus.province = "مفقودة";
    } else {
      validationReport.fieldsStatus.province = "صالحة";
    }
    
    // التحقق من صحة السعر
    if (!image.price || image.price.trim() === '') {
      validationReport.fieldsStatus.price = "غير محدد";
    } else {
      const cleanedPrice = image.price.toString().replace(/[^\d.]/g, '');
      const numValue = parseFloat(cleanedPrice);
      if (numValue > 0 && numValue < 1000 && image.price !== '0') {
        validationReport.fieldsStatus.price = "غير صالح - أقل من 1000";
      } else {
        validationReport.fieldsStatus.price = "صالح";
      }
    }
    
    // التحقق من وجود حقول غير صالحة في التقرير
    const invalidFields = Object.entries(validationReport.fieldsStatus)
      .filter(([_, status]) => status !== "صالح" && status !== "غير محدد")
      .map(([field]) => field);
    
    validationReport.isValid = invalidFields.length === 0;
    validationReport.invalidFields = invalidFields;
    
    // إذا كانت البيانات غير صالحة، عرض تقرير تفصيلي
    if (!validationReport.isValid) {
      const fieldsMessages = Object.entries(validationReport.fieldsStatus)
        .filter(([_, status]) => status !== "صالح" && status !== "غير محدد")
        .map(([field, status]) => {
          const fieldNames: Record<string, string> = {
            senderName: "اسم المرسل",
            phoneNumber: "رقم الهاتف",
            province: "المحافظة",
            price: "السعر"
          };
          return `${fieldNames[field]}: ${status}`;
        });
      
      toast({
        title: "تقرير التحقق من البيانات",
        description: `توجد مشاكل في البيانات التالية: ${fieldsMessages.join('، ')}`,
        variant: "warning",
        report: validationReport
      });
      return false;
    }
    
    // إذا كانت الصورة قد تم إرسالها مسبقًا
    if (image.submitted) {
      toast({
        title: "تم الإرسال مسبقًا",
        description: "تم إرسال هذه البيانات مسبقًا",
        variant: "info",
        report: {
          status: "تم الإرسال مسبقاً",
          submissionTime: image.submissionTime || new Date().toISOString(),
          imageId: id
        }
      });
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const submissionReport: Record<string, any> = {
        startTime: new Date().toISOString(),
        imageId: id,
        dataSize: JSON.stringify({
          senderName: image.senderName,
          phoneNumber: image.phoneNumber,
          province: image.province,
          price: image.price,
          companyName: image.companyName,
          code: image.code
        }).length,
        attemptCount: 1
      };
      
      const result = await submitTextToApi({
        imageId: id,
        text: image.extractedText,
        source: image.file.name,
        date: image.date.toISOString(),
        // إضافة بيانات إضافية للإرسال
        metadata: {
          senderName: image.senderName || "",
          phoneNumber: image.phoneNumber || "",
          province: image.province || "",
          price: image.price || "",
          companyName: image.companyName || "",
          code: image.code || ""
        }
      });
      
      submissionReport.endTime = new Date().toISOString();
      submissionReport.responseStatus = result.success ? "success" : "error";
      submissionReport.responseMessage = result.message;
      
      if (result.success) {
        const submissionTime = new Date().toISOString();
        updateImage(id, { 
          submitted: true,
          submissionTime: submissionTime
        });
        
        submissionReport.finalStatus = "completed";
        submissionReport.submissionTime = submissionTime;

        toast({
          title: "تم الإرسال بنجاح",
          description: result.message,
          variant: "success",
          report: submissionReport
        });
        
        return true;
      } else {
        submissionReport.finalStatus = "failed";
        submissionReport.error = result.message;
        
        toast({
          title: "فشل في الإرسال",
          description: result.message,
          variant: "destructive",
          report: submissionReport
        });
        
        return false;
      }
    } catch (error) {
      console.error("خطأ في إرسال البيانات:", error);
      
      const errorReport = {
        imageId: id,
        time: new Date().toISOString(),
        errorType: "network",
        errorMessage: error instanceof Error ? error.message : "خطأ غير معروف",
        requestData: {
          senderName: image.senderName,
          phoneNumber: image.phoneNumber,
          province: image.province,
          price: image.price
        }
      };
      
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء الاتصال بالخادم",
        variant: "destructive",
        report: errorReport
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmitToApi };
};
