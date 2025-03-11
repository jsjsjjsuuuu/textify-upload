
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { formatPrice } from "@/lib/gemini/utils";
import { useToast } from "@/hooks/use-toast";

interface PriceFieldProps {
  image: ImageData;
  confidence: number;
  onTextChange: (id: string, field: string, value: string) => void;
}

const PriceField = ({ image, confidence, onTextChange }: PriceFieldProps) => {
  const { toast } = useToast();
  
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
  
  // تعديل القيمة حسب صحة السعر
  const adjustedConfidence = isPriceValid ? confidence : Math.floor(confidence * 0.7);
  
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

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium flex justify-between">
        <span>السعر:</span>
        <div className="flex items-center space-x-2 space-x-reverse">
          {confidence && (
            <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
              {adjustedConfidence}%
            </span>
          )}
          {priceFormatted && (
            <span className="text-[10px] bg-green-100 text-green-700 flex items-center px-1 rounded">
              <Check className="h-2.5 w-2.5 ml-0.5" />
              تم التنسيق
            </span>
          )}
          {!isPriceValid && (
            <span className="text-xs text-destructive font-normal flex items-center">
              <AlertCircle className="h-3 w-3 ml-1" />
              غير صالح
            </span>
          )}
        </div>
      </label>
      <div className="flex">
        <Input 
          value={priceInput} 
          onChange={e => handlePriceChange(e.target.value)} 
          className={`rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm rounded-l-none ${!isPriceValid ? "border-destructive" : ""}`}
          placeholder="أدخل السعر"
        />
        <Button 
          size="sm" 
          className="h-8 px-2 rounded-r-none"
          onClick={handleFormatPrice}
          variant="outline"
        >
          <Check className="h-3.5 w-3.5" />
          <span className="text-[10px] mr-1">تحقق</span>
        </Button>
      </div>
      {!isPriceValid && (
        <p className="text-xs text-destructive">
          {priceInput && parseFloat(priceInput.replace(/[^\d.]/g, '')) < 1000 ? 
            "يجب أن يكون السعر 1000 أو أكبر، اضغط على 'تحقق' للتصحيح" : 
            "صيغة السعر غير صحيحة، اضغط على 'تحقق' للتصحيح"}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        ملاحظة: سيتم ضرب السعر × 1000 إذا كان رقمًا بسيطًا. السعر "مجاني" أو "توصيل" أو "واصل" سيتم تعيينه إلى 0.
      </p>
    </div>
  );
};

export default PriceField;
