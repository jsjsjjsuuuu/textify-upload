
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ZoomControlsProps {
  onZoomIn: (e: React.MouseEvent) => void;
  onZoomOut: (e: React.MouseEvent) => void;
  onResetZoom: (e: React.MouseEvent) => void;
}

const ZoomControls = ({ onZoomIn, onZoomOut, onResetZoom }: ZoomControlsProps) => {
  return (
    <div className="flex justify-end gap-2 mb-2 absolute top-2 left-2 z-10">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={onZoomIn} 
        className="h-8 w-8 bg-white/90 hover:bg-white"
      >
        <ZoomIn size={16} />
      </Button>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={onZoomOut} 
        className="h-8 w-8 bg-white/90 hover:bg-white"
      >
        <ZoomOut size={16} />
      </Button>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={onResetZoom} 
        className="h-8 w-8 bg-white/90 hover:bg-white"
      >
        <Maximize2 size={16} />
      </Button>
    </div>
  );
};

export default ZoomControls;
