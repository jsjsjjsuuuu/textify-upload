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
  return;
};
export default DataCompletionIndicator;