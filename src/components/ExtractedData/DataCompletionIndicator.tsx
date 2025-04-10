
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
  
  // إذا كانت البيانات غير مكتملة أو رقم الهاتف غير صالح، أظهر رسالة تحذير
  if (!isAllDataComplete || !isPhoneNumberValid) {
    return (
      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md" dir="rtl">
        <div className="flex items-center text-amber-600 dark:text-amber-400">
          <AlertCircle size={18} className="ml-2" />
          <div className="text-sm">
            {!isAllDataComplete ? (
              <span>يرجى إكمال جميع الحقول المطلوبة للمتابعة</span>
            ) : (
              <span>رقم الهاتف يجب أن يكون 11 رقم</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // إذا كانت البيانات مكتملة ورقم الهاتف صالح، أظهر رسالة نجاح
  return (
    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md" dir="rtl">
      <div className="flex items-center text-green-600 dark:text-green-400">
        <CheckCircle size={18} className="ml-2" />
        <div className="text-sm">تم إكمال جميع البيانات المطلوبة</div>
      </div>
    </div>
  );
};

export default DataCompletionIndicator;
