
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IRAQ_PROVINCES } from "@/utils/provinces";
import { ImageData } from "@/types/ImageData";
import { useState } from "react";
import { formatPrice } from "@/utils/imageDataParser";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ImageDataFormProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ImageDataForm = ({ image, onTextChange }: ImageDataFormProps) => {
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
  // State to manage temporary price value before formatting
  const [priceInput, setPriceInput] = useState(image.price || '');
  const [priceFormatted, setPriceFormatted] = useState(false);
  
  // Handle price change and formatting
  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    setPriceFormatted(false);
  };
  
  // Format and save price
  const handleFormatPrice = () => {
    const formattedPrice = formatPrice(priceInput);
    if (formattedPrice !== priceInput) {
      setPriceInput(formattedPrice);
      onTextChange(image.id, "price", formattedPrice);
      setPriceFormatted(true);
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
        return priceFormatted ? baseConfidence : Math.floor(baseConfidence * 0.8);
      default:
        return baseConfidence;
    }
  };
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-brand-brown dark:text-brand-beige mb-3">البيانات المستخرجة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* اسم الشركة */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span>اسم الشركة:</span>
            {image.confidence && (
              <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
                {getFieldConfidence("companyName")}%
              </span>
            )}
          </label>
          <Input 
            value={image.companyName || ''} 
            onChange={e => onTextChange(image.id, "companyName", e.target.value)} 
            className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm"
            placeholder="أدخل اسم الشركة"
          />
        </div>
        
        {/* الكود */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span>الكود:</span>
            {image.confidence && (
              <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
                {getFieldConfidence("code")}%
              </span>
            )}
          </label>
          <Input 
            value={image.code || ''} 
            onChange={e => onTextChange(image.id, "code", e.target.value)} 
            className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm"
            placeholder="أدخل الكود"
          />
        </div>
        
        {/* اسم المرسل */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span>اسم المرسل:</span>
            {image.confidence && (
              <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
                {getFieldConfidence("senderName")}%
              </span>
            )}
          </label>
          <Input 
            value={image.senderName || ''} 
            onChange={e => onTextChange(image.id, "senderName", e.target.value)} 
            className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm"
            placeholder="أدخل اسم المرسل"
          />
        </div>
        
        {/* رقم الهاتف مع التحقق */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span>رقم الهاتف:</span>
            <div className="flex items-center space-x-2 space-x-reverse">
              {image.confidence && (
                <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
                  {getFieldConfidence("phoneNumber")}%
                </span>
              )}
              {image.phoneNumber && !isPhoneNumberValid && (
                <span className="text-xs text-destructive font-normal flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  خطأ
                </span>
              )}
            </div>
          </label>
          <div className="space-y-1">
            <Input 
              value={image.phoneNumber || ''} 
              onChange={e => onTextChange(image.id, "phoneNumber", e.target.value)} 
              className={`rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm ${image.phoneNumber && !isPhoneNumberValid ? "border-destructive" : ""}`}
              placeholder="أدخل رقم الهاتف"
            />
            {image.phoneNumber && !isPhoneNumberValid && (
              <p className="text-xs text-destructive">
                يجب أن يكون رقم الهاتف 11 رقم بالضبط
              </p>
            )}
          </div>
        </div>
        
        {/* المحافظة */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span>المحافظة:</span>
            {image.confidence && (
              <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
                {getFieldConfidence("province")}%
              </span>
            )}
          </label>
          <Select
            value={image.province || ''}
            onValueChange={value => onTextChange(image.id, "province", value)}
            dir="rtl"
          >
            <SelectTrigger className="bg-white dark:bg-gray-900 h-8 text-sm">
              <SelectValue placeholder="اختر المحافظة" />
            </SelectTrigger>
            <SelectContent>
              {IRAQ_PROVINCES.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* السعر مع زر التحقق */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex justify-between">
            <span>السعر:</span>
            <div className="flex items-center space-x-2 space-x-reverse">
              {image.confidence && (
                <span className="text-[10px] bg-brand-green/10 text-brand-green px-1 rounded">
                  {getFieldConfidence("price")}%
                </span>
              )}
              {priceFormatted && (
                <span className="text-[10px] bg-green-100 text-green-700 flex items-center px-1 rounded">
                  <Check className="h-2.5 w-2.5 mr-0.5" />
                  تم التنسيق
                </span>
              )}
            </div>
          </label>
          <div className="flex">
            <Input 
              value={priceInput} 
              onChange={e => handlePriceChange(e.target.value)} 
              className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm rounded-l-none"
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
          <p className="text-[10px] text-muted-foreground">
            ملاحظة: سيتم ضرب السعر × 1000 إذا كان رقمًا بسيطًا. السعر "مجاني" أو "توصيل" سيتم تعيينه إلى 0.
          </p>
        </div>
        
        {/* النص المستخرج */}
        {image.extractedText && (
          <div className="col-span-2 mt-1">
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center">
                <span>عرض النص المستخرج كاملاً</span>
                {image.confidence && (
                  <span className="mr-2 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px]">
                    دقة الاستخراج: {image.confidence}%
                  </span>
                )}
              </summary>
              <div className="bg-muted/30 p-2 mt-1 rounded-md rtl-textarea text-muted-foreground max-h-24 overflow-y-auto text-xs">
                {image.extractedText}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDataForm;
