
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileImage, LoaderCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploaderProps {
  isProcessing: boolean;
  processingProgress: number;
  useGemini: boolean;
  onFileChange: (files: FileList | null) => void;
}

const ImageUploader = ({
  isProcessing,
  processingProgress,
  useGemini,
  onFileChange,
}: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
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

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
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
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {processingProgress}% مكتمل
                </p>
              </div>
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
                    {isDragging ? (
                      <FileImage className="w-14 h-14 text-primary" />
                    ) : (
                      <Upload className="w-14 h-14 text-gray-400 dark:text-gray-600" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                اسحب الصور هنا أو انقر للتحميل
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                يمكنك تحميل صور الإيصالات أو الفواتير وسيتم استخراج البيانات منها تلقائيًا.
                يُفضل صور واضحة وبحجم معقول (أقل من 5MB) للحصول على أفضل النتائج.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button className="px-6" disabled={isProcessing}>
                  <Upload className="w-4 h-4 mr-2" /> اختر الصور
                </Button>
              </div>
              {useGemini && (
                <p className="text-xs text-primary mt-2">
                  يستخدم Gemini AI لاستخراج البيانات - قد تستغرق المعالجة وقتًا أطول للصور الكبيرة
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
