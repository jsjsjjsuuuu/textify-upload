
import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  zoomLevel: number;
}

const ZoomControls = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  zoomLevel
}: ZoomControlsProps) => {
  return (
    <div className="absolute top-3 left-3 z-50 flex gap-2">
      <Button 
        onClick={onZoomIn}
        variant="secondary"
        size="icon"
        className="w-9 h-9 bg-gray-900/80 hover:bg-gray-800"
      >
        <ZoomIn className="h-5 w-5" />
      </Button>
      <Button 
        onClick={onZoomOut}
        variant="secondary"
        size="icon"
        className="w-9 h-9 bg-gray-900/80 hover:bg-gray-800"
      >
        <ZoomOut className="h-5 w-5" />
      </Button>
      <Button 
        onClick={onResetZoom}
        variant="secondary"
        size="icon"
        className="w-9 h-9 bg-gray-900/80 hover:bg-gray-800"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
      <span className="px-2 py-1 bg-black/70 rounded-full text-white text-sm">
        {Math.round(zoomLevel * 100)}%
      </span>
    </div>
  );
};

export default ZoomControls;
