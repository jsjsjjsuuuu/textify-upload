
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
      "flex items-center gap-2 bg-gray-900/80 p-2 rounded-lg shadow-xl",
      className
    )}>
      <Button 
        onClick={(e) => {
          e.stopPropagation();
          onZoomIn();
        }}
        variant="secondary"
        size="icon"
        className="w-8 h-8 bg-gray-800 hover:bg-gray-700"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button 
        onClick={(e) => {
          e.stopPropagation();
          onZoomOut();
        }}
        variant="secondary"
        size="icon"
        className="w-8 h-8 bg-gray-800 hover:bg-gray-700"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button 
        onClick={(e) => {
          e.stopPropagation();
          onResetZoom();
        }}
        variant="secondary"
        size="icon"
        className="w-8 h-8 bg-gray-800 hover:bg-gray-700"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <span className="text-white text-sm font-medium">
        {Math.round(zoomLevel * 100)}%
      </span>
    </div>
  );
};

export default ZoomControls;
