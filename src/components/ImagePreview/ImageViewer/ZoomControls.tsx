
import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  zoomLevel: number;
  className?: string;
}

const ZoomControls = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  zoomLevel,
  className
}: ZoomControlsProps) => {
  return (
    <div className={cn(
      "flex items-center gap-2 bg-gray-900/80 p-2 rounded-lg",
      className
    )}>
      <Button 
        onClick={onZoomIn}
        variant="secondary"
        size="icon"
        className="w-8 h-8"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button 
        onClick={onZoomOut}
        variant="secondary"
        size="icon"
        className="w-8 h-8"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button 
        onClick={onResetZoom}
        variant="secondary"
        size="icon"
        className="w-8 h-8"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <span className="text-white text-sm">
        {Math.round(zoomLevel * 100)}%
      </span>
    </div>
  );
};

export default ZoomControls;

