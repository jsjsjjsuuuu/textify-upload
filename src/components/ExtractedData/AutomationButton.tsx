
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageData } from "@/types/ImageData";
import { AutomationService } from "@/utils/automationService";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AutomationButtonProps {
  image: ImageData;
}

const AutomationButton = ({ image }: AutomationButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // التحقق مما إذا كانت البيانات مكتملة بما يكفي لإرسالها إلى الأتمتة
  const hasRequiredData = !!image.code && !!image.senderName && !!image.phoneNumber;
  
  const handleAutomation = async () => {
    if (!hasRequiredData) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى التأكد من استخراج جميع البيانات المطلوبة (الكود، اسم المرسل، رقم الهاتف) قبل بدء الأتمتة",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // التحقق من اتصال الخادم أولاً
      await AutomationService.checkServerStatus(false);
      
      // تحضير البيانات لصفحة الأتمتة
      localStorage.setItem('automationData', JSON.stringify({
        code: image.code,
        senderName: image.senderName,
        phoneNumber: image.phoneNumber,
        province: image.province,
        price: image.price,
        companyName: image.companyName,
        address: image.address,
        notes: image.notes,
        sourceId: image.id
      }));
      
      // الانتقال إلى صفحة الأتمتة
      navigate("/server-automation");
      
      toast({
        title: "تم إرسال البيانات بنجاح",
        description: "تم إرسال البيانات المستخرجة إلى صفحة الأتمتة، يمكنك الآن تكوين سيناريو الأتمتة",
      });
    } catch (error) {
      console.error("خطأ في إعداد الأتمتة:", error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بخادم الأتمتة. يرجى التحقق من إعدادات الخادم والمحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }} 
      whileTap={{ scale: 0.95 }}
      className="inline-block" // إضافة هذه الخاصية لضمان العرض الصحيح
    >
      <Button
        onClick={handleAutomation}
        disabled={isLoading || !hasRequiredData}
        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
        size="lg" // تغيير حجم الزر ليكون أكبر وأكثر بروزًا
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري الإعداد...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>تعبئة البيانات تلقائيًا</span>
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default AutomationButton;
