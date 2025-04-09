
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, FileUp } from "lucide-react";
import { motion } from "framer-motion";

interface FileUploaderProps {
  onFilesSelected: (files: FileList | null) => void;
  isProcessing: boolean;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, isProcessing, className = '' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
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
      
      <motion.div
        className={`w-full mt-4 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors
          ${isDragging ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600' : 'bg-gray-50 border-gray-300 dark:bg-gray-900/30 dark:border-gray-700'}`}
        whileHover={{ scale: 1.01 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full p-4 mb-4">
          <ImageIcon className="h-12 w-12 text-blue-500 dark:text-blue-400" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">اسحب وأفلت الصور هنا</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 text-center">
          اختر صور الإيصالات للمعالجة التلقائية
        </p>
        
        <Button 
          onClick={handleButtonClick} 
          disabled={isProcessing} 
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6"
        >
          <Upload className="h-5 w-5" />
          تحميل الصور
        </Button>
      </motion.div>
    </div>
  );
};

export default FileUploader;
