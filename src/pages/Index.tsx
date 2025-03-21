
import BackgroundPattern from "@/components/BackgroundPattern";
import ImageUploader from "@/components/ImageUploader";
import AppHeader from "@/components/AppHeader";
import ImagePreviewContainer from "@/components/ImageViewer/ImagePreviewContainer";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { formatDate } from "@/utils/dateFormatter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Server, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { AutomationService } from "@/utils/automationService";
import { isConnected, getLastConnectionStatus } from "@/utils/automationServerUrl";

const Index = () => {
  const {
    images,
    isProcessing,
    processingProgress,
    isSubmitting,
    useGemini,
    bookmarkletStats,
    handleFileChange,
    handleTextChange,
    handleDelete,
    handleSubmitToApi
  } = useImageProcessing();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  // وظيفة wrapper لمعالجة توقيع الدالة للحفاظ على التوافق مع واجهة ImagePreviewContainer
  const handleDeleteImage = (id: string) => {
    handleDelete(id);
  };

  // تعديل وظيفة wrapper للإرسال لتتوافق مع واجهة ImagePreviewContainer
  const handleSubmit = (id: string) => {
    // البحث عن الصورة المطلوبة باستخدام المعرف
    const image = images.find(img => img.id === id);
    if (image) {
      handleSubmitToApi(id, image);
    }
  };

  // التحقق من حالة الاتصال بالخادم عند تحميل الصفحة
  useEffect(() => {
    checkServerConnection();
  }, []);

  // التحقق من حالة الاتصال بالخادم
  const checkServerConnection = async () => {
    setIsCheckingConnection(true);
    try {
      // التحقق من الحالة المحفوظة أولاً
      const status = getLastConnectionStatus();
      setServerConnected(status.isConnected);
      
      // ثم التحقق من الحالة الفعلية
      const connected = await isConnected(false);
      setServerConnected(connected);
      
      if (connected) {
        toast({
          title: "تم الاتصال بالخادم",
          description: "تم الاتصال بخادم الأتمتة بنجاح",
        });
      } else {
        toast({
          title: "تعذر الاتصال بالخادم",
          description: "يرجى التحقق من إعدادات الخادم",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("خطأ في التحقق من حالة الخادم:", error);
      setServerConnected(false);
      
      toast({
        title: "خطأ في الاتصال",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // الانتقال إلى صفحة إعدادات الخادم
  const goToServerSettings = () => {
    navigate("/server-settings");
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 sm:px-6 py-4 sm:py-6 mx-auto max-w-5xl">
        <AppHeader />

        <div className="flex flex-col items-center justify-center pt-4">
          <div className="w-full flex justify-center mx-auto">
            <ImageUploader 
              isProcessing={isProcessing}
              processingProgress={processingProgress}
              useGemini={useGemini}
              onFileChange={handleFileChange}
            />
          </div>

          {/* شريط حالة الاتصال */}
          <div className="w-full mt-4 mb-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {serverConnected === true ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : serverConnected === false ? (
                  <WifiOff className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                
                <span className="text-sm font-medium">
                  {serverConnected === true
                    ? "متصل بخادم الأتمتة"
                    : serverConnected === false
                    ? "غير متصل بخادم الأتمتة"
                    : "جاري التحقق من حالة الاتصال..."}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isCheckingConnection}
                  onClick={checkServerConnection}
                >
                  فحص الاتصال
                </Button>
                
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={goToServerSettings}
                >
                  <Server className="h-4 w-4 mr-1" />
                  إعدادات الخادم
                </Button>
              </div>
            </div>
          </div>

          <div className="w-full mt-8">
            <ImagePreviewContainer 
              images={images}
              isSubmitting={isSubmitting}
              onTextChange={handleTextChange}
              onDelete={handleDeleteImage}
              onSubmit={handleSubmit}
              formatDate={formatDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
