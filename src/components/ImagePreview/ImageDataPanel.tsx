
import React from 'react';
import { ImageData } from '@/types/ImageData';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Send, ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageDataPanelProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => Promise<void> | void;
  onSubmit: (id: string) => void;
  isSubmitting: boolean;
  reprocessButton?: React.ReactNode;
}

const ImageDataPanel: React.FC<ImageDataPanelProps> = ({
  image,
  onTextChange,
  onDelete,
  onSubmit,
  isSubmitting,
  reprocessButton
}) => {
  // تعريف الحقول المراد عرضها وتحريرها
  const fields = [
    { id: 'number', label: 'رقم الإيصال', placeholder: 'أدخل رقم الإيصال' },
    { id: 'code', label: 'الكود', placeholder: 'أدخل كود الإيصال' },
    { id: 'senderName', label: 'اسم المرسل', placeholder: 'أدخل اسم المرسل' },
    { id: 'phoneNumber', label: 'رقم الهاتف', placeholder: 'أدخل رقم الهاتف' },
    { id: 'province', label: 'المحافظة', placeholder: 'أدخل المحافظة' },
    { id: 'price', label: 'السعر', placeholder: 'أدخل السعر' },
  ];

  // عرض المعلومات النصية المستخرجة إذا وجدت
  const renderExtractedText = () => {
    if (!image.extractedText) return <p className="text-muted-foreground text-center p-4">لا يوجد نص مستخرج</p>;
    
    return (
      <pre className="bg-muted p-3 rounded-md overflow-auto max-h-[300px] text-xs font-mono whitespace-pre-wrap">
        {image.extractedText}
      </pre>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            تفاصيل الصورة
            {image.status === 'processing' && (
              <span className="mr-2 inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                قيد المعالجة
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {reprocessButton}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(image.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              حذف
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="data">
          <TabsList className="mb-4">
            <TabsTrigger value="data">البيانات المستخرجة</TabsTrigger>
            <TabsTrigger value="image">الصورة</TabsTrigger>
            <TabsTrigger value="text">النص المستخرج</TabsTrigger>
          </TabsList>
          
          <TabsContent value="data" className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="grid gap-1.5">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  value={(image[field.id] || '') as string}
                  onChange={(e) => onTextChange(image.id, field.id, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="image">
            {image.previewUrl ? (
              <div className="border rounded-md p-2 flex items-center justify-center max-h-80 overflow-auto">
                <img
                  src={image.previewUrl}
                  alt="معاينة الصورة"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-2" />
                <p>لا توجد صورة متاحة</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="text">
            {renderExtractedText()}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {image.status === 'completed' && !image.submitted && (
        <CardFooter className="justify-end">
          <Button 
            onClick={() => onSubmit(image.id)} 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال البيانات'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ImageDataPanel;
