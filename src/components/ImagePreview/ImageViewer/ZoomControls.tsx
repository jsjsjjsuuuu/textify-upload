
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useState } from "react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const ZoomControls = ({
  onZoomIn,
  onZoomOut,
  onResetZoom
}: ZoomControlsProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  return (
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
  );
};

export default ZoomControls;
