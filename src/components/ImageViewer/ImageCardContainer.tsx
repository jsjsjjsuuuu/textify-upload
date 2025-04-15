import React from 'react';
import { ImageData } from '@/types/ImageData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Send, Trash, AlertOctagon } from 'lucide-react';
import { formatBytes } from '@/utils/formatters';

interface ImageCardContainerProps {
  image: ImageData;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  isSubmitting: boolean;
}

const ImageCardContainer: React.FC<ImageCardContainerProps> = ({
  image,
  onDelete,
  onSubmit,
  isSubmitting
}) => {
  const getStatusBadgeProps = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return {
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          label: 'قيد الانتظار'
        };
      case 'processing':
        return {
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          label: 'جاري المعالجة'
        };
      case 'processed':
      case 'completed':
        return {
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          label: 'تمت المعالجة'
        };
      case 'error':
        return {
          className: 'bg-red-100 text-red-800 hover:bg-red-200',
          label: 'خطأ'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
          label: 'غير معروف'
        };
    }
  };

  const statusProps = getStatusBadgeProps(image.status);

  return (
    <Card className="bg-card/90 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg">{image.fileName || 'صورة بدون اسم'}</h3>
            <Badge className={statusProps.className}>{statusProps.label}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">الحجم:</span>{' '}
              <span className="font-medium">{formatBytes(image.fileSize || 0)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">النوع:</span>{' '}
              <span className="font-medium">{image.fileType || 'غير معروف'}</span>
            </div>
          </div>
          
          {image.status === 'error' && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertOctagon className="h-4 w-4" />
              <span className="text-xs">{image.errorMessage || 'حدث خطأ أثناء معالجة الصورة'}</span>
            </div>
          )}
          
          {image.status === 'processing' && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>جاري المعالجة...</span>
                <span>{image.processingProgress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full" 
                  style={{ width: `${image.processingProgress || 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t bg-card/50 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(image.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash className="h-4 w-4 mr-1" />
          <span>حذف</span>
        </Button>
        
        <div className="flex gap-2">
          {image.status === 'error' && (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-500 hover:text-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              <span>إعادة المحاولة</span>
            </Button>
          )}
          
          <Button
            variant="default"
            size="sm"
            disabled={image.status !== 'completed' && image.status !== 'processed' || isSubmitting}
            onClick={() => onSubmit(image.id)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                <span>إرسال</span>
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ImageCardContainer;
