
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'framer-motion';
import { CloudUpload, ImagePlus, FileCheck, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  isProcessing: boolean;
  processingProgress: { total: number; current: number; errors: number; };
  onFileChange: (files: File[]) => void;
  maxFiles?: number;
  showPreview?: boolean;
  acceptedFileTypes?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  isProcessing,
  processingProgress,
  onFileChange,
  maxFiles = 10,
  showPreview = true,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // وظيفة التعامل مع إسقاط الملفات
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // القيمة الحالية للملفات
    setFiles(acceptedFiles);
    
    // معاينات الصور
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => {
      // إلغاء عناوين URL القديمة لتجنب تسريب الذاكرة
      prev.forEach(url => URL.revokeObjectURL(url));
      return newPreviews;
    });
    
    // تمرير الملفات إلى الأب
    onFileChange(acceptedFiles);
  }, [onFileChange]);
  
  // حساب النسبة المئوية للتقدم
  const calculateProgressPercentage = () => {
    if (processingProgress.total === 0) return 0;
    return Math.min(
      100, 
      Math.round((processingProgress.current / processingProgress.total) * 100)
    );
  };
  
  // إلغاء معاينة الصورة
  const removePreview = (index: number) => {
    // إلغاء عنوان URL للمعاينة
    URL.revokeObjectURL(previews[index]);
    
    // حذف المعاينة من القائمة
    setPreviews(prev => prev.filter((_, i) => i !== index));
    
    // حذف الملف من القائمة
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((obj, type) => ({ ...obj, [type]: [] }), {}),
    maxFiles,
    disabled: isProcessing
  });

  return (
    <div className="space-y-4">
      {/* منطقة إسقاط الملفات */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50 hover:bg-muted/10",
          isDragAccept && "border-green-500 bg-green-50 dark:bg-green-950/20",
          isDragReject && "border-red-500 bg-red-50 dark:bg-red-950/20",
          isProcessing && "opacity-60 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="mb-2">
          {isDragActive ? (
            <CloudUpload className="h-12 w-12 text-primary animate-bounce" />
          ) : (
            <ImagePlus className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">
            {isDragActive
              ? "أفلت الملفات هنا"
              : "اسحب وأفلت صور الوصولات هنا أو انقر للتصفح"}
          </p>
          <p className="text-sm text-muted-foreground">
            أنواع الملفات المدعومة: JPG, PNG, WEBP. الحد الأقصى: {maxFiles} ملفات.
          </p>
        </div>
      </div>
      
      {/* معاينات الصور */}
      {showPreview && previews.length > 0 && (
        <AnimatePresence>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <motion.div
                key={preview}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-square rounded-lg overflow-hidden border group"
              >
                <img
                  src={preview}
                  alt={`معاينة ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePreview(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
      
      {/* شريط التقدم */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>جاري معالجة الصور...</span>
            <span>{calculateProgressPercentage()}%</span>
          </div>
          <Progress value={calculateProgressPercentage()} max={100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>تم معالجة {processingProgress.current} من {processingProgress.total}</span>
            {processingProgress.errors > 0 && (
              <span className="text-destructive">
                الأخطاء: {processingProgress.errors}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
