
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageData } from "@/types/ImageData";
import { Trash2, SendHorizontal } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/dateFormatter";

interface ImageDetailsPanelProps {
  image: ImageData;
  onTextChange: (id: string, field: string, value: string) => void;
  onSubmit: (id: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  isSubmitting: boolean;
  isComplete: boolean;
  hasPhoneError: boolean;
}

const ImageDetailsPanel: React.FC<ImageDetailsPanelProps> = ({
  image,
  onTextChange,
  onSubmit,
  onDelete,
  isSubmitting,
  isComplete,
  hasPhoneError
}) => {
  // تحويل تاريخ الصورة إلى تنسيق مقروء
  const formattedDate = formatDate(image.date);
  
  // الحصول على حالة الصورة
  const statusText = () => {
    if (image.status === "pending") return "قيد الانتظار";
    if (image.status === "processing") return "قيد المعالجة";
    if (image.status === "completed") return "مكتمل";
    if (image.status === "error") return "خطأ";
    return "غير معروف";
  };
  
  const statusColor = () => {
    if (image.status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
    if (image.status === "processing") return "bg-blue-50 text-blue-700 border-blue-200";
    if (image.status === "completed") return "bg-green-50 text-green-700 border-green-200";
    if (image.status === "error") return "bg-red-50 text-red-700 border-red-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">تفاصيل الصورة</CardTitle>
          <Badge className={`${statusColor()} px-3 py-1 text-sm`}>
            {statusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* معاينة الصورة */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md mb-6">
          <div className="aspect-[4/3] relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
            <img 
              src={image.previewUrl} 
              alt="Preview" 
              className="object-contain w-full h-full"
            />
          </div>
        </div>
        
        {/* أقسام البيانات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1">رمز الكود</label>
            <Input
              id="code"
              value={image.code || ''}
              onChange={(e) => onTextChange(image.id, 'code', e.target.value)}
              placeholder="أدخل الكود"
              className="mb-4"
            />
            
            <label htmlFor="senderName" className="block text-sm font-medium mb-1">اسم المرسل</label>
            <Input
              id="senderName"
              value={image.senderName || ''}
              onChange={(e) => onTextChange(image.id, 'senderName', e.target.value)}
              placeholder="اسم المرسل"
              className="mb-4"
            />
            
            <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <Input
              id="phoneNumber"
              value={image.phoneNumber || ''}
              onChange={(e) => onTextChange(image.id, 'phoneNumber', e.target.value)}
              placeholder="رقم الهاتف"
              className={`mb-4 ${hasPhoneError ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {hasPhoneError && (
              <p className="text-red-500 text-xs mt-1 mb-4">يجب أن يكون رقم الهاتف 11 رقم بالضبط</p>
            )}
          </div>
          
          <div>
            <label htmlFor="province" className="block text-sm font-medium mb-1">المحافظة</label>
            <Input
              id="province"
              value={image.province || ''}
              onChange={(e) => onTextChange(image.id, 'province', e.target.value)}
              placeholder="المحافظة"
              className="mb-4"
            />
            
            <label htmlFor="price" className="block text-sm font-medium mb-1">السعر</label>
            <Input
              id="price"
              value={image.price || ''}
              onChange={(e) => onTextChange(image.id, 'price', e.target.value)}
              placeholder="السعر"
              className="mb-4"
            />
            
            <label htmlFor="companyName" className="block text-sm font-medium mb-1">اسم الشركة (اختياري)</label>
            <Input
              id="companyName"
              value={image.companyName || ''}
              onChange={(e) => onTextChange(image.id, 'companyName', e.target.value)}
              placeholder="اسم الشركة"
              className="mb-4"
            />
          </div>
        </div>
        
        {/* النص المستخرج */}
        {image.extractedText && (
          <div>
            <label htmlFor="extractedText" className="block text-sm font-medium mb-1">النص المستخرج</label>
            <Textarea
              id="extractedText"
              value={image.extractedText}
              readOnly
              className="h-32 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-sm"
            />
          </div>
        )}
        
        {/* معلومات إضافية */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md text-sm text-gray-600 dark:text-gray-400">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <span>تاريخ الإضافة:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>تم الإرسال:</span>
              <span>{image.submitted ? "نعم" : "لا"}</span>
            </div>
            <div className="flex justify-between">
              <span>المعرف:</span>
              <span className="font-mono text-xs">{image.id}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => onDelete(image.id)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 hover:border-destructive/30"
          title="سيتم إزالة الصورة من العرض فقط دون حذفها من قاعدة البيانات"
        >
          <Trash2 size={16} className="mr-2" />
          إزالة من العرض
        </Button>
        
        <Button 
          onClick={() => onSubmit(image.id)}
          disabled={!isComplete || isSubmitting || image.submitted || hasPhoneError}
          className={`${image.submitted ? 'bg-green-600 hover:bg-green-700' : ''}`}
        >
          <SendHorizontal size={16} className="mr-2" />
          {isSubmitting ? "جاري الإرسال..." : image.submitted ? "تم الإرسال" : "إرسال البيانات"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImageDetailsPanel;
