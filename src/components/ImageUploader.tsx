
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {useGemini && (
            <div className="flex items-center bg-brand-brown/10 text-brand-brown px-3 py-1 rounded-full text-sm ml-2">
              <Brain size={16} className="mr-1" />
              تمكين Gemini AI
            </div>
          )}
        </div>
        
        <Button
          onClick={() => window.location.href = '/records'}
          variant="outline"
          className="text-sm"
        >
          إعدادات استخراج البيانات
        </Button>
      </div>
      
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        className={`bg-transparent my-0 mx-[79px] px-[17px] py-6 rounded-3xl border-2 border-dashed ${
          isDragging ? 'border-brand-brown' : 'border-brand-brown/30 hover:border-brand-brown/50'
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
        <div className="cursor-pointer flex flex-col items-center justify-center h-full">
          <Upload size={36} className="text-brand-brown/70 mb-2" />
          <p className="text-brand-brown font-medium mb-2">اسحب وأفلت الصور هنا</p>
          <Button 
            className="bg-brand-brown hover:bg-brand-brown/90" 
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
