
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IRAQ_PROVINCES } from "@/utils/provinces";
import { ImageData } from "@/types/ImageData";
import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/gemini/utils";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface ImageDataFormProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}
const ImageDataForm = ({
  image,
  onTextChange
}: ImageDataFormProps) => {
  const {
    toast
  } = useToast();

  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً بالضبط)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;

  // State to manage temporary price value before formatting
  const [priceInput, setPriceInput] = useState(image.price || '');
  const [priceFormatted, setPriceFormatted] = useState(false);
  const [isPriceValid, setIsPriceValid] = useState(true);

  // اذا تغير السعر من الخارج، قم بتحديث حالة الإدخال
  useEffect(() => {
    if (image.price !== priceInput) {
      setPriceInput(image.price || '');
      validatePrice(image.price || '');
    }
  }, [image.price]);

  // التحقق من صحة قيمة السعر
  const validatePrice = (value: string) => {
    // إذا كان السعر فارغًا أو 0 ، فهو صالح
    if (!value || value === '0') {
      setIsPriceValid(true);
      return true;
    }

    // إذا احتوى على أحرف غير رقمية (باستثناء النقطة العشرية)، فهو غير صالح
    if (!/^\d+(\.\d+)?$/.test(value.replace(/[^\d.]/g, ''))) {
      setIsPriceValid(false);
      return false;
    }

    // إذا كان رقمًا أقل من 1000، فهو غير صالح
    const numValue = parseFloat(value.replace(/[^\d.]/g, ''));
    if (numValue > 0 && numValue < 1000) {
      setIsPriceValid(false);
      return false;
    }
    setIsPriceValid(true);
    return true;
  };

  // Handle price change and formatting
  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    setPriceFormatted(false);
    validatePrice(value);
  };

  // Format and save price
  const handleFormatPrice = () => {
    const originalPrice = priceInput;
    const formattedPrice = formatPrice(priceInput);

    // تحقق مما إذا كان التنسيق قد أدى إلى تغيير القيمة فعليًا
    if (formattedPrice !== originalPrice) {
      setPriceInput(formattedPrice);
      onTextChange(image.id, "price", formattedPrice);
      setPriceFormatted(true);
      setIsPriceValid(true);
      toast({
        title: "تم تنسيق السعر",
        description: `تم تحويل "${originalPrice}" إلى "${formattedPrice}"`,
        variant: "default"
      });
    } else {
      toast({
        title: "لم يتم تغيير السعر",
        description: "السعر بالفعل منسق بشكل صحيح",
        variant: "default"
      });
    }
  };

  // Calculate field confidence scores based on overall confidence
  const getFieldConfidence = (field: string): number => {
    if (!image.confidence) return 0;
    const baseConfidence = image.confidence;

    // Adjust confidence based on specific field criteria
    switch (field) {
      case "phoneNumber":
        return isPhoneNumberValid ? baseConfidence : Math.floor(baseConfidence * 0.7);
      case "price":
        return isPriceValid ? baseConfidence : Math.floor(baseConfidence * 0.7);
      default:
        return baseConfidence;
    }
  };
  return <div className="p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 text-center">البيانات المستخرجة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {/* اسم الشركة */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span className="flex items-center">
              اسم الشركة:
              <span className="text-red-500 mr-0.5">*</span>
            </span>
            <span className="text-muted-foreground">{image.confidence}</span>
          </label>
          <Input value={image.companyName || ''} onChange={e => onTextChange(image.id, "companyName", e.target.value)} className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm" placeholder="أدخل اسم الشركة" required />
        </div>
        
        {/* الكود */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span className="flex items-center">
              الكود:
              <span className="text-red-500 mr-0.5">*</span>
            </span>
            <span className="text-muted-foreground">{image.confidence}</span>
          </label>
          <Input value={image.code || ''} onChange={e => onTextChange(image.id, "code", e.target.value)} className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm" placeholder="أدخل الكود" required />
        </div>
        
        {/* اسم المرسل */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span className="flex items-center">
              اسم المرسل:
              <span className="text-red-500 mr-0.5">*</span>
            </span>
            <span className="text-muted-foreground">{image.confidence}</span>
          </label>
          <Input value={image.senderName || ''} onChange={e => onTextChange(image.id, "senderName", e.target.value)} className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm" placeholder="أدخل اسم المرسل" required />
        </div>
        
        {/* رقم الهاتف مع التحقق */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span className="flex items-center">
              رقم الهاتف:
              <span className="text-red-500 mr-0.5">*</span>
            </span>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-muted-foreground">{image.confidence}</span>
              {image.phoneNumber && !isPhoneNumberValid && <span className="text-xs text-destructive font-normal flex items-center">
                  <AlertCircle className="h-3 w-3 ml-1" />
                  خطأ
                </span>}
            </div>
          </label>
          <div className="space-y-1">
            <Input 
              value={image.phoneNumber || ''} 
              onChange={e => onTextChange(image.id, "phoneNumber", e.target.value)} 
              className={`rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm ${image.phoneNumber && !isPhoneNumberValid ? "border-destructive focus-visible:ring-destructive" : ""}`} 
              placeholder="أدخل رقم الهاتف"
              required
            />
            {image.phoneNumber && !isPhoneNumberValid && <p className="text-xs text-destructive">
                يجب أن يكون رقم الهاتف 11 رقم بالضبط
              </p>}
          </div>
        </div>
        
        {/* المحافظة */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span className="flex items-center">
              المحافظة:
              <span className="text-red-500 mr-0.5">*</span>
            </span>
            <span className="text-muted-foreground">{image.confidence}</span>
          </label>
          <Select value={image.province || ''} onValueChange={value => onTextChange(image.id, "province", value)} dir="rtl" required>
            <SelectTrigger className="bg-white dark:bg-gray-900 h-8 text-sm">
              <SelectValue placeholder="اختر المحافظة" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900">
              {IRAQ_PROVINCES.map(province => <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        {/* السعر مع زر التحقق والتنبيهات */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span className="flex items-center">
              السعر:
              <span className="text-red-500 mr-0.5">*</span>
            </span>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-muted-foreground">{image.confidence}</span>
              {priceFormatted && <span className="text-[10px] bg-green-100 text-green-700 flex items-center px-1 rounded">
                  <Check className="h-2.5 w-2.5 ml-0.5" />
                  تم التنسيق
                </span>}
              {!isPriceValid && <span className="text-xs text-destructive font-normal flex items-center">
                  <AlertCircle className="h-3 w-3 ml-1" />
                  غير صالح
                </span>}
            </div>
          </label>
          <div className="flex">
            <Input 
              value={priceInput} 
              onChange={e => handlePriceChange(e.target.value)} 
              className={`rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm rounded-l-none ${!isPriceValid ? "border-destructive focus-visible:ring-destructive" : ""}`} 
              placeholder="أدخل السعر" 
              required
            />
            <Button size="sm" className="h-8 px-2 rounded-r-none" onClick={handleFormatPrice} variant="outline">
              <Check className="h-3.5 w-3.5" />
              <span className="text-[10px] mr-1">تحقق</span>
            </Button>
          </div>
          {!isPriceValid && <p className="text-xs text-destructive">
              {priceInput && parseFloat(priceInput.replace(/[^\d.]/g, '')) < 1000 ? "يجب أن يكون السعر 1000 أو أكبر، اضغط على 'تحقق' للتصحيح" : "صيغة السعر غير صحيحة، اضغط على 'تحقق' للتصحيح"}
            </p>}
          
        </div>
        
        {/* النص المستخرج */}
        {image.extractedText && <div className="col-span-2 mt-1">
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center">
                <span>عرض النص المستخرج كاملاً</span>
                {image.confidence && <span className="mr-2 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px]">
                    دقة الاستخراج: {image.confidence}%
                  </span>}
              </summary>
              <div className="bg-muted/30 p-2 mt-1 rounded-md rtl-textarea text-muted-foreground max-h-24 overflow-y-auto text-xs">
                {image.extractedText}
              </div>
            </details>
          </div>}
      </div>
    </div>;
};
export default ImageDataForm;
