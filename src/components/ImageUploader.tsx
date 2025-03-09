
import { useState, useCallback } from "react";
import { Upload, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
  onFileChange 
}: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onFileChange(e.dataTransfer.files);
  }, [onFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change detected", e.target.files);
    onFileChange(e.target.files);
  };

  const handleButtonClick = () => {
    // Programmatically click the file input
    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    } else {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على عنصر إدخال الملف",
        variant: "destructive"
      });
    }
  };

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center">
          {useGemini && (
            <div className="flex items-center bg-brand-brown/10 dark:bg-brand-brown/30 text-brand-brown dark:text-brand-beige px-3 py-1 rounded-full text-sm ml-2">
              <Brain size={16} className="mr-1" />
              تمكين Gemini AI
            </div>
          )}
        </div>
        
        <Button
          onClick={() => window.location.href = '/records'}
          variant="outline"
          className="text-sm self-start sm:self-auto"
        >
          إعدادات استخراج البيانات
        </Button>
      </div>
      
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        className={`bg-transparent my-0 mx-0 sm:mx-[40px] md:mx-[60px] lg:mx-[79px] px-4 sm:px-[17px] py-6 rounded-3xl border-2 border-dashed ${
          isDragging ? 'border-brand-brown dark:border-brand-beige' : 'border-brand-brown/30 dark:border-brand-beige/30 hover:border-brand-brown/50 dark:hover:border-brand-beige/50'
        } transition-colors`}
      >
        <input 
          type="file" 
          id="image-upload" 
          className="hidden" 
          accept="image/*" 
          multiple 
          onChange={handleFileInputChange} 
          disabled={isProcessing} 
        />
        <div className="cursor-pointer flex flex-col items-center justify-center h-full py-6 sm:py-8">
          <Upload size={28} className="text-brand-brown/70 dark:text-brand-beige/70 mb-2 sm:mb-4 sm:text-[36px]" />
          <p className="text-brand-brown dark:text-brand-beige font-medium mb-2 sm:mb-4">اسحب وأفلت الصور هنا</p>
          <Button 
            className="bg-brand-brown hover:bg-brand-brown/90 dark:bg-brand-beige dark:text-brand-brown dark:hover:bg-brand-beige/90" 
            disabled={isProcessing}
            onClick={handleButtonClick}
          >
            <Upload size={16} className="mr-2" />
            رفع الصور
          </Button>
        </div>
      </div>
      
      {isProcessing && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">جاري معالجة الصور...</p>
          <Progress value={processingProgress} className="h-2" />
        </div>
      )}
    </section>
  );
};

export default ImageUploader;
