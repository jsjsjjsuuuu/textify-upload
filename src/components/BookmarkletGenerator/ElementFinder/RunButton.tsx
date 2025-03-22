
import React from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, Server } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { getAutomationServerUrl } from "@/utils/automationServerUrl";

interface RunButtonProps {
  isRunning: boolean;
  onRun: () => void;
}

const RunButton: React.FC<RunButtonProps> = ({ isRunning, onRun }) => {
  const { toast: hookToast } = useToast();
  
  const handleRun = async () => {
    // تحسين رسائل التشخيص
    console.log("🚀 زر التنفيذ: بدء تنفيذ الأتمتة");
    console.log("📃 تأكد من أن الإجراءات مكتملة وصحيحة");
    console.log("🔍 تأكد من صحة المحددات CSS");
    
    // التحقق من اتصال الخادم قبل تنفيذ الأتمتة
    const serverUrl = getAutomationServerUrl();
    console.log("🌐 عنوان خادم الأتمتة:", serverUrl);
    console.log("🔌 جاري التحقق من اتصال خادم الأتمتة...");
    
    try {
      // فحص سريع لاتصال نقطة نهاية ping
      const pingResponse = await fetch(`${serverUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'web-client',
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!pingResponse.ok) {
        console.error("❌ فشل فحص اتصال الخادم:", pingResponse.status, pingResponse.statusText);
        toast.error("تعذر الاتصال بخادم الأتمتة", {
          description: "تأكد من أن خادم الأتمتة متاح ويستجيب.",
          duration: 5000,
        });
        return;
      }
      
      // فحص سريع لوجود نقطة نهاية الأتمتة
      try {
        const checkEndpoint = await fetch(`${serverUrl}/api/automation/execute`, {
          method: 'HEAD',
          headers: {
            'X-Client-Id': 'web-client',
            'Cache-Control': 'no-cache',
          }
        });
        
        if (!checkEndpoint.ok) {
          console.error("❌ نقطة نهاية الأتمتة غير متاحة:", checkEndpoint.status, checkEndpoint.statusText);
          toast.error("نقطة نهاية الأتمتة غير متاحة", {
            description: "تحقق من تكوين خادم الأتمتة وتأكد من دعمه لنقطة النهاية /api/automation/execute",
            duration: 5000,
          });
          return;
        }
      } catch (err) {
        // إذا لم تكن طريقة HEAD مدعومة، سنستمر في المحاولة باستخدام POST
        console.log("⚠️ فحص نقطة النهاية غير متاح، سنستمر بالتنفيذ:", err instanceof Error ? err.message : String(err));
      }
      
      console.log("✅ تم التحقق من اتصال الخادم بنجاح");
      console.log("🌐 جاري الاتصال بنقطة نهاية API: /api/automation/execute");
      
      // إظهار رسالة للمستخدم لتوضيح ما سيحدث
      if (!isRunning) {
        toast("بدء تنفيذ الأتمتة", {
          description: "جاري تنفيذ الإجراءات على الموقع المستهدف من خلال خادم الأتمتة الحقيقي.",
          icon: <Server className="h-5 w-5 text-blue-500" />,
          duration: 5000,
        });
      }
      
      // استدعاء دالة التنفيذ
      onRun();
    } catch (error) {
      console.error("❌ خطأ أثناء التحقق من الخادم:", error);
      toast.error("حدث خطأ أثناء الاتصال بالخادم", {
        description: "تأكد من توفر الخادم وصحة الإعدادات قبل المحاولة مرة أخرى.",
        duration: 5000,
      });
    }
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
