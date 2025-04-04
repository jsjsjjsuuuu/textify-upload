
import React from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRefresh?: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRefresh
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex items-center bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
      <Button variant="ghost" size="sm" onClick={onZoomOut} className="px-2 h-8" title="تصغير">
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
      
      <Button variant="ghost" size="sm" onClick={onResetZoom} className="px-2 h-8" title="إعادة ضبط">
        <RotateCw className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
      
      <Button variant="ghost" size="sm" onClick={onZoomIn} className="px-2 h-8" title="تكبير">
        <ZoomIn className="h-4 w-4" />
      </Button>

      {onRefresh && (
        <>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
          <Button variant="ghost" size="sm" onClick={onRefresh} className="px-2 h-8" title="إعادة تحميل الصورة">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default ZoomControls;
