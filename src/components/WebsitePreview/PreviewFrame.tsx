
import React from "react";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 opacity-80 hover:opacity-100"
              onClick={openExternalUrl}
            >
              <ExternalLink className="h-4 w-4 ml-2" />
              فتح في نافذة جديدة
            </Button>
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
