
import { useState } from "react";
import { ImageData } from "@/types/ImageData";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePreview } from "@/components/ImagePreview";

interface ImageViewerProps {
  image: ImageData;
  isOpen: boolean;
  onClose: () => void;
}

const ImageViewer = ({ image, isOpen, onClose }: ImageViewerProps) => {
  const [activeTab, setActiveTab] = useState<string>("image");
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <Tabs defaultValue="image" value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="flex items-center justify-between border-b p-2">
            <TabsList>
              <TabsTrigger value="image">الصورة</TabsTrigger>
              <TabsTrigger value="data">البيانات المستخرجة</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="image" className="h-[calc(90vh-80px)] overflow-auto">
            <div className="h-full flex items-center justify-center bg-gray-900/5 dark:bg-gray-900/50">
              <ImagePreview
                selectedImage={image}
                zoomLevel={zoomLevel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                formatDate={formatDate}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="h-[calc(90vh-80px)] overflow-auto p-4">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">البيانات المستخرجة</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {image.senderName && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">اسم المرسل:</p>
                    <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{image.senderName}</p>
                  </div>
                )}
                
                {image.phoneNumber && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">رقم الهاتف:</p>
                    <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{image.phoneNumber}</p>
                  </div>
                )}
                
                {image.secondaryPhoneNumber && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">رقم الهاتف الثانوي:</p>
                    <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{image.secondaryPhoneNumber}</p>
                  </div>
                )}
                
                {image.province && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">المحافظة:</p>
                    <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{image.province}</p>
                  </div>
                )}
                
                {image.price && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">السعر:</p>
                    <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{image.price}</p>
                  </div>
                )}
                
                {image.companyName && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">اسم الشركة:</p>
                    <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{image.companyName}</p>
                  </div>
                )}
                
                {image.code && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">الرمز:</p>
                    <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{image.code}</p>
                  </div>
                )}
              </div>
              
              {image.extractedText && (
                <div className="space-y-1 mt-4">
                  <p className="text-sm font-medium">النص المستخرج:</p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm max-h-[300px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{image.extractedText}</pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;
