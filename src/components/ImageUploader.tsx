import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Image, Loader2, X } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  isProcessing: boolean;
  processingProgress: number;
  onFileChange: (files: FileList | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ isProcessing, processingProgress, onFileChange }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileChange(createFileList(acceptedFiles));
  }, [onFileChange]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.webp'],
    },
    multiple: true,
    disabled: isProcessing,
  });

  const createFileList = (files: File[]): FileList => {
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    return dataTransfer.files;
  };

  return (
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
  );
};

export default ImageUploader;
