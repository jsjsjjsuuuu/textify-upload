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
  return <div className="flex flex-col gap-2 items-center">
      <motion.div whileHover={{
      scale: 1.05
    }} whileTap={{
      scale: 0.95
    }} className="inline-block">
        
      </motion.div>
      
      {status !== "complete" && <p className="text-xs text-center text-muted-foreground">
          {status === "invalid" ? "تأكد من صحة رقم الهاتف أولاً" : "أكمل البيانات الأساسية أولاً"}
        </p>}
    </div>;
};
export default AutomationButton;