import React from 'react';
import { ImageData } from '@/types/ImageData';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageViewerProps {
  image: ImageData;
  onTextChange: (field: string, value: string) => void;
  onSubmit: (id: string) => Promise<boolean>;
  isSubmitting: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ image, onTextChange, onSubmit, isSubmitting }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>معلومات الصورة</CardTitle>
        <CardDescription>
          <div className="flex items-center space-x-2">
            <span>
              {image.fileName || 'صورة غير معروفة'}
            </span>
            <Badge variant={(image.extractionMethod === "ocr" || image.extractionMethod === "gemini") ? 
              (image.extractionMethod === "ocr" ? "outline" : "secondary") : 
              "outline"}>
              {image.extractionMethod || "ocr"}
            </Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="code">الكود</Label>
          <Input
            id="code"
            value={image.code || ''}
            onChange={(e) => onTextChange('code', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="senderName">اسم المرسل</Label>
          <Input
            id="senderName"
            value={image.senderName || ''}
            onChange={(e) => onTextChange('senderName', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phoneNumber">رقم الهاتف</Label>
          <Input
            id="phoneNumber"
            value={image.phoneNumber || ''}
            onChange={(e) => onTextChange('phoneNumber', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="province">المحافظة</Label>
          <Input
            id="province"
            value={image.province || ''}
            onChange={(e) => onTextChange('province', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price">السعر</Label>
          <Input
            id="price"
            value={image.price || ''}
            onChange={(e) => onTextChange('price', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="companyName">اسم الشركة</Label>
          <Input
            id="companyName"
            value={image.companyName || ''}
            onChange={(e) => onTextChange('companyName', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="extractedText">النص المستخرج</Label>
          <Textarea
            id="extractedText"
            value={image.extractedText || ''}
            className="min-h-[80px]"
            onChange={(e) => onTextChange('extractedText', e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button disabled={isSubmitting} onClick={() => onSubmit(image.id)}>
          {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImageViewer;
