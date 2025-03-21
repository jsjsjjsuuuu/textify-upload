
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, Send, AlertTriangle, Server, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageData } from "@/types/ImageData";
import { AutomationService } from "@/utils/automationService";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface AutomationButtonProps {
  image: ImageData;
}

const AutomationButton = ({ image }: AutomationButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  const [isRealExecutionEnabled, setIsRealExecutionEnabled] = useState(() => AutomationService.isRealExecutionEnabled());
  const navigate = useNavigate();
  
  // التحقق مما إذا كانت البيانات مكتملة بما يكفي لإرسالها إلى الأتمتة
  const hasRequiredData = !!image.code && !!image.senderName && !!image.phoneNumber;

  // التحقق من حالة الاتصال وإعدادات التنفيذ الفعلي عند تحميل المكون
  useEffect(() => {
    const isRealExecution = AutomationService.isRealExecutionEnabled();
    setIsRealExecutionEnabled(isRealExecution);
    
    if (isRealExecution) {
      // التحقق من وجود الاتصال بالخادم
      checkConnectionStatus();
    }
  }, []);
  
  const checkConnectionStatus = async () => {
    setIsTestingConnection(true);
    try {
      // محاولة التحقق من الاتصال بالخادم
      const result = await AutomationService.checkServerExistence(false);
      setConnectionStatus(result ? 'success' : 'error');
      
      if (result) {
        toast.success("تم الاتصال بخادم الأتمتة بنجاح", {
          id: "connection-success",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("فشل التحقق من حالة الاتصال:", error);
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const handleAutomation = async () => {
    if (!hasRequiredData) {
      toast.error("بيانات غير مكتملة", {
        description: "يرجى التأكد من استخراج جميع البيانات المطلوبة (الكود، اسم المرسل، رقم الهاتف) قبل بدء الأتمتة"
      });
      return;
    }
    
    // التحقق من وجود وضع التنفيذ الفعلي
    const isRealExecution = AutomationService.isRealExecutionEnabled();
    setIsRealExecutionEnabled(isRealExecution);
    
    if (isRealExecution) {
      // التحقق من حالة الاتصال بالخادم أولاً
      setIsTestingConnection(true);
      try {
        const isConnected = await AutomationService.checkServerExistence(false);
        setConnectionStatus(isConnected ? 'success' : 'error');
        
        if (!isConnected) {
          // إظهار نافذة الاتصال إذا كان غير متصل
          setShowConnectionDialog(true);
          setIsTestingConnection(false);
          return;
        }
      } catch (error) {
        console.error("فشل التحقق من حالة الاتصال:", error);
        setConnectionStatus('error');
        setShowConnectionDialog(true);
        setIsTestingConnection(false);
        return;
      }
      setIsTestingConnection(false);
    }
    
    setIsLoading(true);
    
    try {
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
      
      toast.success("تم إرسال البيانات بنجاح", {
        description: "تم إرسال البيانات المستخرجة إلى صفحة الأتمتة، يمكنك الآن تكوين سيناريو الأتمتة"
      });
    } catch (error) {
      console.error("خطأ في إعداد الأتمتة:", error);
      toast.error("خطأ في الإعداد", {
        description: "حدث خطأ أثناء إعداد الأتمتة. يرجى المحاولة مرة أخرى"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const retryConnection = async () => {
    setIsTestingConnection(true);
    try {
      // إعادة محاولة الاتصال بالخادم
      const result = await AutomationService.forceReconnect();
      setConnectionStatus(result ? 'success' : 'error');
      
      if (result) {
        // إغلاق النافذة إذا كان الاتصال ناجحًا
        setShowConnectionDialog(false);
        toast.success("تم الاتصال بخادم الأتمتة بنجاح، يمكنك الآن تنفيذ الأتمتة");
        // متابعة تنفيذ الأتمتة
        handleAutomation();
      } else {
        toast.error("تعذر الاتصال بخادم الأتمتة. يرجى التحقق من إعدادات الخادم");
      }
    } catch (error) {
      console.error("فشل إعادة محاولة الاتصال:", error);
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const navigateToSettings = () => {
    navigate("/server-settings");
    setShowConnectionDialog(false);
  };
  
  const toggleRealExecution = () => {
    const newState = !isRealExecutionEnabled;
    setIsRealExecutionEnabled(newState);
    AutomationService.toggleRealExecution(newState);
    
    if (newState) {
      // عند تفعيل وضع التنفيذ الفعلي، تحقق من الاتصال
      checkConnectionStatus();
    }
  };
  
  return (
    <>
      <div className="flex flex-col gap-2 items-center">
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          className="inline-block"
        >
          <Button
            onClick={handleAutomation}
            disabled={isLoading || !hasRequiredData || isTestingConnection}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            size="lg"
          >
            {isLoading || isTestingConnection ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isTestingConnection ? "جاري التحقق من الاتصال..." : "جاري الإعداد..."}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>تعبئة البيانات تلقائيًا</span>
              </>
            )}
          </Button>
        </motion.div>
        
        {/* عرض زر التحقق من الاتصال وتبديل وضع التنفيذ الفعلي */}
        <div className="flex items-center gap-2 mt-1 text-xs">
          <button
            onClick={checkConnectionStatus}
            disabled={isTestingConnection}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              connectionStatus === 'success' 
                ? 'text-green-600 hover:text-green-700' 
                : connectionStatus === 'error'
                ? 'text-red-600 hover:text-red-700'
                : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            {isTestingConnection ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : connectionStatus === 'success' ? (
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            ) : connectionStatus === 'error' ? (
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            )}
            <span>حالة الاتصال بالخادم</span>
            <RefreshCw className="w-3 h-3 ml-1" />
          </button>
          
          {/* زر تبديل وضع التنفيذ الفعلي */}
          <button
            onClick={toggleRealExecution}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              isRealExecutionEnabled 
                ? 'text-purple-600 hover:text-purple-700' 
                : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isRealExecutionEnabled ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
            <span>{isRealExecutionEnabled ? 'وضع التنفيذ الفعلي مفعل' : 'محاكاة فقط'}</span>
          </button>
        </div>
      </div>
      
      {/* نافذة التحقق من الاتصال */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              مشكلة في الاتصال بخادم الأتمتة
            </DialogTitle>
            <DialogDescription>
              تعذر الاتصال بخادم الأتمتة. يرجى التحقق من الإعدادات أو إعادة المحاولة.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 my-4">
            <h4 className="font-medium mb-2 text-amber-800">أسباب محتملة:</h4>
            <ul className="text-sm space-y-2 text-amber-700 mr-4 list-disc">
              <li>خادم الأتمتة غير متاح أو لم يتم تشغيله</li>
              <li>عنوان URL للخادم غير صحيح</li>
              <li>مشكلة في إعدادات CORS على الخادم</li>
              <li>مشكلة في الشبكة أو جدار الحماية</li>
            </ul>
          </div>
          
          <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={navigateToSettings}
            >
              <Server className="mr-2 h-4 w-4" />
              تكوين إعدادات الخادم
            </Button>
            
            <Button 
              onClick={retryConnection} 
              disabled={isTestingConnection}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isTestingConnection ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              إعادة المحاولة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutomationButton;
