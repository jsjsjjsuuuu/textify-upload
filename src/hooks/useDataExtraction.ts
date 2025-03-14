
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { correctProvinceName, IRAQ_PROVINCES, CITY_PROVINCE_MAP } from "@/utils/provinces";
import { handleCorrections, generateCopyText } from "@/utils/correctionHandlers";
import { autoExtractData } from "@/utils/extractionUtils";
import { useToast } from "@/hooks/use-toast";

interface TempData {
  code: string;
  senderName: string;
  phoneNumber: string;
  province: string;
  price: string;
  companyName: string;
  address: string;
  notes: string;
  [key: string]: string; // Add index signature to allow string indexing
}

// Define a type for extracted data from autoExtractData
interface ExtractedData {
  code?: string;
  senderName?: string;
  phoneNumber?: string;
  province?: string;
  price?: string;
  companyName?: string;
  address?: string;
  notes?: string;
  [key: string]: string | undefined;
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
    companyName: image.companyName || "",
    address: image.address || "",
    notes: image.notes || ""
  });
  
  const [correctionsMade, setCorrectionsMade] = useState(false);
  const [isLearningActive, setIsLearningActive] = useState(false);
  const { toast } = useToast();

  const handleEditToggle = () => {
    if (editMode) {
      const originalData: Record<string, string> = {
        code: image.code || "",
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || "",
        companyName: image.companyName || "",
        address: image.address || "",
        notes: image.notes || ""
      };
      
      // التحقق من صحة رقم الهاتف قبل الحفظ
      const phoneDigits = tempData.phoneNumber.replace(/[^\d]/g, '');
      if (tempData.phoneNumber && phoneDigits.length !== 11) {
        toast({
          title: "تنبيه",
          description: "رقم الهاتف يجب أن يكون 11 رقم بالضبط",
          variant: "destructive"
        });
        return; // منع الحفظ في حالة عدم صحة رقم الهاتف
      }
      
      Object.entries(tempData).forEach(([field, value]) => {
        onTextChange(image.id, field, value);
      });
      
      setIsLearningActive(true);
      handleCorrections(image.extractedText, originalData, tempData)
        .then(() => {
          setCorrectionsMade(true);
          setIsLearningActive(false);
        });
    } else {
      setTempData({
        code: image.code || "",
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || "",
        companyName: image.companyName || "",
        address: image.address || "",
        notes: image.notes || ""
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
      companyName: image.companyName || "",
      address: image.address || "",
      notes: image.notes || ""
    });
  };

  const handleCopyText = () => {
    const textToCopy = generateCopyText(image);
    navigator.clipboard.writeText(textToCopy).then(() => {
      console.log("نسخ البيانات إلى الحافظة");
    });
  };

  const handleTempChange = (field: string, value: string) => {
    setTempData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'province' && value) {
        newData.province = correctProvinceName(value);
      }
      
      return newData;
    });
  };

  const handleAutoExtract = () => {
    if (!image.extractedText) return;
    
    const extractedData: ExtractedData = autoExtractData(image.extractedText);

    if (!extractedData.province) {
      for (const province of IRAQ_PROVINCES) {
        if (image.extractedText.includes(province)) {
          extractedData.province = province;
          break;
        }
      }
      
      // Make sure CITY_PROVINCE_MAP is properly typed
      const cityProvinceMap: Record<string, string> = CITY_PROVINCE_MAP || {
        'الموصل': 'نينوى',
        'الرمادي': 'الأنبار',
        'بعقوبة': 'ديالى',
        'السماوة': 'المثنى',
        'الديوانية': 'القادسية',
        'العمارة': 'ميسان',
        'الكوت': 'واسط',
        'تكريت': 'صلاح الدين',
        'الحلة': 'بابل'
      };
      
      for (const [city, province] of Object.entries(cityProvinceMap)) {
        if (image.extractedText.includes(city)) {
          extractedData.province = province;
          break;
        }
      }
    }

    setTempData(prev => ({
      ...prev,
      code: extractedData.code || prev.code,
      senderName: extractedData.senderName || prev.senderName,
      phoneNumber: extractedData.phoneNumber || prev.phoneNumber,
      province: extractedData.province || prev.province,
      price: extractedData.price || prev.price,
      companyName: extractedData.companyName || prev.companyName,
      address: extractedData.address || prev.address,
      notes: extractedData.notes || prev.notes
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
