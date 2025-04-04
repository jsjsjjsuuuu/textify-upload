
import React from 'react';
import { ImageData } from '@/types/ImageData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, Send, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ImageDataForm from '../ImageList/ImageDataForm';
import ActionButtons from '../ImageList/ActionButtons';

interface ImageModalProps {
  image: ImageData;
  isSubmitting: boolean;
  onClose: () => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
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
  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
  // التحقق من اكتمال جميع الحقول المطلوبة
  const isAllFieldsFilled = !!(
    image.code && 
    image.senderName && 
    image.phoneNumber && 
    image.province && 
    image.price && 
    isPhoneNumberValid
  );
  
  // تنزيل الصورة
  const handleDownload = () => {
    if (image.previewUrl) {
      const a = document.createElement('a');
      a.href = image.previewUrl;
      a.download = `receipt-image-${image.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="font-medium">عرض صورة الوصل</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 flex-grow overflow-hidden">
          {/* عرض الصورة */}
          <div className="bg-black relative overflow-hidden flex items-center justify-center">
            <img 
              src={image.previewUrl} 
              alt="صورة الوصل" 
              className="max-w-full max-h-full object-contain"
            />
            
            {/* الزر العائم لتنزيل الصورة */}
            <Button 
              variant="secondary" 
              size="sm" 
              className="absolute bottom-4 left-4 bg-white/80 hover:bg-white text-gray-800"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 ml-2" />
              تنزيل الصورة
            </Button>
            
            {/* شارة نوع الاستخراج */}
            <Badge 
              variant="secondary" 
              className="absolute top-4 left-4 bg-white/80 text-xs"
            >
              {image.extractionMethod === "gemini" ? "Gemini AI" : image.extractionMethod === "ocr" ? "OCR" : "غير معروف"}
            </Badge>
          </div>
          
          {/* نموذج البيانات */}
          <div className="bg-background p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="pb-2 border-b flex justify-between items-center">
                <h3 className="font-medium">البيانات المستخرجة</h3>
                <Badge variant={image.status === "completed" ? "success" : image.status === "error" ? "destructive" : "outline"}>
                  {image.status === "completed" ? "تمت المعالجة" : 
                   image.status === "error" ? "فشل" : 
                   image.status === "processing" ? "قيد المعالجة" : "في الانتظار"}
                </Badge>
              </div>
              
              {/* نموذج البيانات */}
              <ImageDataForm 
                image={image}
                onTextChange={onTextChange}
              />
              
              {/* أزرار الإجراءات */}
              <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete(image.id);
                    onClose();
                  }}
                  className="flex-shrink-0"
                >
                  <Trash className="h-4 w-4 ml-2" />
                  حذف
                </Button>
                
                <Button
                  disabled={isSubmitting || !isAllFieldsFilled || !isPhoneNumberValid}
                  onClick={() => onSubmit(image.id)}
                  className="ml-auto flex-shrink-0"
                >
                  {isSubmitting ? "جاري الإرسال..." : "إرسال"}
                  <Send className="h-4 w-4 mr-2" />
                </Button>
              </div>
              
              {/* معلومات إضافية */}
              {image.date && (
                <div className="text-xs text-muted-foreground p-2 mt-4 border rounded bg-muted/20">
                  <p>معرف الصورة: {image.id}</p>
                  <p>تاريخ الإضافة: {formatDate(image.date)}</p>
                  {image.confidence && <p>مستوى الثقة: {image.confidence}%</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
