
import React from 'react';
import { Button } from '@/components/ui/button';
import ProcessingInfo from '@/components/ProcessingInfo';
import FileUploader from '@/components/FileUploader';
import { useDropzone } from 'react-dropzone';

interface UploadTabProps {
  isProcessing: boolean;
  processingProgress: {
    total: number;
    current: number;
    errors: number;
  };
  pauseProcessing: () => void;
  retryProcessing: () => void;
  clearQueue: () => void;
  sessionImagesLength: number;
  handleFileChange: (files: File[]) => Promise<void>;
}

const UploadTab: React.FC<UploadTabProps> = ({
  isProcessing,
  processingProgress,
  pauseProcessing,
  retryProcessing,
  clearQueue,
  sessionImagesLength,
  handleFileChange
}) => {
  // تهيئة منطقة السحب والإفلات
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp', '.tiff']
    },
    onDrop: async (acceptedFiles: File[]) => {
      console.log(`تم استلام ${acceptedFiles.length} ملف`);
      await handleFileChange(acceptedFiles);
    }
  });

  return (
    <div className="space-y-6">
      {/* الإعدادات العامة - Gemini مفعل دائمًا */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="text-sm ml-2">استخدام Gemini AI:</span>
            <input
              type="checkbox"
              checked={true} // دائمًا مفعل
              disabled={true} // غير قابل للتعديل
              className="ml-1 w-4 h-4"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {isProcessing ? (
            <Button size="sm" variant="outline" onClick={pauseProcessing}>
              إيقاف مؤقت
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={retryProcessing} disabled={!sessionImagesLength}>
              استئناف
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={clearQueue} disabled={!isProcessing}>
            مسح القائمة
          </Button>
        </div>
      </div>
      
      {/* معلومات المعالجة */}
      <ProcessingInfo 
        isProcessing={isProcessing} 
        progress={processingProgress} 
      />
      
      {/* منطقة السحب والإفلات */}
      <FileUploader
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
      />
    </div>
  );
};

export default UploadTab;
