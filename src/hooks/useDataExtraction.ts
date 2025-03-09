
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { addCorrection } from "@/utils/learningSystem";

interface TempData {
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
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
    price: image.price || ""
  });
  
  const [correctionsMade, setCorrectionsMade] = useState(false);
  const [isLearningActive, setIsLearningActive] = useState(false);

  const handleEditToggle = () => {
    if (editMode) {
      // حفظ التغييرات وإضافتها إلى نظام التعلم إذا تم تغيير البيانات
      const originalData = {
        code: image.code || "",
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || ""
      };
      
      // حفظ التغييرات
      Object.entries(tempData).forEach(([field, value]) => {
        onTextChange(image.id, field, value);
      });
      
      // التحقق من وجود تغييرات
      let changesDetected = false;
      for (const [field, value] of Object.entries(tempData)) {
        if (originalData[field as keyof typeof originalData] !== value) {
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
        price: image.price || ""
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
      price: image.price || ""
    });
  };

  const handleCopyText = () => {
    const textToCopy = `الكود: ${image.code || "غير متوفر"}
اسم المرسل: ${image.senderName || "غير متوفر"}
رقم الهاتف: ${image.phoneNumber || "غير متوفر"}
المحافظة: ${image.province || "غير متوفر"}
السعر: ${image.price || "غير متوفر"}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      console.log("نسخ البيانات إلى الحافظة");
    });
  };

  const handleTempChange = (field: string, value: string) => {
    setTempData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Extract known fields from text based on patterns
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
    
    const extractedData = {
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

    // Update temp data with extracted values
    setTempData(prev => ({
      ...prev,
      ...extractedData
    }));

    // If in normal mode, apply changes directly
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
