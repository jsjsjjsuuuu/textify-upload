
import React, { useState, useEffect } from 'react';
import ImageUploader from '../components/ImageUploader';
import ImageList from '../components/ImageList';
import ExtractedData from '../components/ExtractedData';
import { useImageProcessingCore } from '../hooks/useImageProcessingCore';
import { useDataExtraction } from '../hooks/useDataExtraction';
import DataExport from '../components/DataExport/DirectExportTools';
import LearningStats from '../components/LearningStats';
import BackgroundPattern from '../components/BackgroundPattern';
import AppHeader from '../components/AppHeader';
import { toast } from 'sonner';
import { isPreviewEnvironment, checkConnection } from '@/utils/automationServerUrl';
import ConnectionStatusIndicator from '@/components/ui/connection-status-indicator';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { 
    images,
    isProcessing,
    processingProgress,
    useGemini,
    handleFileChange,
  } = useImageProcessingCore();
  
  const { 
    tempData,
    handleEditToggle,
    handleCancel,
    handleCopyText,
    handleAutoExtract,
    handleTempChange,
  } = useDataExtraction();
  
  const [serverConnected, setServerConnected] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // التحقق من حالة الاتصال بخادم Render عند تحميل الصفحة
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      // في بيئة المعاينة، اعتبر الخادم متصلاً دائمًا
      if (isPreviewEnvironment()) {
        setServerConnected(true);
        return;
      }

      // التحقق من الاتصال بالخادم
      const result = await checkConnection();
      setServerConnected(result.isConnected);
    } catch (error) {
      console.error("خطأ في التحقق من حالة الاتصال:", error);
      setServerConnected(false);
    }
  };

  // دوال مساعدة للتعامل مع قائمة الصور
  const handleImageClick = (image) => {
    console.log("تم النقر على الصورة:", image);
  };

  const handleTextChange = (id, field, value) => {
    console.log("تحديث النص:", id, field, value);
  };

  const handleDelete = (id) => {
    console.log("حذف الصورة:", id);
  };

  const handleSubmit = (id) => {
    console.log("إرسال الصورة:", id);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ar-EG');
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />
      
      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto">
        <AppHeader />
        
        <div className="mt-6 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 lg:w-2/5 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">تحميل الصور</h2>
                <ConnectionStatusIndicator />
              </div>
              
              <ImageUploader 
                isProcessing={isProcessing}
                processingProgress={processingProgress}
                useGemini={useGemini}
                onFileChange={handleFileChange}
              />
              
              {images && images.length > 0 && (
                <div className="mt-4">
                  <ImageList 
                    images={images}
                    isSubmitting={isSubmitting}
                    onImageClick={handleImageClick}
                    onTextChange={handleTextChange}
                    onDelete={handleDelete}
                    onSubmit={handleSubmit}
                    formatDate={formatDate}
                  />
                </div>
              )}
              
              <LearningStats />
            </div>
          </div>
          
          <div className="w-full md:w-1/2 lg:w-3/5 space-y-6">
            <ExtractedData 
              image={images?.[0]}
              imageData={images?.[0]}
              extractedData={tempData}
              extractionLoading={isProcessing}
              updateExtractedData={handleTempChange}
              updateRawText={(text) => {
                if (images?.[0]?.id) {
                  // هنا نحتاج للتعامل مع تحديث النص الخام
                  console.log("تحديث النص الخام:", text);
                }
              }}
            />
            
            {tempData && Object.keys(tempData).length > 0 && (
              <DataExport 
                images={images || []}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
