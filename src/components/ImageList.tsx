
import { ImageData } from "@/types/ImageData";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash, Send, ZoomIn } from "lucide-react";
import { IRAQ_PROVINCES } from "@/utils/provinces";
import { motion } from "framer-motion";

interface ImageListProps {
  images: ImageData[];
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImageList = ({
  images,
  isSubmitting,
  onImageClick,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate
}: ImageListProps) => {
  if (images.length === 0) return null;

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <h2 className="text-2xl font-bold text-brand-brown mb-4">معاينة الصور والنصوص المستخرجة</h2>
      
      <div className="space-y-6">
        {images.map(image => (
          <CardItem 
            key={image.id}
            image={image}
            isSubmitting={isSubmitting}
            onImageClick={onImageClick}
            onTextChange={onTextChange}
            onDelete={onDelete}
            onSubmit={onSubmit}
            formatDate={formatDate}
          />
        ))}
      </div>
    </section>
  );
};

const CardItem = ({ 
  image, 
  isSubmitting, 
  onImageClick, 
  onTextChange, 
  onDelete, 
  onSubmit, 
  formatDate 
}: {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}) => {
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-white/95 dark:bg-gray-800/95 shadow-lg hover:shadow-xl transition-shadow border-brand-beige dark:border-gray-700">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {/* صورة العنصر (1/3 العرض) */}
            <div className="p-4 bg-secondary/20 relative">
              <div 
                className="relative w-full h-[280px] rounded-lg overflow-hidden bg-transparent group cursor-pointer" 
                onClick={() => onImageClick(image)}
              >
                <img 
                  src={image.previewUrl} 
                  alt="صورة محملة" 
                  className="w-full h-full object-contain" 
                  style={{ mixBlendMode: 'multiply' }} 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/90 p-1 rounded-full">
                    <ZoomIn size={20} className="text-brand-brown" />
                  </div>
                </div>
                
                <div className="absolute top-1 left-1 bg-brand-brown text-white px-2 py-1 rounded-full text-xs">
                  صورة {image.number}
                </div>
                
                {image.status === "processing" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    <span className="text-xs">جاري المعالجة...</span>
                  </div>
                )}
                
                {image.status === "completed" && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                )}
                
                {image.status === "error" && (
                  <div className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </div>
                )}
                
                {image.submitted && (
                  <div className="absolute bottom-1 right-1 bg-brand-green text-white px-1.5 py-0.5 rounded-md text-[10px]">
                    تم الإرسال
                  </div>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground mt-2 text-center">
                {formatDate(image.date)}
              </div>
              
              {image.confidence !== undefined && (
                <div className="mt-2 text-center">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    دقة الاستخراج: {Math.round(image.confidence)}%
                  </span>
                </div>
              )}
            </div>
            
            {/* بيانات العنصر (2/3 العرض) */}
            <div className="md:col-span-2 p-6">
              <h3 className="text-lg font-semibold text-brand-brown dark:text-brand-beige mb-4">البيانات المستخرجة</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* اسم الشركة */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">اسم الشركة:</label>
                  <Input 
                    value={image.companyName || ''} 
                    onChange={e => onTextChange(image.id, "companyName", e.target.value)} 
                    className="rtl-textarea bg-white dark:bg-gray-900"
                    placeholder="أدخل اسم الشركة"
                  />
                </div>
                
                {/* الكود */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">الكود:</label>
                  <Input 
                    value={image.code || ''} 
                    onChange={e => onTextChange(image.id, "code", e.target.value)} 
                    className="rtl-textarea bg-white dark:bg-gray-900"
                    placeholder="أدخل الكود"
                  />
                </div>
                
                {/* اسم المرسل */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">اسم المرسل:</label>
                  <Input 
                    value={image.senderName || ''} 
                    onChange={e => onTextChange(image.id, "senderName", e.target.value)} 
                    className="rtl-textarea bg-white dark:bg-gray-900"
                    placeholder="أدخل اسم المرسل"
                  />
                </div>
                
                {/* رقم الهاتف مع التحقق */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium flex items-center justify-between">
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
                      className={`rtl-textarea bg-white dark:bg-gray-900 ${image.phoneNumber && !isPhoneNumberValid ? "border-destructive" : ""}`}
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium">المحافظة:</label>
                  <Select
                    value={image.province || ''}
                    onValueChange={value => onTextChange(image.id, "province", value)}
                    dir="rtl"
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-900">
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium">السعر:</label>
                  <Input 
                    value={image.price || ''} 
                    onChange={e => onTextChange(image.id, "price", e.target.value)} 
                    className="rtl-textarea bg-white dark:bg-gray-900"
                    placeholder="أدخل السعر"
                  />
                </div>
                
                {/* النص المستخرج */}
                {image.extractedText && (
                  <div className="col-span-2 mt-2">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors py-1">
                        عرض النص المستخرج كاملاً
                      </summary>
                      <div className="bg-muted/30 p-2 mt-1 rounded-md rtl-textarea text-muted-foreground max-h-32 overflow-y-auto">
                        {image.extractedText}
                      </div>
                    </details>
                  </div>
                )}
              </div>
              
              {/* أزرار الإجراءات */}
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDelete(image.id)} 
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash size={16} className="ml-1" />
                  حذف
                </Button>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-brand-green hover:bg-brand-green/90" 
                  disabled={image.status !== "completed" || isSubmitting || image.submitted || (image.phoneNumber && !isPhoneNumberValid)} 
                  onClick={() => onSubmit(image.id)}
                >
                  <Send size={16} className="ml-1" />
                  {isSubmitting ? "جاري الإرسال..." : "إرسال البيانات"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ImageList;
