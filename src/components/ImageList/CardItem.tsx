
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ImageData } from '@/types/ImageData';
import ImageDataForm from './ImageDataForm';
import ImageViewer from '../ImagePreview/ImageViewer';
import ImageActions from '../ImagePreview/ImageActions';
import AutofillStatus from '../AutofillStatus';

interface CardItemProps {
  image: ImageData;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  isSubmitting: boolean;
  formatDate: (date: Date) => string;
}

const CardItem = ({
  image,
  onImageClick,
  onTextChange,
  onDelete,
  onSubmit,
  isSubmitting,
  formatDate
}: CardItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      layout
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ImageViewer 
            image={image} 
            onImageClick={() => onImageClick(image)} 
            showZoom={isHovered}
          />
        </div>
        <div className="flex flex-col">
          <div className="flex-grow">
            <ImageDataForm
              image={image}
              onTextChange={onTextChange}
            />
            
            {/* إضافة مكون حالة الإدخال التلقائي */}
            <AnimatePresence>
              {image.autoFillResult && image.autoFillResult.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AutofillStatus image={image} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <ImageActions
            imageId={image.id}
            isSubmitting={isSubmitting}
            isSubmitted={!!image.submitted}
            isCompleted={image.status === "completed"}
            onDelete={onDelete}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default CardItem;
