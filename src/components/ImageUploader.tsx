
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
          "relative border border-dashed rounded-xl p-6 cursor-pointer transition-all duration-300",
          "bg-gradient-to-b from-background to-muted/20",
          "hover:border-primary/50 hover:bg-accent/5",
          "focus-within:outline-none focus-within:ring-1 focus-within:ring-primary/30 focus-within:ring-offset-1",
          isDragActive || dragOver ? "border-primary/70 bg-accent/10 scale-[1.01]" : "border-muted-foreground/30",
          isProcessing ? "cursor-not-allowed opacity-60" : ""
        )}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground font-medium">
                جاري المعالجة {processingProgress}%
              </p>
              <div className="w-full max-w-xs bg-background/80 rounded-full h-1.5 mt-3 overflow-hidden">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-background/60 flex items-center justify-center mb-3 shadow-sm">
                <Image className="h-6 w-6 text-primary/80" />
              </div>
              <p className="text-base text-foreground/90 font-medium">
                {isDragActive || dragOver ? 
                  <span className="text-primary">أسقط الصور هنا ...</span> : 
                  <span>اسحب وأسقط الصور <span className="hidden sm:inline">أو انقر للاختيار</span></span>
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                يمكنك تحميل صور بصيغة JPEG، PNG، أو WebP.
              </p>
              <Button 
                className="mt-4 rounded-full shadow-sm" 
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
                اختر صور
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isProcessing && onCancelUpload && (
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border-muted-foreground/20"
          onClick={onCancelUpload}
          title="إلغاء التحميل"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
};

export default ImageUploader;
