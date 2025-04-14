
import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isProcessing: boolean;
  multiple?: boolean;
  accept?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  isProcessing = false,
  multiple = true,
  accept = "image/*"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newCount = dragCounter - 1;
    setDragCounter(newCount);
    if (newCount === 0) {
      setIsDragging(false);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isProcessing) {
      onFilesSelected(e.dataTransfer.files);
    }
  };
  
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && !isProcessing) {
      onFilesSelected(e.target.files);
    }
  };
  
  const handleButtonClick = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full"
      >
        <div
          className={`
            relative overflow-hidden
            border-2 border-dashed rounded-xl p-8 transition-all duration-300
            backdrop-blur-sm bg-white/5
            ${isDragging 
              ? 'border-primary bg-primary/5 dark:bg-primary/10' 
              : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'}
            ${isProcessing 
              ? 'cursor-not-allowed opacity-70' 
              : 'cursor-pointer hover:shadow-lg'}
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={isProcessing ? undefined : handleButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isProcessing}
          />
          
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: isDragging ? 1.1 : 1 }}
            className="flex flex-col items-center justify-center gap-4"
          >
            <motion.div
              animate={{
                y: isDragging ? -10 : 0,
                scale: isDragging ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`p-4 rounded-full ${
                isDragging 
                  ? 'bg-primary/20 dark:bg-primary/10' 
                  : 'bg-gray-100/10 dark:bg-gray-800/30'
              }`}
            >
              {isDragging ? (
                <FileImage className="w-12 h-12 text-primary" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              )}
            </motion.div>

            <div className="text-center space-y-2">
              <motion.h3 
                className="text-lg font-semibold text-gray-700 dark:text-gray-300"
                animate={{ scale: isDragging ? 1.05 : 1 }}
              >
                {isDragging ? 'أفلت الملفات هنا' : 'اسحب الملفات وأفلتها هنا'}
              </motion.h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                أو
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="relative overflow-hidden group mt-4"
              disabled={isProcessing}
              onClick={handleButtonClick}
            >
              <motion.div
                className="absolute inset-0 bg-primary/10"
                initial={false}
                animate={{
                  x: "100%"
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <ArrowUpDown className="ml-2 h-4 w-4" />
              اختر الملفات
            </Button>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {multiple 
                ? 'JPG, PNG أو WEBP (الحد الأقصى 10 ميجابايت لكل ملف)'
                : 'JPG, PNG أو WEBP (الحد الأقصى 10 ميجابايت)'}
            </p>
          </motion.div>

          {/* إضافة تأثير موجة عند السحب */}
          <motion.div
            className="absolute inset-0 bg-primary/5 pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={isDragging ? {
              scale: 1.5,
              opacity: [0, 0.5, 0],
              transition: { duration: 1, repeat: Infinity }
            } : { scale: 0, opacity: 0 }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FileUploader;
