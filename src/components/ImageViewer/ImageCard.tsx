
import React from 'react';
import { ImageData } from '@/types/ImageData';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, Loader2, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface ImageCardProps {
  image: ImageData;
  isSubmitting: boolean;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  isSubmitting,
  onTextChange,
  onDelete,
  onSubmit,
  formatDate,
}) => {
  // وظيفة معالجة تغييرات النص
  const handleTextChange = (field: string, value: string) => {
    onTextChange(image.id, field, value);
  };

  // وظيفة عرض بطاقة الحالة
  const getStatusBadge = () => {
    if (image.submitted) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/40">
          <Check className="h-3 w-3 mr-1" /> تم الإرسال
        </Badge>
      );
    }

    switch (image.status) {
      case 'processing':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> قيد المعالجة
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/40">
            <Check className="h-3 w-3 mr-1" /> مكتمل
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800/40">
            <AlertCircle className="h-3 w-3 mr-1" /> خطأ
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800/40">
            انتظار
          </Badge>
        );
    }
  };

  // وظيفة التحقق من اكتمال البيانات الأساسية
  const isDataComplete = () => {
    return !!(
      image.code && 
      image.senderName && 
      image.phoneNumber && 
      image.province && 
      image.price
    );
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow transition-shadow">
      <div className="relative">
        {image.previewUrl && (
          <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 relative flex items-center justify-center">
            <img 
              src={image.previewUrl} 
              alt={`Preview ${image.id}`} 
              className="h-full w-full object-contain"
              style={{ maxHeight: '100%' }}
            />
            {getStatusBadge()}
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground mb-2">
            {formatDate(image.date)} - ID: {image.id.slice(0, 6)}...
          </div>
          
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium">الكود:</label>
              <Input 
                value={image.code || ''} 
                onChange={(e) => handleTextChange('code', e.target.value)} 
                placeholder="أدخل الكود"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">اسم المرسل:</label>
              <Input 
                value={image.senderName || ''} 
                onChange={(e) => handleTextChange('senderName', e.target.value)} 
                placeholder="أدخل اسم المرسل"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">رقم الهاتف:</label>
              <Input 
                value={image.phoneNumber || ''} 
                onChange={(e) => handleTextChange('phoneNumber', e.target.value)} 
                placeholder="أدخل رقم الهاتف"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">المحافظة:</label>
              <Input 
                value={image.province || ''} 
                onChange={(e) => handleTextChange('province', e.target.value)} 
                placeholder="أدخل المحافظة"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">السعر:</label>
              <Input 
                value={image.price || ''} 
                onChange={(e) => handleTextChange('price', e.target.value)} 
                placeholder="أدخل السعر"
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          {image.extractedText && (
            <div className="mt-4">
              <label className="text-sm font-medium">النص المستخرج:</label>
              <Textarea 
                value={image.extractedText} 
                onChange={(e) => handleTextChange('extractedText', e.target.value)} 
                placeholder="النص المستخرج من الصورة"
                className="h-24 text-xs"
              />
            </div>
          )}
          
          {image.error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded text-xs text-red-700 dark:text-red-400">
              <div className="font-medium">خطأ:</div>
              <div>{image.error}</div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(image.id)}
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onSubmit(image.id)} 
            disabled={isSubmitting || !isDataComplete() || image.submitted} 
            title={image.submitted ? "تم الإرسال بالفعل" : "إرسال"}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default ImageCard;
