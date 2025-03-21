
import React from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface RunButtonProps {
  isRunning: boolean;
  onRun: () => void;
}

const RunButton: React.FC<RunButtonProps> = ({ isRunning, onRun }) => {
  const { toast } = useToast();
  
  const handleRun = () => {
    // تحسين رسائل التشخيص
    console.log("🚀 زر التنفيذ: بدء تنفيذ الأتمتة");
    console.log("📃 تأكد من أن الإجراءات مكتملة وصحيحة");
    console.log("🔍 تأكد من صحة المحددات CSS");
    
    // إظهار رسالة للمستخدم لتوضيح ما سيحدث
    if (!isRunning) {
      toast({
        title: "بدء تنفيذ الأتمتة",
        description: "قد يستغرق هذا بضع ثوانٍ. سيتم تنفيذ الإجراءات على الموقع المستهدف من خلال خادم الأتمتة."
      });
    }
    
    onRun();
  };

  return (
    <Button
      onClick={handleRun}
      disabled={isRunning}
      className="bg-purple-600 hover:bg-purple-700 min-w-32"
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
