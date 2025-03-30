
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Image, Loader2, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  isProcessing: boolean;
  processingProgress: number;
  onFileChange: (files: File[]) => void;
  onCancelUpload?: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  isProcessing, 
  processingProgress, 
  onFileChange,
  onCancelUpload
}) => {
  const [dragOver, setDragOver] = useState(false);
  
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
    
    // إعادة تعيين حالة التأثير
    setDragOver(false);
  }, [onFileChange]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.webp', '.gif'],
    },
    multiple: true,
    disabled: isProcessing,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
  });

  return (
    <div className="relative">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-md cursor-pointer transition-all duration-200",
          "hover:bg-accent hover:border-primary",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "dark:bg-popover dark:border-muted dark:hover:bg-secondary",
          isDragActive || dragOver ? "bg-accent border-primary scale-[1.02]" : "bg-background",
          isProcessing ? "cursor-not-allowed opacity-60" : ""
        )}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                جاري المعالجة {processingProgress}%
              </p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mt-3 overflow-hidden dark:bg-gray-700">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <Image className="h-12 w-12 text-muted-foreground mb-3 opacity-70" />
              <p className="text-base text-muted-foreground">
                {isDragActive || dragOver ? 
                  <span className="font-medium text-primary">أسقط الصور هنا ...</span> : 
                  <span>اسحب وأسقط الصور <span className="hidden sm:inline">أو انقر للاختيار</span></span>
                }
              </p>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                يمكنك تحميل صور بصيغة JPEG، PNG، أو WebP. الحد الأقصى هو 20 صورة في المرة الواحدة.
              </p>
              <Button 
                className="mt-4" 
                size="sm" 
                variant="outline"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // محاكاة النقر على input الخفي
                  const input = document.querySelector('input[type="file"]');
                  if (input) {
                    (input as HTMLInputElement).click();
                  }
                }}
              >
                <FilePlus className="h-4 w-4 ml-2" />
                اختيار الصور
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isProcessing && onCancelUpload && (
        <Button 
          variant="destructive" 
          size="sm" 
          className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
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
