
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
          "relative border-2 border-dashed rounded-2xl h-64 cursor-pointer transition-all duration-300",
          "bg-white/10 backdrop-blur-sm",
          "hover:bg-accent/5 hover:border-primary/40",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "dark:bg-black/5 dark:border-muted dark:hover:bg-black/10",
          isDragActive || dragOver ? "bg-accent/10 border-primary/60 scale-[1.01]" : "border-muted/40",
          isProcessing ? "cursor-not-allowed opacity-80" : ""
        )}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-lg text-foreground font-medium">
                جاري المعالجة {processingProgress}%
              </p>
              <div className="w-full max-w-xs bg-muted/30 rounded-full h-2.5 mt-4 overflow-hidden dark:bg-muted/20">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Image className="h-10 w-10 text-primary/70" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                تحميل الصور
              </h3>
              <p className="text-base text-muted-foreground mb-4">
                {isDragActive || dragOver ? 
                  <span className="font-medium text-primary">أسقط الصور هنا ...</span> : 
                  <span>اسحب وأسقط الصور <span className="hidden sm:inline">أو انقر للاختيار</span></span>
                }
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mb-5">
                يمكنك تحميل صور بصيغة JPEG، PNG، أو WebP. الحد الأقصى هو 20 صورة في المرة الواحدة.
              </p>
              <Button 
                className="rounded-full px-6" 
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
          className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full"
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
