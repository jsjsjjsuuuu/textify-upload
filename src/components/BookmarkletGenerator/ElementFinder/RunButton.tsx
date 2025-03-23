
import React from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, Server, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { getAutomationServerUrl } from "@/utils/automationServerUrl";
import { fetchWithRetry } from "@/utils/automation";

interface RunButtonProps {
  isRunning: boolean;
  onRun: () => void;
  targetUrl?: string;
}

const RunButton: React.FC<RunButtonProps> = ({ isRunning, onRun, targetUrl }) => {
  const { toast: hookToast } = useToast();
  const [isCheckingServer, setIsCheckingServer] = React.useState(false);
  
  const handleRun = async () => {
    // تحسين رسائل التشخيص
    console.log("🚀 زر التنفيذ: بدء تنفيذ الأتمتة");
    console.log("📃 تأكد من أن الإجراءات مكتملة وصحيحة");
    console.log("🔍 تأكد من صحة المحددات CSS أو XPath");
    
    // التحقق من اتصال الخادم قبل تنفيذ الأتمتة
    const serverUrl = getAutomationServerUrl();
    console.log("🌐 عنوان خادم الأتمتة:", serverUrl);
    console.log("🔌 جاري التحقق من اتصال خادم الأتمتة...");
    
    setIsCheckingServer(true);
    
    try {
      // فحص سريع لاتصال نقطة نهاية ping
      await fetchWithRetry(`${serverUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'web-client',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Origin': window.location.origin
        }
      }, 2);
      
      console.log("✅ تم التحقق من اتصال الخادم بنجاح");
      console.log("🌐 جاري الاتصال بنقطة نهاية API: /api/automate");
      
      // إظهار رسالة للمستخدم لتوضيح ما سيحدث
      if (!isRunning) {
        toast("بدء تنفيذ الأتمتة", {
          description: "جاري تنفيذ الإجراءات على الموقع المستهدف من خلال خادم الأتمتة.",
          icon: <Server className="h-5 w-5 text-blue-500" />,
          duration: 5000,
        });
      }
      
      // استدعاء دالة التنفيذ
      onRun();
    } catch (error) {
      console.error("❌ خطأ أثناء التحقق من الخادم:", error);
      
      // عرض رسالة خطأ مع خيارات للمساعدة
      toast.error("تعذر الاتصال بخادم الأتمتة", {
        description: "تأكد من توفر الخادم وصحة الإعدادات. انقر للمزيد من المعلومات",
        duration: 8000,
        action: {
          label: "مساعدة",
          onClick: () => {
            hookToast({
              title: "مشكلة في الاتصال بخادم الأتمتة",
              description: (
                <div className="space-y-2 text-sm">
                  <p>قد تكون هناك مشكلة في اتصالك بالإنترنت أو قد يكون الخادم غير متاح.</p>
                  <div className="bg-gray-100 p-2 rounded mt-2">
                    <p className="font-medium">اقتراحات:</p>
                    <ul className="list-disc mr-5 mt-1">
                      <li>تأكد من اتصالك بالإنترنت</li>
                      <li>تحقق من إعدادات خادم الأتمتة</li>
                      <li>تأكد من أن الخادم يعمل ومتاح</li>
                      <li>حاول مرة أخرى بعد بضع دقائق</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 p-2 rounded mt-2 text-orange-700">
                    <p className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>إذا استمرت المشكلة، يمكنك استخدام البوكماركلت بدلاً من ذلك.</span>
                    </p>
                  </div>
                </div>
              ),
              variant: "destructive",
              duration: 10000,
            });
          }
        }
      });
    } finally {
      setIsCheckingServer(false);
    }
  };

  return (
    <Button
      onClick={handleRun}
      disabled={isRunning || isCheckingServer}
      className="bg-green-600 hover:bg-green-700 min-w-32"
    >
      {isRunning ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          جاري التنفيذ...
        </>
      ) : isCheckingServer ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          جاري التحقق من الخادم...
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
