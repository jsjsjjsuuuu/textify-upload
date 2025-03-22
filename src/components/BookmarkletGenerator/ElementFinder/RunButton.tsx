
import React from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, Server } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";

interface RunButtonProps {
  isRunning: boolean;
  onRun: () => void;
}

const RunButton: React.FC<RunButtonProps> = ({ isRunning, onRun }) => {
  const { toast: hookToast } = useToast();
  
  const handleRun = () => {
    // تحسين رسائل التشخيص
    console.log("🚀 زر التنفيذ: بدء تنفيذ الأتمتة");
    console.log("📃 تأكد من أن الإجراءات مكتملة وصحيحة");
    console.log("🔍 تأكد من صحة المحددات CSS");
    console.log("🌐 جاري الاتصال بنقطة نهاية API: /api/automation/execute");
    
    // إظهار رسالة للمستخدم لتوضيح ما سيحدث
    if (!isRunning) {
      toast("بدء تنفيذ الأتمتة", {
        description: "جاري تنفيذ الإجراءات على الموقع المستهدف من خلال خادم الأتمتة الحقيقي.",
        icon: <Server className="h-5 w-5 text-blue-500" />,
        duration: 5000,
      });
    }
    
    onRun();
  };

  return (
    <Button
      onClick={handleRun}
      disabled={isRunning}
      className="bg-green-600 hover:bg-green-700 min-w-32"
    >
      {isRunning ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          جاري التنفيذ...
        </>
      ) : (
        <>
          <PlayCircle className="h-4 w-4 mr-1" />
          تنفيذ الأتمتة
        </>
      )}
    </Button>
  );
};

export default RunButton;
