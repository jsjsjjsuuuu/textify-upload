
import React from 'react';
import ImageUploader from '@/components/ImageUploader';
import ImageList from '@/components/ImageList';
import BackgroundPattern from '@/components/BackgroundPattern';
import { motion } from 'framer-motion';
import { useImageProcessing } from '@/hooks/useImageProcessing';

const Index: React.FC = () => {
  const {
    images,
    isSubmitting,
    processingProgress,
    handleFileChange,
    handleImageClick,
    handleTextChange,
    handleDelete,
    handleSubmitToApi,
    formatDate,
    handleCancelUpload
  } = useImageProcessing();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <BackgroundPattern />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container max-w-4xl mx-auto px-4 py-12 space-y-8 z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground dark:text-white mb-4 tracking-tight">
            استخراج البيانات من الصور
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            قم بتحميل صورك وسنقوم باستخراج البيانات بشكل آلي باستخدام الذكاء الاصطناعي
          </p>
        </div>

        <div className="elegant-upload shadow-xl rounded-3xl">
          <ImageUploader 
            isProcessing={isSubmitting}
            processingProgress={processingProgress}
            onFileChange={handleFileChange}
            onCancelUpload={handleCancelUpload}
          />
        </div>

        {images.length > 0 && (
          <ImageList 
            images={images}
            isSubmitting={isSubmitting}
            onImageClick={handleImageClick}
            onTextChange={handleTextChange}
            onDelete={handleDelete}
            onSubmit={handleSubmitToApi}
            formatDate={formatDate}
          />
        )}
      </motion.div>
    </div>
  );
};

export default Index;
