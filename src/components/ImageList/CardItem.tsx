
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import DraggableImage from "./DraggableImage";
import ImageDataForm from "./ImageDataForm";
import ActionButtons from "./ActionButtons";
import BatchArrow from "./BatchArrow";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface CardItemProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showBatchArrow?: boolean;
  isFirstInBatch?: boolean;
  isLastInBatch?: boolean;
  compact?: boolean; // إضافة خاصية compact
}

const CardItem = ({ 
  image, 
  isSubmitting, 
  onImageClick, 
  onTextChange, 
  onDelete, 
  onSubmit, 
  formatDate,
  showBatchArrow = false,
  isFirstInBatch = false,
  isLastInBatch = false,
  compact = false // القيمة الافتراضية
}: CardItemProps) => {
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
  // التحقق من اكتمال جميع الحقول المطلوبة
  const isAllFieldsFilled = useMemo(() => {
    return !!(
      image.code && 
      image.senderName && 
      image.phoneNumber && 
      image.province && 
      image.price && 
      isPhoneNumberValid
    );
  }, [image.code, image.senderName, image.phoneNumber, image.province, image.price, isPhoneNumberValid]);
  
  // مراقبة البيانات والتأكد من عنوان URL للصورة
  useEffect(() => {
    console.log(`عرض بطاقة الصورة ${image.id} مع عنوان: ${image.previewUrl}`);
  }, [image.id, image.previewUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "max-w-5xl mx-auto relative", 
        compact && "text-sm" // تصغير حجم النص للعرض المصغر
      )}
    >
      {showBatchArrow && (
        <BatchArrow isFirst={isFirstInBatch} isLast={isLastInBatch} />
      )}
      
      <Card className={cn(
        "overflow-hidden bg-[#0a0f1e]/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow border-border/60 rounded-xl",
        compact && "px-2 py-1" // تقليل الهوامش للعرض المصغر
      )}>
        <CardContent className="p-0">
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-12 gap-0",
            compact && "grid-cols-1" // تبسيط الشبكة للعرض المصغر
          )}>
            {/* صورة العنصر */}
            <div className={cn(
              "md:col-span-7 border-b md:border-b-0 md:border-l border-border/30",
              compact && "md:col-span-12" // العرض الكامل في التصميم المصغر
            )}>
              <DraggableImage 
                image={image} 
                onImageClick={onImageClick} 
                formatDate={formatDate}
                compact={compact} // تمرير خاصية compact
              />
            </div>
            
            {/* بيانات العنصر */}
            {!compact && (
              <div className="md:col-span-5">
                <ImageDataForm 
                  image={image} 
                  onTextChange={onTextChange} 
                />
              </div>
            )}
          </div>
          
          <div className={cn(
            "px-4 pb-4 border-t border-border/30 mt-2",
            compact && "px-2 pb-2 mt-1" // تقليل الهوامش للعرض المصغر
          )}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <ActionButtons 
                imageId={image.id}
                isSubmitting={isSubmitting}
                isCompleted={image.status === "completed"}
                isSubmitted={!!image.submitted}
                isPhoneNumberValid={isPhoneNumberValid}
                isAllFieldsFilled={isAllFieldsFilled}
                onDelete={onDelete}
                onSubmit={onSubmit}
                compact={compact} // إضافة خاصية compact للأزرار
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CardItem;
