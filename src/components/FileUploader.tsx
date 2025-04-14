
import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, ArrowUpDown } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isProcessing: boolean;
  multiple?: boolean;
  accept?: string;
}

/**
 * مكون تحميل الملفات المحسّن
 * يدعم السحب والإفلات وتحديد الملفات من خلال زر
 */
const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  isProcessing = false,
  multiple = true,
  accept = "image/*"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // معالجة حدث بدء السحب
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prevCount => prevCount + 1);
    setIsDragging(true);
  };
  
  // معالجة حدث الخروج من منطقة السحب
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newCount = dragCounter - 1;
    setDragCounter(newCount);
    
    if (newCount === 0) {
      setIsDragging(false);
    }
  };
  
  // معالجة حدث السحب فوق المنطقة
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // معالجة حدث الإفلات
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isProcessing) {
      onFilesSelected(e.dataTransfer.files);
    }
  };
  
  // معالجة تحديد الملفات من خلال مربع الإدخال
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && !isProcessing) {
      onFilesSelected(e.target.files);
    }
  };
  
  // معالجة النقر على زر التحميل
  const handleButtonClick = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="w-full">
      {/* منطقة السحب والإفلات */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 transition-all duration-200
          flex flex-col items-center justify-center min-h-[200px]
          ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'}
          ${isProcessing 
              ? 'cursor-not-allowed opacity-70' 
              : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : handleButtonClick}
      >
        {/* مربع إدخال الملفات (مخفي) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />
        
        {/* أيقونة التحميل */}
        <div className="mb-4 text-center">
          {isDragging ? (
            <FileImage className="h-12 w-12 text-primary mx-auto" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400 dark:text-gray-600 mx-auto" />
          )}
        </div>
        
        {/* نص التحميل */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {isDragging ? 'أفلت الملفات هنا' : 'اسحب الملفات وأفلتها هنا'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            أو
          </p>
        </div>
        
        {/* زر التحميل */}
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={isProcessing}
          onClick={handleButtonClick}
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          اختر الملفات
        </Button>
        
        {/* نص المساعدة */}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          {multiple 
            ? 'JPG, PNG أو WEBP (الحد الأقصى 10 ميجابايت لكل ملف)'
            : 'JPG, PNG أو WEBP (الحد الأقصى 10 ميجابايت)'}
        </p>
      </div>
    </div>
  );
};

export default FileUploader;
