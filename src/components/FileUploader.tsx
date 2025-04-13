
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from './ImageUploader';

interface FileUploaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isProcessing: boolean;
}

const FileUploader = ({ onFilesSelected, isProcessing }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const { toast } = useToast();

  // إعادة تعيين الملفات المحددة بعد الانتهاء من المعالجة
  useEffect(() => {
    if (!isProcessing && selectedFiles.length > 0) {
      setSelectedFiles([]);
    }
  }, [isProcessing]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
      onFilesSelected(files);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter - 1 === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (files.length === 0) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: "يرجى إرفاق ملفات صور فقط (JPG, PNG, GIF, ...)",
          variant: "destructive",
        });
        return;
      }
      
      // معالجة الملفات مباشرة دون فحص التكرار
      setSelectedFiles(files);
      onFilesSelected(files);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          isDragging ? "border-primary bg-primary/10" : "border-gray-300"
        } ${isProcessing ? "pointer-events-none opacity-50" : "hover:bg-gray-50/50 cursor-pointer"}`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
  
        {isProcessing ? (
          <div>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg font-medium mb-2">جاري معالجة الصور...</p>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">اسحب وأفلت الصور هنا</p>
            <p className="text-sm text-gray-500 mb-4">أو</p>
            <Button type="button" disabled={isProcessing}>
              اختيار الصور
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              يمكنك تحميل صور بتنسيق JPG أو PNG
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default FileUploader;
