
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import DraggableImage from "./DraggableImage";
import ImageDataForm from "./ImageDataForm";
import ActionButtons from "./ActionButtons";
import { AutomationButton } from "@/components/ExtractedData";
import BatchArrow from "./BatchArrow";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  onReprocess?: (id: string) => Promise<void>;
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
  onReprocess
}: CardItemProps) => {
  const [isReprocessing, setIsReprocessing] = useState(false);
  
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
  
  // معالج إعادة المعالجة
  const handleReprocess = async () => {
    if (onReprocess) {
      try {
        setIsReprocessing(true);
        await onReprocess(image.id);
      } catch (error) {
        console.error("خطأ في إعادة معالجة الصورة:", error);
      } finally {
        setIsReprocessing(false);
      }
    }
  };
  
  // مراقبة البيانات والتأكد من عنوان URL للصورة
  useEffect(() => {
    console.log(`عرض بطاقة الصورة ${image.id} مع عنوان: ${image.previewUrl}`);
  }, [image.id, image.previewUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto relative"
    >
      {showBatchArrow && (
        <BatchArrow isFirst={isFirstInBatch} isLast={isLastInBatch} />
      )}
      
      <Card className="overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow border-border/60 dark:border-gray-700/60 rounded-xl">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* صورة الوصل */}
            <div className="md:w-72 lg:w-80 xl:w-96 shrink-0 relative">
              <DraggableImage 
                image={image} 
                onImageClick={() => onImageClick(image)}
              />
              
              {/* زر إعادة المعالجة */}
              {onReprocess && (
                <div className="absolute top-2 left-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-xs h-7 px-2"
                    onClick={handleReprocess}
                    disabled={isReprocessing}
                  >
                    <RefreshCw className={`h-3 w-3 ${isReprocessing ? 'animate-spin' : ''} ml-1`} />
                    {isReprocessing ? 'جاري المعالجة...' : 'إعادة معالجة'}
                  </Button>
                </div>
              )}
              
              {/* تصنيف نوع الاستخراج */}
              <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px]">
                {image.extractionMethod === "gemini" ? "Gemini AI" : image.extractionMethod === "ocr" ? "OCR" : "غير معروف"}
              </div>
            </div>
            
            {/* نموذج البيانات المستخرجة */}
            <div className="flex-1 overflow-hidden">
              <ImageDataForm 
                image={image}
                onTextChange={onTextChange}
              />
              
              {/* أزرار الإجراءات (حذف، إرسال) */}
              <div className="px-4 pb-4">
                <ActionButtons
                  imageId={image.id}
                  isSubmitting={isSubmitting}
                  isCompleted={image.status === "completed"}
                  isSubmitted={!!image.submitted}
                  isPhoneNumberValid={isPhoneNumberValid}
                  isAllFieldsFilled={isAllFieldsFilled}
                  onDelete={onDelete}
                  onSubmit={onSubmit}
                />
                
                {/* أزرار الأتمتة والوصول السريع */}
                {image.code && (
                  <div className="mt-2">
                    <AutomationButton 
                      imageId={image.id}
                      code={image.code}
                      senderName={image.senderName || ""}
                      phoneNumber={image.phoneNumber || ""}
                      province={image.province || ""}
                      price={image.price || ""}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CardItem;
