
import { DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Maximize2, RefreshCw } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import ExtractedDataEditor from "./ExtractedDataEditor";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ImagePreviewDialogProps {
  selectedImage: ImageData | null;
  zoomLevel: number;
  isSubmitting: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImagePreviewDialog = ({
  selectedImage,
  zoomLevel,
  isSubmitting,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate
}: ImagePreviewDialogProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  if (!selectedImage) return null;
  
  // تقييم دقة الاستخراج
  const getAccuracyColor = (confidence: number = 0) => {
    if (confidence >= 90) return "bg-green-500";
    if (confidence >= 70) return "bg-emerald-500";
    if (confidence >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none" onInteractOutside={e => e.preventDefault()}>
      <div className="bg-white/95 rounded-lg border p-4 shadow-lg relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 bg-muted/30 rounded-lg p-4 flex flex-col items-center justify-center relative">
            <div className="overflow-hidden relative h-[400px] w-full flex items-center justify-center">
              <img 
                src={selectedImage.previewUrl} 
                alt="معاينة موسعة" 
                className="object-contain transition-transform duration-200" 
                style={{
                  transform: `scale(${zoomLevel})`,
                  maxHeight: '100%',
                  maxWidth: '100%'
                }} 
              />
            </div>
            <div className="absolute top-2 left-2 flex gap-2">
              <Button variant="secondary" size="icon" onClick={onZoomIn} className="h-8 w-8 bg-white/90 hover:bg-white">
                <ZoomIn size={16} />
              </Button>
              <Button variant="secondary" size="icon" onClick={onZoomOut} className="h-8 w-8 bg-white/90 hover:bg-white">
                <ZoomOut size={16} />
              </Button>
              <Button variant="secondary" size="icon" onClick={onResetZoom} className="h-8 w-8 bg-white/90 hover:bg-white">
                <Maximize2 size={16} />
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      disabled={isAnalyzing}
                      onClick={() => {
                        setIsAnalyzing(true);
                        // هنا يمكن إضافة رمز التحليل المتقدم في المستقبل
                        setTimeout(() => {
                          setIsAnalyzing(false);
                        }, 1500);
                      }} 
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                    >
                      {isAnalyzing ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تحليل متقدم للصورة</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {selectedImage.number !== undefined && (
              <div className="absolute top-2 right-2 bg-brand-brown text-white px-2 py-1 rounded-full text-xs">
                صورة {selectedImage.number}
              </div>
            )}
            
            <div className="flex items-center justify-between w-full mt-4">
              <p className="text-xs text-muted-foreground">
                {formatDate(selectedImage.date)}
              </p>
              
              <div className="flex items-center gap-2">
                {selectedImage.extractionMethod && (
                  <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                    {selectedImage.extractionMethod === "gemini" ? "Gemini AI" : "OCR"}
                  </Badge>
                )}
                
                {selectedImage.confidence !== undefined && (
                  <Badge className={`text-xs ${getAccuracyColor(selectedImage.confidence)} text-white`}>
                    دقة الاستخراج: {Math.round(selectedImage.confidence)}%
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex justify-between w-full mt-4 pt-2 border-t">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDelete(selectedImage.id)} 
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  حذف
                </Button>
              </div>
              
              <Button 
                variant="default" 
                size="sm" 
                className="bg-brand-green hover:bg-brand-green/90 text-white" 
                disabled={selectedImage.status !== "completed" || isSubmitting || selectedImage.submitted} 
                onClick={() => onSubmit(selectedImage.id)}
              >
                {selectedImage.submitted ? "تم الإرسال" : "إرسال"}
              </Button>
            </div>
          </div>
          
          <div className="col-span-1">
            <ExtractedDataEditor 
              image={selectedImage}
              onTextChange={onTextChange}
            />
          </div>
        </div>
        
        <DialogClose className="absolute top-2 right-2 rounded-full h-8 w-8 flex items-center justify-center border bg-background">
          <X size={18} />
          <span className="sr-only">Close</span>
        </DialogClose>
      </div>
    </DialogContent>
  );
};

export default ImagePreviewDialog;
