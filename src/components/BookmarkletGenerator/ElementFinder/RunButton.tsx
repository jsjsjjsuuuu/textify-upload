
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
      // إضافة تأخير قبل الاتصال بالخادم لمنح وقت للتهيئة
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // فحص سريع لاتصال نقطة نهاية ping
      const pingResponse = await fetch(`${serverUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'web-client',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Origin': window.location.origin
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      // التحقق من نجاح الاستجابة
      if (!pingResponse.ok) {
        console.error("❌ فشل فحص اتصال الخادم:", pingResponse instanceof Response ? `${pingResponse.status} ${pingResponse.statusText}` : "خطأ غير معروف");
        toast.error("تعذر الاتصال بخادم الأتمتة", {
          description: "تأكد من أن خادم الأتمتة متاح ويستجيب.",
          duration: 5000,
        });
        return;
      }
      
      // إضافة تأخير إضافي قبل التحقق من نقطة النهاية
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // استخدام نقطة النهاية /api/automate بدلاً من /api/automation/execute
      try {
        // استخدام HEAD بدلاً من OPTIONS للتحقق بشكل أخف
        const endpointCheck = await fetch(`${serverUrl}/api/automate`, {
          method: 'HEAD',
          headers: {
            'X-Client-Id': 'web-client',
            'Cache-Control': 'no-cache',
            'Origin': window.location.origin
          },
          mode: 'cors',
          credentials: 'omit'
        });
        
        console.log("✅ التحقق من نقطة النهاية:", endpointCheck.status);
      } catch (err) {
        console.log("⚠️ تحذير: فشل التحقق من نقطة النهاية، سنستمر في المحاولة:", err instanceof Error ? err.message : String(err));
      }
      
      console.log("✅ تم التحقق من اتصال الخادم بنجاح");
      console.log("🌐 جاري الاتصال بنقطة نهاية API: /api/automate");
      
      // إضافة تأخير نهائي قبل البدء
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // إظهار رسالة للمستخدم لتوضيح ما سيحدث
      if (!isRunning) {
        toast("بدء تنفيذ الأتمتة", {
          description: "جاري تنفيذ الإجراءات على الموقع المستهدف من خلال خادم n8n.",
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
