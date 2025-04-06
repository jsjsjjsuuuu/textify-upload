
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";

interface FileUploaderProps {
  onFilesSelected: (files: FileList | null) => void;
  isProcessing: boolean;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, isProcessing, className = '' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilesSelected(e.target.files);
    // إعادة تعيين قيمة الإدخال للسماح بتحميل نفس الملفات مرة أخرى إذا لزم الأمر
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
        disabled={isProcessing}
      />
      <Button 
        onClick={handleButtonClick} 
        disabled={isProcessing} 
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
      >
        <Upload className="h-5 w-5" />
        تحميل الصور
      </Button>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        اختر صور الإيصالات للمعالجة التلقائية
      </p>
      
      <div className="mt-4 border-2 border-dashed rounded-xl p-6 bg-gray-50 dark:bg-gray-900/30 w-full flex flex-col items-center">
        <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
        <p className="text-center mb-1 font-medium">اسحب وأفلت الصور هنا</p>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          أو اضغط على زر التحميل لاختيار الصور من جهازك
        </p>
      </div>
    </div>
  );
};

export default FileUploader;
