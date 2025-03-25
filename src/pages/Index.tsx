import React from 'react';
import { Upload } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import ImageUploader from '@/components/ImageUploader';
import ImageList from '@/components/ImageList';
import { useDataFormatting } from '@/hooks/useDataFormatting';
import { motion } from 'framer-motion';
import { ImageData } from '@/types/ImageData';
import DirectExportTools from '@/components/DataExport/DirectExportTools';
const Index = () => {
  const {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi
  } = useImageProcessing();
  const {
    formatPhoneNumber,
    formatPrice,
    formatProvinceName
  } = useDataFormatting();
  const handleImageClick = (image: ImageData) => {
    console.log('صورة تم النقر عليها:', image.id);
  };
  return <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      <div className="container mx-auto p-4 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-brown dark:text-brand-beige tracking-tight">معالج الصور والبيانات</h1>
            <p className="text-muted-foreground">استخرج البيانات من الصور بسهولة باستخدام Gemini AI</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gradient-to-b from-muted/50 to-muted pb-8 pt-6 rounded-lg px-[6px] py-[19px] my-0 mx-[28px]">
              <ImageUploader isProcessing={isProcessing} processingProgress={processingProgress} useGemini={useGemini} onFileChange={handleFileChange} />
            </div>
            
            {images.length === 0 ? <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} className="text-center py-10">
                <div className="bg-muted-foreground/10 inline-flex items-center justify-center p-6 rounded-full mb-4">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">ابدأ بتحميل الصور</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  قم بتحميل صور الإيصالات أو الفواتير وسيتم استخراج البيانات منها تلقائيًا
                </p>
              </motion.div> : <ImageList images={images} isSubmitting={isSubmitting} onImageClick={handleImageClick} onTextChange={handleTextChange} onDelete={handleDelete} onSubmit={id => handleSubmitToApi(id, images.find(img => img.id === id)!)} formatDate={useImageProcessing().formatDate} />}
          </div>
          
          
        </div>
      </div>
      
      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              نظام استخراج البيانات - &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;