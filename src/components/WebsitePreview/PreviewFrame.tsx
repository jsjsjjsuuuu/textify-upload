
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ExternalLink, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PreviewFrameProps {
  isLoading: boolean;
  viewMode: "iframe" | "external";
  lastValidUrl: string;
  sandboxMode: string;
  useUserAgent: boolean;
  allowFullAccess?: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  openExternalUrl: () => void;
}

const PreviewFrame = ({ 
  isLoading, 
  viewMode, 
  lastValidUrl, 
  sandboxMode, 
  useUserAgent,
  allowFullAccess = false,
  iframeRef, 
  openExternalUrl 
}: PreviewFrameProps) => {
  const { toast } = useToast();
  const [scriptPermission, setScriptPermission] = useState<boolean>(false);

  // مراقبة رسائل من الإطار لمعرفة ما إذا كان السكريبت قد تم تنفيذه بنجاح
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'script-executed') {
        toast({
          title: "تم تنفيذ السكريبت",
          description: `تم تنفيذ السكريبت بنجاح: ${event.data.message}`,
          variant: "default",
        });
      } else if (event.data && event.data.type === 'script-error') {
        toast({
          title: "خطأ في تنفيذ السكريبت",
          description: `فشل تنفيذ السكريبت: ${event.data.error}`,
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  // وظيفة لتهيئة الإطار للسماح بتنفيذ السكريبت
  const enableScriptExecution = () => {
    if (!iframeRef.current) return;
    
    try {
      // محاولة إنشاء جسر للاتصال مع الإطار
      const iframeWindow = iframeRef.current.contentWindow;
      
      if (!iframeWindow) {
        toast({
          title: "تعذر الوصول إلى الإطار",
          description: "لا يمكن الوصول إلى نافذة الإطار. قد يكون ذلك بسبب قيود الأمان.",
          variant: "destructive",
        });
        return;
      }
      
      // محاولة تمكين سكريبت التفاعل
      const bridgeScript = `
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'execute-script') {
            try {
              const scriptFn = new Function(event.data.script);
              scriptFn();
              window.parent.postMessage({ type: 'script-executed', message: 'تم تنفيذ السكريبت بنجاح' }, '*');
            } catch (error) {
              window.parent.postMessage({ type: 'script-error', error: error.message }, '*');
            }
          }
        });
        document.body.style.position = 'relative';
        const badge = document.createElement('div');
        badge.innerHTML = 'السكريبت مُمكّن';
        badge.style.position = 'fixed';
        badge.style.bottom = '10px';
        badge.style.left = '10px';
        badge.style.backgroundColor = 'rgba(0, 150, 0, 0.7)';
        badge.style.color = 'white';
        badge.style.padding = '5px 10px';
        badge.style.borderRadius = '5px';
        badge.style.zIndex = '9999';
        badge.style.fontSize = '12px';
        document.body.appendChild(badge);
      `;
      
      const scriptTag = document.createElement('script');
      scriptTag.textContent = bridgeScript;
      
      try {
        // محاولة إضافة السكريبت إلى الإطار
        iframeWindow.document.head.appendChild(scriptTag);
        setScriptPermission(true);
        toast({
          title: "تم تفعيل السكريبت",
          description: "تم تمكين تنفيذ السكريبت في الإطار بنجاح.",
          variant: "default",
        });
      } catch (error) {
        console.error("فشل في إضافة سكريبت الجسر:", error);
        toast({
          title: "تعذر تفعيل السكريبت",
          description: "فشل تمكين السكريبت بسبب قيود أمان الموقع. استخدم 'فتح في نافذة خارجية' بدلاً من ذلك.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("خطأ في تفعيل السكريبت:", error);
      toast({
        title: "تعذر تفعيل السكريبت",
        description: "حدث خطأ أثناء محاولة تفعيل السكريبت. استخدم 'فتح في نافذة خارجية' بدلاً من ذلك.",
        variant: "destructive",
      });
    }
  };

  // وظيفة لتنفيذ سكريبت في الإطار
  const executeScript = () => {
    if (!iframeRef.current || !scriptPermission) {
      toast({
        title: "يجب تفعيل السكريبت أولاً",
        description: "الرجاء النقر على زر 'تفعيل السكريبت' قبل محاولة التنفيذ.",
        variant: "warning",
      });
      return;
    }
    
    const testScript = `
      console.log('تم تنفيذ السكريبت بنجاح');
      alert('تم تنفيذ السكريبت بنجاح في الإطار');
    `;
    
    iframeRef.current.contentWindow?.postMessage({
      type: 'execute-script',
      script: testScript
    }, '*');
  };

  if (!lastValidUrl) return null;

  const userAgentAttr = useUserAgent ? {
    'data-user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  } : {};

  return (
    <Card className="overflow-hidden shadow-md dark:shadow-primary/10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="w-full h-[70vh] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown"></div>
          </div>
        )}
        
        {viewMode === "iframe" && lastValidUrl ? (
          <>
            <iframe
              ref={iframeRef}
              src={lastValidUrl}
              className="w-full h-full border-0"
              allowFullScreen
              {...(sandboxMode && !allowFullAccess ? { sandbox: sandboxMode } : {})}
              {...userAgentAttr}
            />
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-slate-800 opacity-80 hover:opacity-100"
                onClick={openExternalUrl}
              >
                <ExternalLink className="h-4 w-4 ml-2" />
                فتح في نافذة جديدة
              </Button>
              
              {!scriptPermission && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-slate-800 opacity-80 hover:opacity-100 border-green-300 text-green-700 dark:text-green-400"
                  onClick={enableScriptExecution}
                >
                  <Code className="h-4 w-4 ml-2" />
                  تفعيل السكريبت
                </Button>
              )}
              
              {scriptPermission && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white dark:bg-slate-800 opacity-80 hover:opacity-100 border-blue-300 text-blue-700 dark:text-blue-400"
                  onClick={executeScript}
                >
                  <Code className="h-4 w-4 ml-2" />
                  اختبار السكريبت
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
            <div className="text-center">
              {viewMode === "external" ? (
                <>
                  <p className="text-lg text-muted-foreground">تم فتح الرابط في نافذة جديدة</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={openExternalUrl}
                  >
                    انقر هنا لإعادة الفتح في نافذة جديدة
                  </Button>
                </>
              ) : (
                <p className="text-lg text-muted-foreground">أدخل رابطاً لبدء المعاينة</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PreviewFrame;
