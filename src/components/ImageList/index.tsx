
import { ImageData } from "@/types/ImageData";
import CardItem from "./CardItem";
import { motion } from "framer-motion";
import { Fragment, useEffect } from "react";

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
  
  // تجميع الصور حسب batch_id
  const groupedImages: { [key: string]: ImageData[] } = {};
  
  images.forEach(image => {
    const batchId = image.batch_id || 'default';
    if (!groupedImages[batchId]) {
      groupedImages[batchId] = [];
    }
    groupedImages[batchId].push(image);
  });
  
  // ترتيب المجموعات حسب التاريخ (الأحدث أولاً)
  const sortedBatchIds = Object.keys(groupedImages).sort((a, b) => {
    // التأكد من وجود عناصر في المصفوفات قبل الوصول إليها
    if (groupedImages[a].length === 0 || groupedImages[b].length === 0) {
      return 0;
    }
    const dateA = groupedImages[a][0].date.getTime();
    const dateB = groupedImages[b][0].date.getTime();
    return dateB - dateA;
  });
  
  // طباعة معلومات التصحيح
  useEffect(() => {
    console.log('Grouped Images:', groupedImages);
    console.log('Batch IDs:', sortedBatchIds);
    sortedBatchIds.forEach(batchId => {
      console.log(`Batch ${batchId} has ${groupedImages[batchId].length} images`);
    });
  }, [images]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        معاينة الصور والنصوص المستخرجة
      </h2>
      
      <div className="space-y-12"> {/* زيادة المسافة بين المجموعات لجعل الخط أكثر وضوحًا */}
        {sortedBatchIds.map(batchId => {
          const batchImages = groupedImages[batchId];
          const hasManyImages = batchImages.length > 1;
          
          return (
            <Fragment key={batchId}>
              <div className="space-y-6"> {/* مساحة بين العناصر داخل المجموعة الواحدة */}
                {batchImages.map((image, index) => (
                  <CardItem 
                    key={image.id} 
                    image={image} 
                    isSubmitting={isSubmitting} 
                    onImageClick={onImageClick} 
                    onTextChange={onTextChange} 
                    onDelete={onDelete} 
                    onSubmit={onSubmit} 
                    formatDate={formatDate}
                    showBatchArrow={hasManyImages}
                    isFirstInBatch={index === 0}
                    isLastInBatch={index === batchImages.length - 1}
                  />
                ))}
              </div>
              
              {/* إضافة فاصل بين المجموعات */}
              {batchId !== sortedBatchIds[sortedBatchIds.length - 1] && (
                <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>
              )}
            </Fragment>
          );
        })}
      </div>
    </motion.section>
  );
};

export default ImageList;
