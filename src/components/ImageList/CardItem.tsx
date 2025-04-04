
import { useState, useEffect } from "react";
import { ImageData } from "@/types/ImageData";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, Send, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CardItemProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
  showBatchArrow?: boolean;
  isFirstInBatch?: boolean;
  isLastInBatch?: boolean;
  onReprocess?: (id: string) => Promise<void>;
}

const CardItem = ({
  image,
  isSubmitting,
  onImageClick,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
  showBatchArrow = false,
  isFirstInBatch = false,
  isLastInBatch = false,
  onReprocess
}: CardItemProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(image.previewUrl || null);
  
  // تحديث URL الصورة عند تغيير الصورة
  useEffect(() => {
    if (image.previewUrl) {
      setImageUrl(`${image.previewUrl}?t=${Date.now()}`);
      setImageError(false);
    } else {
      setImageUrl(null);
    }
  }, [image.id, image.previewUrl]);

  const handleReprocess = async () => {
    if (!onReprocess) return;
    
    setIsLoading(true);
    try {
      await onReprocess(image.id);
    } finally {
      setIsLoading(false);
    }
  };
  
  // إعادة تحميل الصورة عند حدوث خطأ
  const handleRetryLoadImage = () => {
    setImageError(false);
    if (image.previewUrl) {
      // إضافة معلمة وقت لمنع التخزين المؤقت
      setImageUrl(`${image.previewUrl}?t=${Date.now()}`);
    }
  };

  return (
    <Card className="relative">
      {/* سهم الدفعة */}
      {showBatchArrow && !isLastInBatch && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 flex items-center justify-center bg-muted rounded-full z-10 border-2 border-background">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base mb-0">
            {image.file?.name || "صورة"}
            {image.number && (
              <Badge variant="outline" className="ml-2">
                #{image.number}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-1 space-x-reverse">
            {/* زر إعادة المعالجة */}
            {image.status && onReprocess && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleReprocess}
                disabled={isLoading || image.status === 'processing'}
                title="إعادة معالجة الصورة"
                className="h-7 w-7 mr-1"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            {/* زر الحذف */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => onDelete(image.id)}
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              title="حذف الصورة"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* شارات الحالة */}
        <div className="flex flex-wrap gap-1 mt-2">
          {image.extractionMethod && (
            <Badge variant={image.extractionMethod === 'gemini' ? "default" : "secondary"} className="text-xs">
              {image.extractionMethod === 'gemini' ? 'Gemini AI' : 'OCR'}
            </Badge>
          )}
          
          <Badge 
            variant={
              image.status === 'completed' ? "success" : 
              image.status === 'error' ? "destructive" : 
              "secondary"
            } 
            className="text-xs"
          >
            {image.status === 'completed' ? 'مكتمل' : 
             image.status === 'error' ? 'خطأ' : 
             image.status === 'processing' ? 'قيد المعالجة' : 'معلق'}
          </Badge>
          
          {image.date && (
            <Badge variant="outline" className="text-xs">
              {formatDate(image.date)}
            </Badge>
          )}
          
          {image.submitted && (
            <Badge variant="success" className="text-xs">
              تم الإرسال
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* معاينة الصورة */}
        <div 
          className="relative h-48 bg-muted rounded-md overflow-hidden cursor-pointer flex items-center justify-center"
          onClick={() => onImageClick(image)}
        >
          {!imageError && imageUrl ? (
            <img 
              src={imageUrl} 
              alt={image.file?.name || "صورة"} 
              className="h-full w-full object-contain"
              onError={() => setImageError(true)} 
              onLoad={() => console.log("تم تحميل الصورة", image.id)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50" />
              <div className="text-xs text-muted-foreground mt-2">
                {imageError ? "فشل تحميل الصورة" : "الصورة غير متاحة"}
              </div>
              {imageError && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetryLoadImage();
                  }}
                >
                  إعادة تحميل
                </Button>
              )}
            </div>
          )}
          
          {/* شارة الثقة */}
          {image.confidence && !imageError && imageUrl && (
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs">
              الدقة: {image.confidence}%
            </div>
          )}
        </div>
        
        {/* حقول البيانات */}
        <div className="md:col-span-2 grid grid-cols-1 gap-3">
          {/* حقل الكود */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label htmlFor={`code-${image.id}`} className="text-sm font-medium">
              الكود:
            </label>
            <Input
              id={`code-${image.id}`}
              className="col-span-2"
              value={image.code || ""}
              onChange={(e) => onTextChange(image.id, "code", e.target.value)}
            />
          </div>
          
          {/* حقل اسم المرسل */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label htmlFor={`senderName-${image.id}`} className="text-sm font-medium">
              اسم المرسل:
            </label>
            <Input
              id={`senderName-${image.id}`}
              className="col-span-2"
              value={image.senderName || ""}
              onChange={(e) => onTextChange(image.id, "senderName", e.target.value)}
            />
          </div>
          
          {/* حقل رقم الهاتف */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label htmlFor={`phoneNumber-${image.id}`} className="text-sm font-medium">
              رقم الهاتف:
            </label>
            <Input
              id={`phoneNumber-${image.id}`}
              className="col-span-2"
              value={image.phoneNumber || ""}
              onChange={(e) => onTextChange(image.id, "phoneNumber", e.target.value)}
            />
          </div>
          
          {/* حقل المحافظة */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label htmlFor={`province-${image.id}`} className="text-sm font-medium">
              المحافظة:
            </label>
            <Input
              id={`province-${image.id}`}
              className="col-span-2"
              value={image.province || ""}
              onChange={(e) => onTextChange(image.id, "province", e.target.value)}
            />
          </div>
          
          {/* حقل السعر */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label htmlFor={`price-${image.id}`} className="text-sm font-medium">
              السعر:
            </label>
            <Input
              id={`price-${image.id}`}
              className="col-span-2"
              value={image.price || ""}
              onChange={(e) => onTextChange(image.id, "price", e.target.value)}
            />
          </div>
          
          {/* حقل اسم الشركة */}
          <div className="grid grid-cols-3 items-center gap-2">
            <label htmlFor={`companyName-${image.id}`} className="text-sm font-medium">
              اسم الشركة:
            </label>
            <Input
              id={`companyName-${image.id}`}
              className="col-span-2"
              value={image.companyName || ""}
              onChange={(e) => onTextChange(image.id, "companyName", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button
          onClick={() => onSubmit(image.id)}
          disabled={isSubmitting || image.submitted}
          className={`w-full ${image.submitted ? 'bg-green-500 hover:bg-green-600' : ''}`}
        >
          <Send className="h-4 w-4 ml-2" />
          {image.submitted ? 'تم الإرسال' : 'إرسال البيانات'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CardItem;
