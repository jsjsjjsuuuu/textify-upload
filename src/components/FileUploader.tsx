
import React from 'react';
import { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  getRootProps: () => DropzoneRootProps;
  getInputProps: () => DropzoneInputProps;
  isDragActive: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  getRootProps,
  getInputProps,
  isDragActive
}) => {
  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all duration-200",
        isDragActive 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-muted hover:border-primary hover:bg-accent/50",
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">
        {isDragActive ? "أفلت الملفات هنا" : "اسحب وأفلت الصور هنا"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        يمكنك تحميل صور بصيغة JPEG، PNG، WebP، GIF، BMP أو TIFF. أو انقر هنا لاختيار الملفات.
      </p>
    </div>
  );
};

export default FileUploader;
