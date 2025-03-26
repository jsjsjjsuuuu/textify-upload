
import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import ImageUploader from '@/components/ImageUploader';
import ImageList from '@/components/ImageList';
import { useDataFormatting } from '@/hooks/useDataFormatting';
import { motion } from 'framer-motion';
import { ImageData } from '@/types/ImageData';
import DirectExportTools from '@/components/DataExport/DirectExportTools';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  // استدعاء hook بشكل ثابت في كل تحميل للمكون
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
    handleSubmitToApi,
    saveImageToDatabase,
    formatDate
  } = useImageProcessing();
  
  const {
    formatPhoneNumber,
    formatPrice,
    formatProvinceName
  } = useDataFormatting();
  
  // عند اكتمال معالجة الصور، حفظها في قاعدة البيانات
  useEffect(() => {
    const completedImages = images.filter(img => 
      img.status === "completed" && img.code && img.senderName && img.phoneNumber && !img.submitted
    );
    
    if (completedImages.length > 0) {
      completedImages.forEach(async (image) => {
        // حفظ الصور المكتملة في قاعدة البيانات
        await saveImageToDatabase(image);
        console.log("تم حفظ الصورة في قاعدة البيانات:", image.id);
      });
    }
  }, [images]);
  
  const handleImageClick = (image: ImageData) => {
    console.log('صورة تم النقر عليها:', image.id);
  };
  
  // التوجه إلى صفحة السجلات بعد اكتمال المعالجة
  const handleGoToRecords = () => {
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="pt-10 pb-20">
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="apple-header mb-4">معالج الصور والبيانات</h1>
              <p className="text-xl text-muted-foreground mb-8">
                استخرج البيانات من الصور بسهولة وفعالية باستخدام تقنية الذكاء الاصطناعي المتطورة
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="apple-button bg-primary text-primary-foreground" size="lg">
                  ابدأ الآن
                </Button>
                <Button variant="outline" className="apple-button" size="lg" asChild onClick={handleGoToRecords}>
                  <Link to="/">
                    استعراض السجلات
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
        
        <section className="py-16 px-6 bg-transparent">
          <div className="container mx-auto bg-transparent">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
                <div className="p-8">
                  <h2 className="apple-subheader mb-4 text-center">تحميل الصور</h2>
                  <p className="text-muted-foreground text-center mb-6">قم بتحميل صور الإيصالات أو الفواتير وسنقوم باستخراج البيانات منها تلقائياً</p>
                  <ImageUploader isProcessing={isProcessing} processingProgress={processingProgress} useGemini={useGemini} onFileChange={handleFileChange} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {images.length > 0 && <section className="py-16 px-6">
            <div className="container mx-auto">
              <div className="max-w-7xl mx-auto">
                <ImageList images={images} isSubmitting={isSubmitting} onImageClick={handleImageClick} onTextChange={handleTextChange} onDelete={handleDelete} onSubmit={id => handleSubmitToApi(id, images.find(img => img.id === id)!)} formatDate={formatDate} />
              </div>
            </div>
          </section>}
          
        {images.length > 0 && images.some(img => img.status === "completed") && (
          <div className="flex justify-center mt-8 mb-16">
            <Button 
              size="lg" 
              onClick={handleGoToRecords}
              className="bg-brand-green text-white hover:bg-brand-green/90"
            >
              الانتقال إلى السجلات لعرض البيانات المستخرجة
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
      
      <footer className="border-t py-8 bg-transparent">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              نظام استخراج البيانات - &copy; {new Date().getFullYear()}
            </p>
            <div className="flex gap-4">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                السجلات
              </Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                الملف الشخصي
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
