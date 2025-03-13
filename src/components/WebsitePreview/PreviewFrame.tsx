
import React from "react";
import { RefreshCw, Monitor, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PreviewFrameProps {
  isLoading: boolean;
  viewMode: "iframe" | "external";
  lastValidUrl: string;
  sandboxMode: string;
  useUserAgent: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  openExternalUrl: () => void;
}

const PreviewFrame = ({
  isLoading,
  viewMode,
  lastValidUrl,
  sandboxMode,
  useUserAgent,
  iframeRef,
  openExternalUrl,
}: PreviewFrameProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-gray-800/90 rounded-xl shadow-md overflow-hidden"
      style={{ height: "calc(100vh - 270px)", minHeight: "500px" }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-brand-brown" />
            <p className="text-muted-foreground">جاري تحميل الموقع...</p>
          </div>
        </div>
      ) : viewMode === "iframe" && lastValidUrl ? (
        <iframe
          ref={iframeRef}
          src={lastValidUrl}
          title="معاينة الموقع"
          className="w-full h-full border-0"
          sandbox={sandboxMode}
          loading="lazy"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md p-6">
            <Monitor className="h-12 w-12 mx-auto mb-4 text-brand-brown/50" />
            <h3 className="text-lg font-medium mb-2">أدخل عنوان URL لعرض الموقع</h3>
            <p className="text-muted-foreground">
              قم بإدخال عنوان URL للموقع الذي تريد معاينته وانقر على "عرض الموقع"
            </p>
            {viewMode === "external" && lastValidUrl && (
              <Button onClick={openExternalUrl} className="mt-4 bg-brand-brown hover:bg-brand-brown/90">
                <ExternalLink className="ml-2 h-4 w-4" />
                فتح الموقع في نافذة جديدة
              </Button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PreviewFrame;
