
import React from 'react';
import { ImageData } from "@/types/ImageData";
import { CheckCircle, AlertCircle } from "lucide-react";

interface DataCompletionIndicatorProps {
  image: ImageData;
}

const DataCompletionIndicator = ({
  image
}: DataCompletionIndicatorProps) => {
  // التحقق من اكتمال البيانات المطلوبة
  const isAllDataComplete = !!(image.code && image.senderName && image.phoneNumber && image.province && image.price);

  // التحقق من صحة رقم الهاتف
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;

  return (
    <div dir="rtl" className="mt-4 p-2 rounded-md bg-muted/50">
      <h4 className="text-xs font-medium mb-1 text-center">الحقول المطلوبة للإرسال</h4>
      <div className="grid grid-cols-2 gap-1 text-xs text-right">
        <div className={`flex items-center ${image.code ? 'text-green-600' : 'text-amber-600'}`}>
          <span className="ml-1">{image.code ? '✓' : '•'}</span>
          <span>الكود</span>
        </div>
        <div className={`flex items-center ${image.senderName ? 'text-green-600' : 'text-amber-600'}`}>
          <span className="ml-1">{image.senderName ? '✓' : '•'}</span>
          <span>اسم المرسل</span>
        </div>
        <div className={`flex items-center ${image.phoneNumber && isPhoneNumberValid ? 'text-green-600' : 'text-amber-600'}`}>
          <span className="ml-1">{image.phoneNumber && isPhoneNumberValid ? '✓' : '•'}</span>
          <span>رقم الهاتف</span>
        </div>
        <div className={`flex items-center ${image.province ? 'text-green-600' : 'text-amber-600'}`}>
          <span className="ml-1">{image.province ? '✓' : '•'}</span>
          <span>المحافظة</span>
        </div>
        <div className={`flex items-center ${image.price ? 'text-green-600' : 'text-amber-600'}`}>
          <span className="ml-1">{image.price ? '✓' : '•'}</span>
          <span>السعر</span>
        </div>
      </div>
    </div>
  );
};

export default DataCompletionIndicator;
