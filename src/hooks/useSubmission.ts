
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { submitTextToApi } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { ExternalSubmitResponse } from "@/utils/bookmarklet/types";

export const useSubmission = (updateImage: (id: string, fields: Partial<ImageData>) => void) => {
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
    
    // التحقق من صحة البيانات قبل الإرسال
    let hasErrors = false;
    let errorMessages = [];
    
    // التحقق من رقم الهاتف
    if (image.phoneNumber && image.phoneNumber.replace(/[^\d]/g, '').length !== 11) {
      hasErrors = true;
      errorMessages.push("رقم الهاتف غير صحيح (يجب أن يكون 11 رقم)");
    }
    
    // التحقق من السعر
    if (image.price) {
      const cleanedPrice = image.price.toString().replace(/[^\d.]/g, '');
      const numValue = parseFloat(cleanedPrice);
      if (numValue > 0 && numValue < 1000 && image.price !== '0') {
        hasErrors = true;
        errorMessages.push("السعر غير صحيح (يجب أن يكون 1000 أو أكبر أو 0)");
      }
    }
    
    if (hasErrors) {
      toast({
        title: "لا يمكن إرسال البيانات",
        description: errorMessages.join("، "),
        variant: "destructive"
      });
      return;
    }
    
    // التأكد من تحديث حالة الصورة إلى "مكتملة" قبل الإرسال
    if (image.code && image.senderName && image.phoneNumber && image.status !== "completed") {
      updateImage(id, { status: "completed" });
    }
    
    setIsSubmitting(true);
    try {
      const result = await submitTextToApi({
        imageId: id,
        text: image.extractedText,
        source: image.file.name,
        date: image.date.toISOString()
      });
      
      if (result.success) {
        updateImage(id, { submitted: true });

        toast({
          title: "تم الإرسال بنجاح",
          description: result.message
        });
      } else {
        toast({
          title: "فشل في الإرسال",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // إضافة وظيفة جديدة للإرسال إلى واجهة خارجية
  const handleExternalSubmit = async (formData: Record<string, any>, options: {
    url: string,
    method: 'GET' | 'POST' | 'PUT',
    headers?: Record<string, string>,
    mapFields?: Record<string, string>
  }): Promise<ExternalSubmitResponse> => {
    setIsSubmitting(true);
    
    try {
      // تحويل البيانات حسب تعيين الحقول إذا كان هناك تعيين محدد
      const mappedData: Record<string, any> = {};
      if (options.mapFields) {
        for (const [key, value] of Object.entries(formData)) {
          if (value && options.mapFields[key]) {
            mappedData[options.mapFields[key]] = value;
          }
        }
      } else {
        // استخدام البيانات كما هي
        Object.assign(mappedData, formData);
      }
      
      // إضافة تجاوز CORS عبر استخدام وسيط (للاختبار فقط)
      const corsProxyUrl = '';
      const targetUrl = corsProxyUrl ? `${corsProxyUrl}${encodeURIComponent(options.url)}` : options.url;
      
      // تكوين طلب الإرسال
      const requestOptions: RequestInit = {
        method: options.method,
        headers: options.headers || {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: options.method !== 'GET' ? JSON.stringify(mappedData) : undefined,
      };
      
      // محاولة الإرسال مع معالجة خاصة لـ CORS
      let corsAttempted = false;
      let response: Response;
      
      try {
        // محاولة إرسال عادية أولاً
        response = await fetch(targetUrl, requestOptions);
      } catch (corsError) {
        // في حالة وجود خطأ CORS، نحاول باستخدام وضع no-cors
        corsAttempted = true;
        requestOptions.mode = 'no-cors';
        response = await fetch(targetUrl, requestOptions);
      }
      
      // محاولة معالجة الاستجابة
      let responseData: any = null;
      try {
        if (response.headers.get('content-type')?.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (parseError) {
        // في حالة استخدام وضع "no-cors"، لا يمكن قراءة الاستجابة
        if (corsAttempted) {
          return {
            success: true, // نفترض النجاح لأننا لا نستطيع معرفة الحالة الفعلية
            message: "تم إرسال البيانات (لا يمكن التأكد من الإضافة بسبب قيود CORS)",
            code: response.status,
            responseData: null,
            timestamp: new Date().toISOString()
          };
        }
        
        // خطأ في تحليل الاستجابة
        responseData = "خطأ في تحليل استجابة الخادم";
      }
      
      // إنشاء كائن الاستجابة
      return {
        success: response.ok,
        message: response.ok 
          ? "تم إضافة البيانات بنجاح في النظام الخارجي" 
          : `فشل الإرسال بكود الاستجابة: ${response.status}`,
        code: response.status,
        responseData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // معالجة أي أخطاء غير متوقعة
      const errorMessage = error instanceof Error 
        ? error.message 
        : "حدث خطأ غير معروف أثناء إرسال البيانات";
      
      return {
        success: false,
        message: errorMessage,
        code: 0,
        timestamp: new Date().toISOString()
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmitToApi, handleExternalSubmit };
};
