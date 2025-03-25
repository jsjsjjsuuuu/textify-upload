
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";

interface AutomationButtonProps {
  image: ImageData;
}

const AutomationButton = ({ image }: AutomationButtonProps) => {
  const navigate = useNavigate();
  
  // وظيفة التنقل إلى صفحة الأتمتة مع معلومات الصورة
  const handleAutomationClick = () => {
    if (image?.id) {
      navigate(`/automation/${image.id}`);
    }
  };
  
  // التحقق من وجود البيانات المطلوبة للأتمتة
  const hasRequiredData = !!image.code && !!image.senderName && !!image.phoneNumber;
  
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
          className={`gap-2 ${!hasRequiredData ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'}`}
          disabled={!hasRequiredData}
          onClick={handleAutomationClick}
        >
          <PlayCircle className="w-4 h-4" />
          <span>تشغيل الأتمتة</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default AutomationButton;
