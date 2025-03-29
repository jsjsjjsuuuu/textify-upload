
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Image, Loader2, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  isProcessing: boolean;
  processingProgress: number;
  onFileChange: (files: File[]) => void; // تغيير النوع من FileList إلى File[]
  onCancelUpload?: () => void; // إضافة وظيفة إلغاء التحميل
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  isProcessing, 
  processingProgress, 
  onFileChange,
  onCancelUpload
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // التحقق من أن الملفات هي صور
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      console.error("لا توجد ملفات صور صالحة");
      return;
    }
    
    // تقليص حجم الملفات إذا كان كبيرًا جدًا
    if (imageFiles.length > 20) {
      console.log(`تم اختيار ${imageFiles.length} صورة، سيتم معالجة أول 20 صورة فقط`);
      onFileChange(imageFiles.slice(0, 20));
    } else {
      onFileChange(imageFiles);
    }
  }, [onFileChange]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.webp'],
    },
    multiple: true,
    disabled: isProcessing,
  });

  return (
    <div className="relative">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-md cursor-pointer transition-colors",
          "hover:bg-accent hover:border-primary",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "dark:bg-popover dark:border-muted dark:hover:bg-secondary",
          isDragActive ? "bg-accent" : "bg-background",
          isProcessing ? "cursor-not-allowed opacity-60" : ""
        )}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                جاري المعالجة {processingProgress}%
              </p>
            </>
          ) : (
            <>
              <FilePlus className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? "أسقط الصور هنا ..." : "اسحب وأسقط الصور أو انقر للاختيار"}
              </p>
            </>
          )}
        </div>
      </div>
      
      {isProcessing && onCancelUpload && (
        <Button 
          variant="destructive" 
          size="sm" 
          className="absolute top-2 right-2 h-8 w-8 p-0" 
          onClick={onCancelUpload}
          title="إلغاء التحميل"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ImageUploader;
