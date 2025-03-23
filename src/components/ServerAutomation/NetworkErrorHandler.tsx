
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { checkInternetConnection } from "@/utils/automation";

interface NetworkErrorHandlerProps {
  errorMessage: string;
  onRetry: () => void;
  isRetrying?: boolean;
  url?: string;
}

const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({
  errorMessage,
  onRetry,
  isRetrying = false,
  url
}) => {
  const [isCheckingConnection, setIsCheckingConnection] = React.useState(false);
  const [hasInternet, setHasInternet] = React.useState<boolean | null>(null);
  
  const checkConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const connected = await checkInternetConnection();
      setHasInternet(connected);
      
      if (connected) {
        toast.info("اتصال الإنترنت متوفر", {
          description: "المشكلة قد تكون في الخادم المستهدف وليس في اتصالك بالإنترنت."
        });
      } else {
        toast.error("تعذر الاتصال بالإنترنت", {
          description: "تحقق من اتصالك بالشبكة قبل المحاولة مرة أخرى."
        });
      }
    } catch (error) {
      console.error("خطأ أثناء التحقق من اتصال الإنترنت:", error);
      setHasInternet(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };
  
  // استخراج اسم النطاق من عنوان URL (إذا كان متاحًا)
  const getDomainFromUrl = (urlString?: string): string => {
    if (!urlString) return "الخادم المستهدف";
    
    try {
      const url = new URL(urlString);
      return url.hostname;
    } catch (error) {
      return urlString;
    }
  };
  
  const domainName = url ? getDomainFromUrl(url) : "الخادم";
  
  return (
    <Alert variant="destructive" className="my-4 bg-red-50 border-red-200">
      <div className="flex flex-col space-y-4">
        <div className="flex items-start">
          <WifiOff className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="mr-2">
            <AlertTitle className="text-red-800 mb-2">
              مشكلة في الاتصال بالشبكة
            </AlertTitle>
            <AlertDescription className="text-red-700">
              <p className="mb-2">
                {errorMessage || `تعذر الاتصال بـ ${domainName}. تحقق من اتصالك بالإنترنت وتأكد من أن الخادم متاح.`}
              </p>
            </AlertDescription>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-md border border-red-100">
          <div className="font-medium text-red-800 mb-2">اقتراحات لحل المشكلة:</div>
          <ul className="mr-6 text-sm space-y-1 list-disc text-red-700">
            <li>تأكد من اتصالك بالإنترنت</li>
            <li>تحقق من أن عنوان URL للخادم صحيح</li>
            <li>قد يكون الخادم المستهدف غير متاح أو في وضع الصيانة</li>
            <li>جرّب استخدام شبكة مختلفة أو تعطيل VPN إذا كنت تستخدمه</li>
            <li>قم بتعطيل جدار الحماية مؤقتًا أو تكوينه للسماح بالاتصالات الخارجية</li>
          </ul>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-start mt-4">
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            onClick={checkConnection}
            disabled={isCheckingConnection}
          >
            {isCheckingConnection ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                التحقق من اتصال الإنترنت
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                جاري إعادة المحاولة...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                إعادة المحاولة
              </>
            )}
          </Button>
          
          {url && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              فتح عنوان URL في نافذة جديدة
            </Button>
          )}
        </div>
        
        {hasInternet !== null && (
          <div className={`text-sm p-2 rounded ${hasInternet ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <div className="flex items-center">
              {hasInternet ? (
                <>
                  <Wifi className="mr-2 h-4 w-4 text-green-600" />
                  اتصال الإنترنت متوفر. المشكلة قد تكون في الخادم المستهدف.
                </>
              ) : (
                <>
                  <WifiOff className="mr-2 h-4 w-4 text-red-600" />
                  تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك بالشبكة.
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Alert>
  );
};

export default NetworkErrorHandler;
