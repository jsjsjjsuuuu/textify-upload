
import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isProcessing?: boolean;
  className?: string;
}

const FileUploader = ({ onFilesSelected, isProcessing = false, className = '' }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (!validateFiles(files)) return;
    
    onFilesSelected(files);
  }, [onFilesSelected]);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !validateFiles(Array.from(files))) return;
    
    onFilesSelected(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesSelected]);
  
  const validateFiles = (files: File[]): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "نوع ملف غير صالح",
        description: "يرجى اختيار ملفات صور فقط (JPG, PNG, WEBP)",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <motion.div
        className={`p-8 text-center transition-colors ${
          isDragging ? 'bg-primary/5' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{ scale: isDragging ? 0.98 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center justify-center gap-4">
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full bg-primary/10 p-4"
            >
              {isDragging ? (
                <ImageIcon className="h-12 w-12 text-primary" />
              ) : (
                <UploadCloud className="h-12 w-12 text-primary" />
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="max-w-[280px] space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragging ? 'أفلت الصور هنا' : 'اختر صورة أو أكثر'}
            </h3>
            <p className="text-sm text-muted-foreground">
              اسحب وأفلت الصور هنا أو اضغط لاختيار الملفات
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="mt-2"
          >
            اختيار الملفات
          </Button>
        </div>
      </motion.div>
      
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium">جاري معالجة الصور...</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FileUploader;
