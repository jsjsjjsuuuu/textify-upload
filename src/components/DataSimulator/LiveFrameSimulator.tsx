
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, RotateCcw, Settings, Clipboard, Save } from "lucide-react";

interface LiveFrameSimulatorProps {
  externalUrl?: string;
  extractedData?: Record<string, string>;
}

const LiveFrameSimulator = ({ externalUrl = "https://malshalal-exp.com/home.php", extractedData }: LiveFrameSimulatorProps) => {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<string>("normal");
  const [simulationStatus, setSimulationStatus] = useState<string>("");
  const [hasStarted, setHasStarted] = useState(false);
  
  // بيانات نموذجية للمحاكاة إذا لم يتم توفير بيانات
  const defaultData = {
    "الكود": "123456",
    "رقم الهاتف": "07701234567",
    "اسم المرسل": "أحمد محمد",
    "المحافظة": "بغداد",
    "السعر": "20000",
    "المنطقة": "الكرادة",
    "نوع البضاعة": "إلكترونيات",
    "عدد القطع": "2",
    "ملاحظات": "توصيل سريع"
  };
  
  const dataToUse = extractedData || defaultData;
  
  // تحديد سرعة الكتابة بناءً على الاختيار
  const getTypeDelay = () => {
    switch (simulationSpeed) {
      case "slow": return 300;
      case "fast": return 50;
      default: return 150;
    }
  };
  
  // إعادة تعيين الإطار
  const resetFrame = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.src = externalUrl;
        setSimulationStatus("تم إعادة تحميل الإطار");
        setIsSimulating(false);
        setHasStarted(false);
      } catch (error) {
        console.error("خطأ في إعادة تحميل الإطار:", error);
        setSimulationStatus("فشل في إعادة تحميل الإطار");
      }
    }
  };
  
  // وظيفة تبدأ المحاكاة وتملأ الحقول في الإطار
  const startSimulation = () => {
    if (!iframeRef.current) {
      setSimulationStatus("لم يتم العثور على الإطار");
      return;
    }
    
    setIsSimulating(true);
    setHasStarted(true);
    setSimulationStatus("جارٍ بدء المحاكاة...");
    
    try {
      // الوصول إلى محتوى الإطار
      const iframe = iframeRef.current.contentWindow;
      
      if (!iframe) {
        setSimulationStatus("تعذر الوصول إلى محتوى الإطار");
        setIsSimulating(false);
        return;
      }
      
      // إنشاء سكريبت لتنفيذه داخل الإطار
      const scriptContent = `
        const extractedData = ${JSON.stringify(dataToUse)};
        let delay = ${getTypeDelay()};
        let completedFields = 0;
        const totalFields = 5;
        
        // وظيفة للكتابة في حقل نصي
        function typeInField(selector, text, delay = ${getTypeDelay()}) {
          return new Promise((resolve) => {
            let field = document.querySelector(selector);
            if (field) {
              field.focus();
              field.value = ""; // مسح القيمة الحالية
              let i = 0;
              const typeChar = () => {
                if (i < text.length) {
                  field.value += text[i];
                  i++;
                  setTimeout(typeChar, delay);
                } else {
                  completedFields++;
                  window.parent.postMessage({
                    type: 'simulationProgress', 
                    progress: (completedFields / totalFields) * 100,
                    field: selector,
                    value: text
                  }, '*');
                  resolve();
                }
              };
              typeChar();
            } else {
              window.parent.postMessage({
                type: 'simulationError',
                message: 'لم يتم العثور على الحقل: ' + selector
              }, '*');
              resolve();
            }
          });
        }
        
        // وظيفة لاختيار قيمة من قائمة منسدلة
        function selectOption(selector, textToMatch) {
          return new Promise((resolve) => {
            let select = document.querySelector(selector);
            if (select) {
              let found = false;
              for (let option of select.options) {
                if (option.text.includes(textToMatch)) {
                  select.value = option.value;
                  select.selectedIndex = option.index;
                  
                  // إطلاق حدث التغيير
                  const event = new Event('change', { bubbles: true });
                  select.dispatchEvent(event);
                  
                  found = true;
                  completedFields++;
                  window.parent.postMessage({
                    type: 'simulationProgress',
                    progress: (completedFields / totalFields) * 100,
                    field: selector,
                    value: option.text
                  }, '*');
                  break;
                }
              }
              
              if (!found) {
                // إذا لم يتم العثور على القيمة، اختر أول خيار غير فارغ
                for (let option of select.options) {
                  if (option.value !== '') {
                    select.value = option.value;
                    select.selectedIndex = option.index;
                    
                    // إطلاق حدث التغيير
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                    
                    window.parent.postMessage({
                      type: 'simulationProgress',
                      progress: (completedFields / totalFields) * 100,
                      field: selector,
                      value: option.text + ' (اختيار تلقائي)'
                    }, '*');
                    completedFields++;
                    break;
                  }
                }
              }
              
              resolve();
            } else {
              window.parent.postMessage({
                type: 'simulationError',
                message: 'لم يتم العثور على القائمة المنسدلة: ' + selector
              }, '*');
              resolve();
            }
          });
        }
        
        // وظيفة لإرسال النموذج
        function submitForm() {
          return new Promise((resolve) => {
            window.parent.postMessage({
              type: 'simulationStatus',
              status: 'جارٍ محاولة إرسال النموذج...'
            }, '*');
            
            // البحث عن زر الإرسال
            const submitButton = document.querySelector('button[type="submit"], input[type="submit"], button:contains("حفظ"), button:contains("إرسال")');
            
            if (submitButton) {
              submitButton.click();
              window.parent.postMessage({
                type: 'simulationComplete',
                success: true,
                message: 'تم الإرسال بنجاح'
              }, '*');
            } else {
              window.parent.postMessage({
                type: 'simulationError',
                message: 'لم يتم العثور على زر الإرسال'
              }, '*');
            }
            
            resolve();
          });
        }
        
        // تسلسل عملية المحاكاة
        async function runSimulation() {
          try {
            window.parent.postMessage({
              type: 'simulationStatus',
              status: 'بدء المحاكاة...'
            }, '*');
            
            // ملء الحقول
            await typeInField("input[name='customer_code']", extractedData["الكود"] || "123456");
            await typeInField("input[name='phone']", extractedData["رقم الهاتف"] || "07701234567");
            await selectOption("select[name='region']", extractedData["المحافظة"] || "بغداد");
            await typeInField("input[name='amount']", extractedData["السعر"] || "20000");
            
            // اختيار اسم العميل والمندوب
            await selectOption("select[name='customer_name']", extractedData["اسم المرسل"] || "");
            
            // محاولة إرسال النموذج بعد وقت قصير
            setTimeout(() => {
              submitForm();
            }, 1500);
            
          } catch (error) {
            window.parent.postMessage({
              type: 'simulationError',
              message: 'حدث خطأ أثناء المحاكاة: ' + error.message
            }, '*');
          }
        }
        
        // بدء المحاكاة
        window.parent.postMessage({
          type: 'simulationStart'
        }, '*');
        
        runSimulation();
      `;
      
      // إنشاء تابع يتم تنفيذه بعد تحميل الإطار
      const injectScript = () => {
        try {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            const scriptElement = iframeRef.current.contentWindow.document.createElement('script');
            scriptElement.textContent = scriptContent;
            iframeRef.current.contentWindow.document.body.appendChild(scriptElement);
          }
        } catch (error) {
          console.error('خطأ في حقن السكريبت:', error);
          setSimulationStatus("فشل في حقن السكريبت: سياسة نفس المصدر");
          setIsSimulating(false);
        }
      };

      // محاولة حقن السكريبت بعد تأكد من تحميل الإطار
      if (iframeRef.current.contentWindow?.document?.readyState === 'complete') {
        injectScript();
      } else {
        iframeRef.current.onload = injectScript;
      }
      
    } catch (error) {
      console.error("خطأ في بدء المحاكاة:", error);
      setSimulationStatus(`خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      setIsSimulating(false);
    }
  };
  
  // إيقاف المحاكاة
  const stopSimulation = () => {
    setIsSimulating(false);
    setSimulationStatus("تم إيقاف المحاكاة");
    
    // إذا أمكن، أرسل رسالة لإيقاف المحاكاة داخل الإطار
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'stopSimulation' }, '*');
      } catch (error) {
        console.error("خطأ في إيقاف المحاكاة:", error);
      }
    }
  };
  
  // نسخ البيانات المستخرجة
  const copyData = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(dataToUse, null, 2));
      toast({
        title: "تم النسخ",
        description: "تم نسخ البيانات المستخرجة إلى الحافظة",
      });
    } catch (error) {
      console.error("خطأ في نسخ البيانات:", error);
      toast({
        title: "فشل النسخ",
        description: "حدث خطأ أثناء محاولة نسخ البيانات",
        variant: "destructive",
      });
    }
  };
  
  // الاستماع للرسائل من الإطار
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        switch (event.data.type) {
          case 'simulationStart':
            setSimulationStatus("بدأت المحاكاة");
            break;
          case 'simulationProgress':
            setSimulationStatus(`تم ملء حقل: ${event.data.field} بقيمة: ${event.data.value}`);
            break;
          case 'simulationStatus':
            setSimulationStatus(event.data.status);
            break;
          case 'simulationError':
            setSimulationStatus(`خطأ: ${event.data.message}`);
            setIsSimulating(false);
            toast({
              title: "خطأ في المحاكاة",
              description: event.data.message,
              variant: "destructive",
            });
            break;
          case 'simulationComplete':
            setSimulationStatus("اكتملت المحاكاة بنجاح");
            setIsSimulating(false);
            toast({
              title: "اكتملت المحاكاة",
              description: "تم إكمال عملية المحاكاة بنجاح",
            });
            break;
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [toast]);
  
  return (
    <Card className="border-2 border-brand-beige/30 shadow-md bg-gradient-to-b from-background to-muted/50">
      <CardHeader>
        <CardTitle className="text-brand-brown flex items-center justify-between">
          <span>محاكاة مباشرة لموقع مال الشلال</span>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copyData}
              title="نسخ البيانات"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={resetFrame}
              title="إعادة تحميل"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          هذه محاكاة مباشرة لموقع مال الشلال للشحن. يمكنك رؤية كيف يتم ملء البيانات تلقائياً.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* أدوات التحكم */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex-1 min-w-[200px]">
            <Select 
              value={simulationSpeed} 
              onValueChange={setSimulationSpeed}
              disabled={isSimulating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="سرعة المحاكاة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">بطيء</SelectItem>
                <SelectItem value="normal">متوسط</SelectItem>
                <SelectItem value="fast">سريع</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            {!isSimulating ? (
              <Button
                onClick={startSimulation}
                className="bg-brand-green hover:bg-brand-green/90 transition-all"
                disabled={isSimulating}
              >
                <Play className="h-4 w-4 ml-2" />
                بدء المحاكاة
              </Button>
            ) : (
              <Button
                onClick={stopSimulation}
                variant="destructive"
              >
                <Pause className="h-4 w-4 ml-2" />
                إيقاف المحاكاة
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={() => { window.open(externalUrl, '_blank') }}
            >
              <Settings className="h-4 w-4 ml-2" />
              إعدادات
            </Button>
          </div>
        </div>
        
        {/* حالة المحاكاة */}
        {hasStarted && (
          <div className="border rounded-md p-3 bg-muted/30 text-sm">
            <p className="font-medium text-brand-brown mb-1">حالة المحاكاة:</p>
            <p className="text-muted-foreground" dir="rtl">{simulationStatus || "جاهز للبدء..."}</p>
          </div>
        )}
        
        {/* الإطار */}
        <div className="w-full h-[550px] border rounded-md overflow-hidden relative bg-white">
          <iframe
            ref={iframeRef}
            src={externalUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="محاكاة مال الشلال"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
          
          {/* طبقة عند تحميل الإطار */}
          {!hasStarted && (
            <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex flex-col items-center justify-center">
              <p className="text-lg font-medium mb-4 text-brand-brown">انقر على زر البدء لتشغيل المحاكاة المباشرة</p>
              <Button
                onClick={startSimulation}
                className="bg-brand-green hover:bg-brand-green/90 transition-all"
              >
                <Play className="h-4 w-4 ml-2" />
                بدء المحاكاة
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          ملاحظة: تتطلب المحاكاة الكاملة اتصالاً مباشراً بالموقع الخارجي
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => { localStorage.setItem('external_form_url', externalUrl) }}
        >
          <Save className="h-4 w-4 ml-1" />
          حفظ الإعدادات
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LiveFrameSimulator;
