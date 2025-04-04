
import React from 'react';
import { X } from 'lucide-react';
import { ImageData } from '@/types/ImageData';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  image: ImageData;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center p-4">
      <div className="relative bg-card rounded-lg overflow-hidden shadow-lg max-w-4xl w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium text-lg">معاينة الصورة</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2">
            {image.previewUrl && (
              <div className="rounded-md overflow-hidden border max-h-[60vh]">
                <img 
                  src={image.previewUrl} 
                  alt="معاينة الصورة" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
          
          <div className="md:w-1/2 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">النص المستخرج:</h4>
              <div className="bg-muted/50 p-3 rounded-md text-sm max-h-[15vh] overflow-y-auto">
                {image.extractedText || "لم يتم استخراج أي نص"}
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">الكود:</h4>
                <p className="bg-muted/50 p-2 rounded">{image.code || "غير متوفر"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">اسم المرسل:</h4>
                <p className="bg-muted/50 p-2 rounded">{image.senderName || "غير متوفر"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">رقم الهاتف:</h4>
                <p className="bg-muted/50 p-2 rounded">{image.phoneNumber || "غير متوفر"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">المحافظة:</h4>
                <p className="bg-muted/50 p-2 rounded">{image.province || "غير متوفر"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">السعر:</h4>
                <p className="bg-muted/50 p-2 rounded">{image.price || "غير متوفر"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
