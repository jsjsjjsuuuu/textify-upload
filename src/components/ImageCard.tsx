
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Edit, Trash, Send, ZoomIn, AlertCircle } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { ExtractedDataEditor } from "@/components/ExtractedData";

interface ImageCardProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImageCard = ({ 
  image, 
  isSubmitting, 
  onImageClick, 
  onTextChange, 
  onDelete, 
  onSubmit, 
  formatDate 
}: ImageCardProps) => {
  const [showFullData, setShowFullData] = useState(false);

  // التحقق من صحة رقم الهاتف (يجب أن يكون 11 رقماً)
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;

  console.log("ImageCard rendering with data:", image);

  return (
    <Card className="p-4 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-transparent border-none backdrop-blur-sm" dir="rtl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div 
            className="relative w-full md:w-[300px] h-[200px] rounded-lg overflow-hidden bg-transparent group cursor-pointer" 
            onClick={() => onImageClick(image)}
          >
            <img 
              src={image.previewUrl} 
              alt="صورة محملة" 
              className="w-full h-full object-contain" 
              style={{ mixBlendMode: 'multiply' }} 
            />
            <div className="absolute top-1 left-1 bg-brand-brown text-white px-2 py-1 rounded-full text-xs">
              صورة {image.number}
            </div>
            {image.status === "processing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <span className="text-xs">جاري المعالجة...</span>
              </div>
            )}
            {image.status === "completed" && (
              <div className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full">
                <Check size={12} />
              </div>
            )}
            {image.status === "error" && (
              <div className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full">
                <X size={12} />
              </div>
            )}
            {image.submitted && (
              <div className="absolute bottom-1 right-1 bg-brand-green text-white px-1.5 py-0.5 rounded-md text-[10px]">
                تم الإرسال
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 p-1 rounded-full">
                <ZoomIn size={20} className="text-brand-brown" />
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-muted-foreground">
                {formatDate(image.date)}
              </p>
              {image.confidence !== undefined && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  دقة الاستخراج: {Math.round(image.confidence)}%
                </span>
              )}
            </div>
            
            {showFullData ? (
              <div className="mb-2">
                <ExtractedDataEditor 
                  image={image}
                  onTextChange={onTextChange}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullData(false)}
                  className="mt-2 text-xs w-full"
                >
                  عرض ملخص البيانات ↑
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium mb-1">الكود:</label>
                    <div className="bg-gray-50 rounded p-1.5 text-sm border min-h-[34px]">
                      {image.code || <span className="text-gray-400 text-xs">غير متوفر</span>}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium mb-1">اسم المرسل:</label>
                    <div className="bg-gray-50 rounded p-1.5 text-sm border min-h-[34px]">
                      {image.senderName || <span className="text-gray-400 text-xs">غير متوفر</span>}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium mb-1 flex items-center justify-between">
                      <span>رقم الهاتف:</span>
                      {image.phoneNumber && !isPhoneNumberValid && (
                        <span className="text-xs text-destructive font-normal flex items-center">
                          <AlertCircle size={12} className="mr-1" /> رقم غير صحيح
                        </span>
                      )}
                    </label>
                    <div className={`rounded p-1.5 text-sm border min-h-[34px] ${image.phoneNumber && !isPhoneNumberValid ? 'bg-red-50 border-destructive/30' : 'bg-gray-50'}`}>
                      {image.phoneNumber || <span className="text-gray-400 text-xs">غير متوفر</span>}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium mb-1">المحافظة:</label>
                    <div className="bg-gray-50 rounded p-1.5 text-sm border min-h-[34px]">
                      {image.province || <span className="text-gray-400 text-xs">غير متوفر</span>}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullData(true)}
                  className="text-xs w-full"
                >
                  عرض جميع البيانات والتحرير ↓
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(image.id)} 
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
          >
            <Trash size={16} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowFullData(!showFullData)}
            className="h-8 w-8 text-muted-foreground hover:bg-accent/50"
          >
            <Edit size={16} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-brand-green hover:bg-brand-green/10" 
            disabled={image.status !== "completed" || isSubmitting || image.submitted || (image.phoneNumber && !isPhoneNumberValid)} 
            onClick={() => onSubmit(image.id)}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ImageCard;
