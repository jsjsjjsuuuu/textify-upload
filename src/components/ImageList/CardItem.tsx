
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import DraggableImage from "./DraggableImage";
import ImageDataForm from "./ImageDataForm";
import ActionButtons from "./ActionButtons";
import { AutomationButton } from "@/components/ExtractedData";
import BatchArrow from "./BatchArrow";
import { useEffect } from "react";

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
  isLastInBatch = false
}: CardItemProps) => {
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* صورة العنصر (55% العرض) */}
            <div className="md:col-span-7 border-b md:border-b-0 md:border-l border-border/30 dark:border-gray-700/30">
              <DraggableImage 
                image={image} 
                onImageClick={onImageClick} 
                formatDate={formatDate} 
              />
            </div>
            
            {/* بيانات العنصر (45% العرض) */}
            <div className="md:col-span-5">
              <ImageDataForm 
                image={image} 
                onTextChange={onTextChange} 
              />
            </div>
          </div>
          
          <div className="px-4 pb-4 border-t border-border/30 dark:border-gray-700/30 mt-2">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-auto">
                <AutomationButton image={image} />
              </div>
              <ActionButtons 
                imageId={image.id}
                isSubmitting={isSubmitting}
                isCompleted={image.status === "completed"}
                isSubmitted={!!image.submitted}
                isPhoneNumberValid={isPhoneNumberValid}
                onDelete={onDelete}
                onSubmit={onSubmit}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CardItem;
