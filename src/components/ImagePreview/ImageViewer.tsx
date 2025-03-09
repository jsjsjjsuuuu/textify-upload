
import { useRef, useState, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ImageData } from "@/types/ImageData";
import { isValidBlobUrl } from "@/lib/gemini/utils";

interface ImageViewerProps {
  selectedImage: ImageData;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  formatDate: (date: Date) => string;
}

const ImageViewer = ({
  selectedImage,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  formatDate
}: ImageViewerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset image loaded state when selected image changes
  useEffect(() => {
    setImageLoaded(false);
    setImgError(false);
    
    // Validate blob URL
    if (selectedImage?.previewUrl) {
      isValidBlobUrl(selectedImage.previewUrl).then(isValid => {
        if (!isValid) {
          console.error("Invalid blob URL detected:", selectedImage.previewUrl);
          setImgError(true);
        }
      });
    }
  }, [selectedImage.id, selectedImage.previewUrl]);
  
  // Get safe image URL or fallback
  const getImageUrl = () => {
    if (!selectedImage.previewUrl || imgError) {
      return null;
    }
    return selectedImage.previewUrl;
  };

  // تقييم دقة الاستخراج
  const getAccuracyColor = (confidence: number = 0) => {
    if (confidence >= 90) return "bg-green-500";
    if (confidence >= 70) return "bg-emerald-500";
    if (confidence >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="col-span-1 bg-muted/30 rounded-lg p-4 flex flex-col items-center justify-center relative">
      <div 
        ref={imageContainerRef}
        className="overflow-hidden relative h-[400px] w-full flex items-center justify-center bg-white/50 rounded-md"
      >
        {selectedImage.previewUrl && !imgError && (
          <div className="relative w-full h-full flex items-center justify-center">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
              </div>
            )}
            
            <img 
              src={getImageUrl() || ''}
              alt="معاينة موسعة" 
              className="transition-all duration-200"
              style={{ 
                transform: `scale(${zoomLevel})`,
                opacity: imageLoaded ? 1 : 0,
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
              onLoad={() => {
                console.log("Image loaded successfully:", selectedImage.id);
                setImageLoaded(true);
              }}
              onError={(e) => {
                console.error("Error loading image:", selectedImage.previewUrl, e);
                setImageLoaded(false);
                setImgError(true);
              }}
            />
          </div>
        )}
        
        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
            <ImageOff size={48} />
            <p className="mt-2 text-center font-medium">فشل تحميل الصورة</p>
            <p className="text-sm text-muted-foreground mt-1">قد تكون الصورة غير صالحة أو تم حذفها</p>
          </div>
        )}
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
                disabled={isAnalyzing || imgError}
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
    </div>
  );
};

export default ImageViewer;
