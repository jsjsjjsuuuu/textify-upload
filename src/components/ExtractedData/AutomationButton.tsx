
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";

interface AutomationButtonProps {
  image: ImageData;
}

const AutomationButton = ({
  image
}: AutomationButtonProps) => {
  const navigate = useNavigate();

  // وظيفة التنقل إلى صفحة الأتمتة مع معلومات الصورة
  const handleAutomationClick = () => {
    if (image?.id) {
      navigate(`/automation/${image.id}`);
    }
  };

  // التحقق من وجود البيانات المطلوبة للأتمتة
  const hasRequiredData = !!image.code && !!image.senderName && !!image.phoneNumber;
  
  // التحقق من صحة رقم الهاتف
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  
  // تحديد حالة البيانات المطلوبة
  const automationDataStatus = () => {
    if (!hasRequiredData) {
      return "missing";
    }
    if (!isPhoneNumberValid) {
      return "invalid";
    }
    return "complete";
  };
  
  const status = automationDataStatus();
  
  return (
    <div className="flex flex-col gap-2 items-center">
      <motion.div 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        className="inline-block"
      >
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center transition-colors ${
            status === "complete" 
              ? "text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700" 
              : "text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
          }`}
          disabled={!hasRequiredData || !isPhoneNumberValid}
          onClick={handleAutomationClick}
        >
          {status === "complete" ? (
            <CheckCircle2 size={16} className="ml-2" />
          ) : (
            <AlertCircle size={16} className="ml-2" />
          )}
          <span>
            {status === "complete" 
              ? "بدء الأتمتة" 
              : status === "invalid" 
                ? "بيانات غير صحيحة"
                : "بيانات غير مكتملة"}
          </span>
        </Button>
      </motion.div>
      
      {status !== "complete" && (
        <p className="text-xs text-center text-muted-foreground">
          {status === "invalid" 
            ? "تأكد من صحة رقم الهاتف أولاً"
            : "أكمل البيانات الأساسية أولاً"}
        </p>
      )}
    </div>
  );
};

export default AutomationButton;
