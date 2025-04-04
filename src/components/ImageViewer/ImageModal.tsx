
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageData } from '@/types/ImageData';
import { Button } from '@/components/ui/button';
import { X, Save, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExtractedDataEditor from '@/components/ExtractedData/ExtractedDataEditor';
import RawTextViewer from '@/components/ExtractedData/RawTextViewer';
import ImageViewer from '@/components/ImagePreview/ImageViewer/ImageViewer';

interface ImageModalProps {
  image: ImageData;
  isSubmitting: boolean;
  onClose: () => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit?: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  image,
  isSubmitting,
  onClose,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('preview');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // التعامل مع زيادة التكبير
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  // التعامل مع تقليل التكبير
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  // إعادة ضبط مستوى التكبير
  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // التعامل مع الإغلاق
  const handleClose = () => {
    onClose();
  };

  // التعامل مع الحذف
  const handleDelete = () => {
    onDelete(image.id);
    onClose();
  };

  // التعامل مع الإرسال
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(image.id);
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              {image.code ? `معاينة الوصل #${image.code}` : 'معاينة الصورة'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Tabs defaultValue="preview" value={selectedTab} onValueChange={setSelectedTab} className="mt-2">
            <TabsList>
              <TabsTrigger value="preview">معاينة الصورة</TabsTrigger>
              <TabsTrigger value="data">البيانات المستخرجة</TabsTrigger>
              <TabsTrigger value="text">النص المستخرج</TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-0">
          <TabsContent value="preview" className="h-full m-0 p-0 flex-1">
            <div className="h-full flex justify-center items-center p-4">
              <ImageViewer
                selectedImage={image}
                zoomLevel={zoomLevel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                formatDate={formatDate}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="h-full m-0 p-4 flex-1">
            <ExtractedDataEditor
              image={image}
              onTextChange={onTextChange}
            />
          </TabsContent>
          
          <TabsContent value="text" className="h-full m-0 p-4 flex-1">
            <RawTextViewer text={image.extractedText} />
          </TabsContent>
        </div>
        
        <DialogFooter className="p-4 border-t">
          <div className="flex justify-between w-full">
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف
            </Button>
            
            {onSubmit && (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || image.submitted}
              >
                <Save className="h-4 w-4 mr-2" />
                {image.submitted ? 'تم الإرسال' : 'إرسال البيانات'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
