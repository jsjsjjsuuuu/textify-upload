
import { MutableRefObject } from "react";
import ImageErrorHandler from "@/components/common/ImageErrorHandler";

interface DraggableImageCoreProps {
  imageRef: MutableRefObject<HTMLImageElement | null>;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  previewUrl: string;
  zoomLevel: number;
  position: { x: number; y: number };
  isDragging: boolean;
  imgError: boolean;
  isRetrying: boolean;
  errorType: "network" | "format" | "access" | "general";
  retryCount: number;
  imageId: string;
  status: "processing" | "completed" | "error";
  submitted?: boolean;
  number?: number;
  onImageClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onImageError: () => void;
  onRetryLoadImage: () => void;
}

const DraggableImageCore = ({
  imageRef,
  containerRef,
  previewUrl,
  zoomLevel,
  position,
  isDragging,
  imgError,
  isRetrying,
  errorType,
  retryCount,
  imageId,
  status,
  submitted,
  number,
  onImageClick,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onImageError,
  onRetryLoadImage
}: DraggableImageCoreProps) => {
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[420px] overflow-hidden bg-transparent cursor-move flex items-center justify-center" 
      onClick={onImageClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <img 
        ref={imageRef}
        src={previewUrl} 
        alt="صورة محملة" 
        className="w-full h-full object-contain transition-transform duration-150" 
        style={{ 
          transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
          maxHeight: '100%',
          maxWidth: '100%',
          transformOrigin: 'center',
          pointerEvents: 'none', // منع الصورة من التقاط أحداث الماوس
          willChange: 'transform', // تحسين للتحويلات
          display: imgError ? 'none' : 'block',
        }} 
        onError={onImageError}
        crossOrigin="anonymous"
      />
      
      {imgError && (
        <ImageErrorHandler 
          imageId={imageId}
          onRetry={onRetryLoadImage}
          retryCount={retryCount}
          maxRetries={2}
          isLoading={isRetrying}
          errorType={errorType}
          fadeIn={true}
        />
      )}
      
      <div className="absolute top-1 right-1 bg-brand-brown text-white px-2 py-1 rounded-full text-xs">
        صورة {number}
      </div>
      
      {status === "processing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          <span className="text-xs">جاري المعالجة...</span>
        </div>
      )}
      
      {status === "completed" && (
        <div className="absolute top-1 left-1 bg-green-500 text-white p-1 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
      )}
      
      {status === "error" && (
        <div className="absolute top-1 left-1 bg-destructive text-white p-1 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
      )}
      
      {submitted && (
        <div className="absolute bottom-1 right-1 bg-brand-green text-white px-1.5 py-0.5 rounded-md text-[10px]">
          تم الإرسال
        </div>
      )}
    </div>
  );
};

export default DraggableImageCore;
