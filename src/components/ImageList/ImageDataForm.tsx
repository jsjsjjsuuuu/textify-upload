
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IRAQ_PROVINCES } from "@/utils/provinces";
import { ImageData } from "@/types/ImageData";

interface ImageDataFormProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
}

const ImageDataForm = ({ image, onTextChange }: ImageDataFormProps) => {
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-brand-brown dark:text-brand-beige mb-3">البيانات المستخرجة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* اسم الشركة */}
        <div className="space-y-1">
          <label className="block text-xs font-medium">اسم الشركة:</label>
          <Input 
            value={image.companyName || ''} 
            onChange={e => onTextChange(image.id, "companyName", e.target.value)} 
            className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm"
            placeholder="أدخل اسم الشركة"
          />
        </div>
        
        {/* الكود */}
        <div className="space-y-1">
          <label className="block text-xs font-medium">الكود:</label>
          <Input 
            value={image.code || ''} 
            onChange={e => onTextChange(image.id, "code", e.target.value)} 
            className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm"
            placeholder="أدخل الكود"
          />
        </div>
        
        {/* اسم المرسل */}
        <div className="space-y-1">
          <label className="block text-xs font-medium">اسم المرسل:</label>
          <Input 
            value={image.senderName || ''} 
            onChange={e => onTextChange(image.id, "senderName", e.target.value)} 
            className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm"
            placeholder="أدخل اسم المرسل"
          />
        </div>
        
        {/* رقم الهاتف مع التحقق */}
        <div className="space-y-1">
          <label className="block text-xs font-medium flex items-center justify-between">
            <span>رقم الهاتف:</span>
            {image.phoneNumber && !isPhoneNumberValid && (
              <span className="text-xs text-destructive font-normal flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                رقم غير صحيح
              </span>
            )}
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
          <label className="block text-xs font-medium">المحافظة:</label>
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
        
        {/* السعر */}
        <div className="space-y-1">
          <label className="block text-xs font-medium">السعر:</label>
          <Input 
            value={image.price || ''} 
            onChange={e => onTextChange(image.id, "price", e.target.value)} 
            className="rtl-textarea bg-white dark:bg-gray-900 h-8 text-sm"
            placeholder="أدخل السعر"
          />
        </div>
        
        {/* النص المستخرج */}
        {image.extractedText && (
          <div className="col-span-2 mt-1">
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors py-1">
                عرض النص المستخرج كاملاً
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
