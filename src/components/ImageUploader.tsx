
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileImage, LoaderCircle, ImageIcon, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploaderProps {
  isProcessing: boolean;
  processingProgress: number;
  activeUploads?: number;
  queueLength?: number;
  onFileChange: (files: FileList | null) => void;
}

const ImageUploader = ({
  isProcessing,
  processingProgress,
  activeUploads = 0,
  queueLength = 0,
  onFileChange
}: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragCounter(prev => prev - 1);
    if (dragCounter - 1 === 0) {
      setIsDragging(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files);
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // حساب الإجمالي الكلي للصور قيد المعالجة
  const totalProcessingItems = activeUploads + queueLength;
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer flex flex-col items-center justify-center h-64 
          ${isDragging 
            ? "border-primary bg-primary/10 dark:bg-primary/5" 
            : "border-gray-300 dark:border-gray-700 hover:border-primary/50"}
          ${isProcessing ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`
        } 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : handleButtonClick}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          multiple 
          onChange={handleFileInputChange} 
          disabled={isProcessing} 
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {isProcessing ? (
            <>
              <div className="relative w-16 h-16 mb-2">
                <AnimatePresence>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.8 }} 
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <LoaderCircle className="w-14 h-14 text-primary animate-spin" />
                  </motion.div>
                </AnimatePresence>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                جاري معالجة الصور...
              </h3>
              
              <div className="w-full max-w-md">
                <Progress value={processingProgress} className="h-2" />
                <div className="mt-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <p>{processingProgress}% مكتمل</p>
                  {totalProcessingItems > 0 && (
                    <p className="text-blue-500 dark:text-blue-400 animate-pulse">
                      <LoaderCircle className="w-3.5 h-3.5 inline ml-1 animate-spin" />
                      <span className="font-medium">{activeUploads}</span> قيد المعالجة
                      {queueLength > 0 && (
                        <span className="mx-1">| <span className="font-medium">{queueLength}</span> في الانتظار</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              
              {/* معلومات حول عملية المعالجة */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                يتم استخدام Gemini AI لاستخراج النص من الصور
              </p>
            </>
          ) : (
            <>
              <div className="relative w-16 h-16 mb-2">
                <AnimatePresence>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.8 }} 
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {isDragging 
                      ? <FileImage className="w-14 h-14 text-primary" /> 
                      : <Upload className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                    }
                  </motion.div>
                </AnimatePresence>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                اسحب الصور هنا
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                أو اضغط لاختيار الصور
              </p>
              
              <Button 
                disabled={isProcessing} 
                className="text-white px-6 bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Upload className="w-4 h-4 ml-2" /> اختر الصور
              </Button>
              
              {/* نصائح للمستخدم */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 max-w-xs">
                للحصول على أفضل النتائج، استخدم صور واضحة وذات إضاءة جيدة
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* معلومات إضافية تحت المربع */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <ImageIcon className="w-3.5 h-3.5 ml-1 text-blue-500" />
          يمكنك تحميل صور بتنسيق JPG, PNG, WEBP
        </p>
        
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 ml-1" />
          تأكد من أن الصور واضحة ومقروءة للحصول على أفضل النتائج
        </p>
      </div>
    </div>
  );
};

export default ImageUploader;
