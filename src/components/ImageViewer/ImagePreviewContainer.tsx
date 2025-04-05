
import React, { useState, useMemo } from 'react';
import { ImageData } from '@/types/ImageData';
import ImageCard from './ImageCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { getNextApiKey } from '@/lib/gemini/apiKeyManager';
import WelcomeScreen from '@/components/WelcomeScreen';

interface ImagePreviewContainerProps {
  images: ImageData[];
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showOnlySession?: boolean;
}

const ImagePreviewContainer: React.FC<ImagePreviewContainerProps> = ({
  images,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showOnlySession = false
}) => {
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);

  // فلترة الصور لعرض فقط تلك التي في الجلسة الحالية
  const displayImages = useMemo(() => {
    if (showOnlySession) {
      return images.filter(image => image.sessionImage === true);
    }
    return images;
  }, [images, showOnlySession]);

  // التحقق من وجود أخطاء مفتاح API في أي من الصور
  const apiKeyErrors = useMemo(() => {
    return displayImages.some(image => image.apiKeyError === true);
  }, [displayImages]);

  // التحقق من حالة المفتاح الحالي
  const isValidApiKey = useMemo(() => {
    const apiKey = getNextApiKey();
    return apiKey && apiKey.length > 10;
  }, []);

  return (
    <>
      {showApiKeyManager && (
        <WelcomeScreen onClose={() => setShowApiKeyManager(false)} />
      )}

      {apiKeyErrors && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/40">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-600 dark:text-red-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                تم اكتشاف مشاكل في مفتاح API. بعض الصور لم يتم معالجتها بشكل صحيح بسبب مشاكل في مفتاح API.
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/40"
                onClick={() => setShowApiKeyManager(true)}
              >
                إدارة مفتاح API
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {displayImages.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">لا توجد صور لعرضها</p>
        </div>
      )}

      <ScrollArea className="h-full w-full pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              isSubmitting={isSubmitting}
              onTextChange={onTextChange}
              onDelete={onDelete}
              onSubmit={onSubmit}
              formatDate={formatDate}
            />
          ))}
        </div>
      </ScrollArea>
    </>
  );
};

export default ImagePreviewContainer;
