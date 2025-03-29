
import { useState, useEffect, useCallback } from "react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { parseDataFromOCRText } from "@/utils/imageDataParser";
import { addCorrection } from "@/utils/learningSystem";

export const useDataExtraction = (
  image: ImageData,
  onTextChange: (id: string, field: string, value: string) => void,
  editMode: boolean,
  setEditMode: (value: boolean) => void
) => {
  const { toast } = useToast();
  const [tempData, setTempData] = useState({
    code: image.code || "",
    senderName: image.senderName || "",
    phoneNumber: image.phoneNumber || "",
    province: image.province || "",
    price: image.price || "",
    companyName: image.companyName || ""
  });
  const [correctionsMade, setCorrectionsMade] = useState<{ field: string; value: string }[]>([]);
  const [isLearningActive, setIsLearningActive] = useState(true);

  // طباعة البيانات القادمة من الصورة للتأكد من صحتها
  useEffect(() => {
    console.log("بيانات الصورة في useDataExtraction:", {
      id: image.id,
      code: image.code,
      senderName: image.senderName,
      phoneNumber: image.phoneNumber,
      price: image.price,
      province: image.province,
      companyName: image.companyName
    });
    
    // تحديث البيانات المؤقتة عند تغيير الصورة
    setTempData({
      code: image.code || "",
      senderName: image.senderName || "",
      phoneNumber: image.phoneNumber || "",
      province: image.province || "",
      price: image.price || "",
      companyName: image.companyName || ""
    });
    
    // إعادة تعيين التصحيحات عند تغيير الصورة
    setCorrectionsMade([]);
  }, [
    image.id, 
    image.code, 
    image.senderName, 
    image.phoneNumber, 
    image.province, 
    image.price, 
    image.companyName
  ]);

  // مراقبة التغييرات في النص المستخرج وتحديث البيانات إذا كان فارغًا سابقًا
  useEffect(() => {
    if (image.extractedText && 
        (!image.code && !image.senderName && !image.phoneNumber && !image.province && !image.price && !image.companyName)) {
      console.log("النص المستخرج موجود ولكن البيانات فارغة، جاري استخراج البيانات تلقائيًا");
      handleAutoExtract();
    }
  }, [image.extractedText]);

  // تبديل وضع التحرير
  const handleEditToggle = () => {
    if (editMode) {
      // عند الخروج من وضع التحرير، حفظ التغييرات
      if (tempData.code !== image.code) onTextChange(image.id, "code", tempData.code);
      if (tempData.senderName !== image.senderName) onTextChange(image.id, "senderName", tempData.senderName);
      if (tempData.phoneNumber !== image.phoneNumber) onTextChange(image.id, "phoneNumber", tempData.phoneNumber);
      if (tempData.province !== image.province) onTextChange(image.id, "province", tempData.province);
      if (tempData.price !== image.price) onTextChange(image.id, "price", tempData.price);
      if (tempData.companyName !== image.companyName) onTextChange(image.id, "companyName", tempData.companyName);

      // إذا كان التعلم نشطًا، حفظ التصحيحات
      if (isLearningActive && correctionsMade.length > 0) {
        for (const correction of correctionsMade) {
          // استخدم وظيفة addCorrection بدلاً من saveCorrectionToLearningSystem
          if (image.extractedText) {
            const originalData: Record<string, string> = {};
            const correctedData: Record<string, string> = {};
            
            // تجميع البيانات الأصلية
            originalData[correction.field] = image[correction.field as keyof ImageData] as string || '';
            
            // تجميع البيانات المصححة
            correctedData[correction.field] = correction.value;
            
            // إضافة التصحيح إلى نظام التعلم
            addCorrection(image.extractedText, originalData, correctedData);
          }
        }
        toast({
          title: "تم حفظ التصحيحات",
          description: `تم تطبيق ${correctionsMade.length} تصحيح وحفظها لتحسين الاستخراج المستقبلي.`,
          variant: "default",
        });
      }
    }
    setEditMode(!editMode);
  };

  // إلغاء التغييرات وإعادة تعيين البيانات المؤقتة
  const handleCancel = () => {
    setTempData({
      code: image.code || "",
      senderName: image.senderName || "",
      phoneNumber: image.phoneNumber || "",
      province: image.province || "",
      price: image.price || "",
      companyName: image.companyName || ""
    });
    setCorrectionsMade([]);
    setEditMode(false);
  };

  // نسخ النص المستخرج إلى الحافظة
  const handleCopyText = () => {
    if (image.extractedText) {
      navigator.clipboard.writeText(image.extractedText)
        .then(() => {
          toast({
            title: "تم النسخ",
            description: "تم نسخ النص المستخرج إلى الحافظة",
          });
        })
        .catch(err => {
          console.error("فشل نسخ النص:", err);
          toast({
            title: "فشل النسخ",
            description: "تعذر نسخ النص، يرجى المحاولة مرة أخرى",
            variant: "destructive",
          });
        });
    }
  };

  // استخراج البيانات تلقائيًا من النص المستخرج
  const handleAutoExtract = useCallback(() => {
    if (!image.extractedText) {
      toast({
        title: "لا يوجد نص",
        description: "لا يوجد نص مستخرج للصورة. يرجى التأكد من معالجة الصورة أولاً.",
        variant: "destructive",
      });
      return;
    }

    console.log("جاري استخراج البيانات تلقائيًا من النص:", image.extractedText.substring(0, 100) + "...");
    
    // استخراج البيانات من النص
    const parsedData = parseDataFromOCRText(image.extractedText);
    console.log("البيانات المستخرجة:", parsedData);
    
    // تعيين البيانات المستخرجة
    setTempData({
      code: parsedData.code || tempData.code,
      senderName: parsedData.senderName || tempData.senderName,
      phoneNumber: parsedData.phoneNumber || tempData.phoneNumber,
      province: parsedData.province || tempData.province,
      price: parsedData.price || tempData.price,
      companyName: parsedData.companyName || tempData.companyName
    });
    
    // قم بتطبيق التغييرات فقط إذا كان هناك بيانات جديدة قد استخرجت
    let changesApplied = false;
    
    if (parsedData.code && !image.code) {
      onTextChange(image.id, "code", parsedData.code);
      changesApplied = true;
    }
    
    if (parsedData.senderName && !image.senderName) {
      onTextChange(image.id, "senderName", parsedData.senderName);
      changesApplied = true;
    }
    
    if (parsedData.phoneNumber && !image.phoneNumber) {
      onTextChange(image.id, "phoneNumber", parsedData.phoneNumber);
      changesApplied = true;
    }
    
    if (parsedData.province && !image.province) {
      onTextChange(image.id, "province", parsedData.province);
      changesApplied = true;
    }
    
    if (parsedData.price && !image.price) {
      onTextChange(image.id, "price", parsedData.price);
      changesApplied = true;
    }
    
    if (parsedData.companyName && !image.companyName) {
      onTextChange(image.id, "companyName", parsedData.companyName);
      changesApplied = true;
    }
    
    if (changesApplied) {
      toast({
        title: "تم الاستخراج",
        description: "تم استخراج البيانات من النص بنجاح",
      });
    } else {
      toast({
        title: "لم يتم العثور على بيانات جديدة",
        description: "لم يتم العثور على بيانات إضافية في النص المستخرج",
        variant: "default",
      });
    }
  }, [image.extractedText, image.id, onTextChange, tempData, toast, image.code, image.senderName, image.phoneNumber, image.province, image.price, image.companyName]);

  // تحديث البيانات المؤقتة عند تغيير أي حقل
  const handleTempChange = (field: string, value: string) => {
    setTempData(prev => ({ ...prev, [field]: value }));
    
    // تتبع التصحيحات المقدمة من المستخدم
    if (image.extractedText && value !== image[field as keyof ImageData]) {
      const existingCorrectionIndex = correctionsMade.findIndex(c => c.field === field);
      if (existingCorrectionIndex >= 0) {
        // تحديث تصحيح موجود
        const newCorrections = [...correctionsMade];
        newCorrections[existingCorrectionIndex] = { field, value };
        setCorrectionsMade(newCorrections);
      } else {
        // إضافة تصحيح جديد
        setCorrectionsMade(prev => [...prev, { field, value }]);
      }
    }
  };

  return {
    tempData,
    setTempData,
    correctionsMade,
    isLearningActive,
    handleEditToggle,
    handleCancel,
    handleCopyText,
    handleAutoExtract,
    handleTempChange
  };
};
