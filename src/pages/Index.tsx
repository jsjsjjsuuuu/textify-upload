
import React, { useState, useEffect } from 'react';
import ImageUploader from '../components/ImageUploader';
import ImageList from '../components/ImageList';
import ExtractedData from '../components/ExtractedData';
import { useImageState } from '../hooks/useImageState';
import { useDataExtraction } from '../hooks/useDataExtraction';
import DataExport from '../components/DataExport/DirectExportTools';
import LearningStats from '../components/LearningStats';
import BackgroundPattern from '../components/BackgroundPattern';
import AppHeader from '../components/AppHeader';
import { toast } from 'sonner';
import { getAutomationServerUrl, isPreviewEnvironment, checkConnection } from '@/utils/automationServerUrl';
import ConnectionStatusIndicator from '@/components/ui/connection-status-indicator';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { loading, image, imageData, updateImageData, clearImage, addImage } = useImageState();
  const { extractedData, extractionLoading, updateExtractedData, updateRawText } = useDataExtraction();
  const [serverConnected, setServerConnected] = useState<boolean>(false);
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

  // عند تحميل صورة
  const handleUploadSuccess = (file: File, imageUrl: string) => {
    addImage(file, imageUrl);
  };

  // إدارة الخطأ في التحميل
  const handleUploadError = (error: Error) => {
    toast.error(`خطأ في تحميل الصورة: ${error.message}`);
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
                onUploadSuccess={handleUploadSuccess}
                onError={handleUploadError}
              />
              
              {image && (
                <div className="mt-4">
                  <ImageList 
                    image={image}
                    imageData={imageData}
                    updateImageData={updateImageData}
                    clearImage={clearImage}
                  />
                </div>
              )}
              
              <LearningStats className="mt-4" />
            </div>
          </div>
          
          <div className="w-full md:w-1/2 lg:w-3/5 space-y-6">
            <ExtractedData 
              image={image}
              imageData={imageData}
              extractedData={extractedData}
              extractionLoading={extractionLoading}
              updateExtractedData={updateExtractedData}
              updateRawText={updateRawText}
            />
            
            {extractedData && Object.keys(extractedData).length > 0 && (
              <DataExport 
                extractedData={extractedData} 
                imageData={imageData} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
