
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { addCorrection } from "@/utils/learningSystem";
import { correctProvinceName } from "@/utils/provinceCorrection";

interface TempData {
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  companyName: string;
  [key: string]: string; // Add index signature to allow string indexing
}

export const useDataExtraction = (
  image: ImageData, 
  onTextChange: (id: string, field: string, value: string) => void,
  editMode: boolean,
  setEditMode: (value: boolean) => void
) => {
  const [tempData, setTempData] = useState<TempData>({
    code: image.code || "",
    senderName: image.senderName || "",
    phoneNumber: image.phoneNumber || "",
    province: image.province || "",
    price: image.price || "",
    companyName: image.companyName || ""
  });
  
  const [correctionsMade, setCorrectionsMade] = useState(false);
  const [isLearningActive, setIsLearningActive] = useState(false);

  const handleEditToggle = () => {
    if (editMode) {
      // حفظ التغييرات وإضافتها إلى نظام التعلم إذا تم تغيير البيانات
      const originalData: Record<string, string> = {
        code: image.code || "",
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || "",
        companyName: image.companyName || ""
      };
      
      // حفظ التغييرات
      Object.entries(tempData).forEach(([field, value]) => {
        onTextChange(image.id, field, value);
      });
      
      // التحقق من وجود تغييرات
      let changesDetected = false;
      for (const [field, value] of Object.entries(tempData)) {
        if (originalData[field] !== value) {
          changesDetected = true;
          break;
        }
      }
      
      // إذا كانت هناك تغييرات، أضف إلى نظام التعلم
      if (changesDetected && image.extractedText) {
        setIsLearningActive(true);
        // تأخير إظهار مؤشر التعلم
        setTimeout(() => {
          addCorrection(
            image.extractedText,
            originalData,
            tempData
          );
          setCorrectionsMade(true);
          setIsLearningActive(false);
        }, 800);
      }
    } else {
      // الدخول إلى وضع التحرير
      setTempData({
        code: image.code || "",
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || "",
        companyName: image.companyName || ""
      });
    }
    setEditMode(!editMode);
  };

  const handleCancel = () => {
    setEditMode(false);
    setTempData({
      code: image.code || "",
      senderName: image.senderName || "",
      phoneNumber: image.phoneNumber || "",
      province: image.province || "",
      price: image.price || "",
      companyName: image.companyName || ""
    });
  };

  const handleCopyText = () => {
    const textToCopy = `اسم الشركة: ${image.companyName || "غير متوفر"}
الكود: ${image.code || "غير متوفر"}
اسم المرسل: ${image.senderName || "غير متوفر"}
رقم الهاتف: ${image.phoneNumber || "غير متوفر"}
المحافظة: ${image.province || "غير متوفر"}
السعر: ${image.price || "غير متوفر"}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      console.log("نسخ البيانات إلى الحافظة");
    });
  };

  const handleTempChange = (field: string, value: string) => {
    setTempData(prev => {
      const newData = { ...prev, [field]: value };
      
      // تصحيح اسم المحافظة إذا تم تغييره
      if (field === 'province') {
        newData.province = correctProvinceName(value);
      }
      
      return newData;
    });
  };

  const tryExtractField = (text: string, patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "";
  };

  const handleAutoExtract = () => {
    if (!image.extractedText) return;
    
    // استخراج اسم الشركة (يكون عادة في أعلى اليسار بخط كبير)
    const companyNamePatterns = [
      // البحث عن نص في بداية النص المستخرج (يكون غالبًا في الأعلى)
      /^([^:\n\r]+?)(?:\n|\r|$)/i,
      // البحث عن "شركة" أو "مؤسسة" أو "مجموعة"
      /شركة\s+(.+?)(?:\n|\r|$)/i,
      /مؤسسة\s+(.+?)(?:\n|\r|$)/i,
      /مجموعة\s+(.+?)(?:\n|\r|$)/i,
      // البحث عن "company" باللغة الإنجليزية
      /company[:\s]+(.+?)(?:\n|\r|$)/i
    ];
    
    const extractedData = {
      companyName: tryExtractField(image.extractedText, companyNamePatterns),
      code: tryExtractField(image.extractedText, [
        /كود[:\s]+([0-9]+)/i, 
        /code[:\s]+([0-9]+)/i, 
        /رقم[:\s]+([0-9]+)/i,
        /رمز[:\s]+([0-9]+)/i
      ]),
      senderName: tryExtractField(image.extractedText, [
        /اسم المرسل[:\s]+(.+?)(?:\n|\r|$)/i, 
        /sender[:\s]+(.+?)(?:\n|\r|$)/i, 
        /الاسم[:\s]+(.+?)(?:\n|\r|$)/i,
        /الراسل[:\s]+(.+?)(?:\n|\r|$)/i
      ]),
      phoneNumber: tryExtractField(image.extractedText, [
        /هاتف[:\s]+([0-9\-\s]+)/i, 
        /phone[:\s]+([0-9\-\s]+)/i, 
        /جوال[:\s]+([0-9\-\s]+)/i, 
        /رقم الهاتف[:\s]+([0-9\-\s]+)/i,
        /رقم[:\s]+([0-9\-\s]+)/i
      ]),
      province: tryExtractField(image.extractedText, [
        /محافظة[:\s]+(.+?)(?:\n|\r|$)/i, 
        /province[:\s]+(.+?)(?:\n|\r|$)/i, 
        /المدينة[:\s]+(.+?)(?:\n|\r|$)/i,
        /المنطقة[:\s]+(.+?)(?:\n|\r|$)/i
      ]),
      price: tryExtractField(image.extractedText, [
        /سعر[:\s]+(.+?)(?:\n|\r|$)/i, 
        /price[:\s]+(.+?)(?:\n|\r|$)/i, 
        /المبلغ[:\s]+(.+?)(?:\n|\r|$)/i,
        /قيمة[:\s]+(.+?)(?:\n|\r|$)/i
      ])
    };

    // تصحيح اسم المحافظة
    if (extractedData.province) {
      extractedData.province = correctProvinceName(extractedData.province);
    }

    setTempData(prev => ({
      ...prev,
      ...extractedData
    }));

    if (!editMode) {
      Object.entries(extractedData).forEach(([field, value]) => {
        if (value) onTextChange(image.id, field, value);
      });
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
