
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import DraggableImage from "./DraggableImage";
import ImageDataForm from "./ImageDataForm";
import ActionButtons from "./ActionButtons";

interface CardItemProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const CardItem = ({ 
  image, 
  isSubmitting, 
  onImageClick, 
  onTextChange, 
  onDelete, 
  onSubmit, 
  formatDate 
}: CardItemProps) => {
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
            <DraggableImage 
              image={image} 
              onImageClick={onImageClick} 
              formatDate={formatDate} 
            />
            
            {/* بيانات العنصر (2/3 العرض) */}
            <ImageDataForm 
              image={image} 
              onTextChange={onTextChange} 
            />
          </div>
          
          <div className="px-6 pb-6">
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
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CardItem;
