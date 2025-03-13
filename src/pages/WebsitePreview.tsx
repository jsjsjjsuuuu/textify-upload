
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  WebsitePreviewHeader,
  PreviewUrlInput,
  PreviewSettings,
  PreviewFrame
} from "@/components/WebsitePreview";

const WebsitePreview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"iframe" | "external">("iframe");
  const [sandboxMode, setSandboxMode] = useState<string>("allow-same-origin allow-scripts allow-popups allow-forms");
  const [useUserAgent, setUseUserAgent] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lastValidUrl, setLastValidUrl] = useState<string>("");

  // استعادة آخر عنوان URL مستخدم من التخزين المحلي عند تحميل الصفحة
  useEffect(() => {
    const savedUrl = searchParams.get("url") || localStorage.getItem("lastPreviewUrl");
    if (savedUrl) {
      setUrl(savedUrl);
      setLastValidUrl(savedUrl);
      if (viewMode === "iframe") {
        setTimeout(() => loadWebsite(savedUrl), 500);
      }
    }
    
    const savedSandboxMode = localStorage.getItem("previewSandboxMode");
    if (savedSandboxMode) {
      setSandboxMode(savedSandboxMode);
    }
    
    const savedUseUserAgent = localStorage.getItem("previewUseUserAgent");
    if (savedUseUserAgent) {
      setUseUserAgent(savedUseUserAgent === "true");
    }
  }, [searchParams]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const validateUrl = (inputUrl: string): string => {
    // إضافة بروتوكول إذا لم يتم تحديده
    if (inputUrl && !inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
      return `https://${inputUrl}`;
    }
    return inputUrl;
  };

  const loadWebsite = (inputUrl?: string) => {
    const urlToLoad = inputUrl || url;
    
    if (!urlToLoad.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال عنوان URL صالح",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const validatedUrl = validateUrl(urlToLoad);
    setUrl(validatedUrl);
    
    // حفظ URL في التخزين المحلي للاستخدام المستقبلي
    localStorage.setItem("lastPreviewUrl", validatedUrl);
    setLastValidUrl(validatedUrl);
    
    // تحديث الآي فريم
    if (iframeRef.current) {
      iframeRef.current.src = validatedUrl;
    }
    
    if (viewMode === "external") {
      window.open(validatedUrl, "_blank");
    }
    
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      loadWebsite();
    }
  };

  const refreshWebsite = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    setIsLoading(false);
  };

  const openExternalUrl = () => {
    if (lastValidUrl) {
      window.open(lastValidUrl, "_blank");
    } else if (url) {
      const validatedUrl = validateUrl(url);
      window.open(validatedUrl, "_blank");
    }
  };
  
  const handleSandboxModeChange = (value: string) => {
    setSandboxMode(value);
    localStorage.setItem("previewSandboxMode", value);
  };
  
  const handleUseUserAgentChange = (checked: boolean) => {
    setUseUserAgent(checked);
    localStorage.setItem("previewUseUserAgent", checked.toString());
  };

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <WebsitePreviewHeader />

        <PreviewUrlInput
          url={url}
          setUrl={setUrl}
          lastValidUrl={lastValidUrl}
          viewMode={viewMode}
          setViewMode={setViewMode}
          loadWebsite={loadWebsite}
          refreshWebsite={refreshWebsite}
          openExternalUrl={openExternalUrl}
          handleUrlChange={handleUrlChange}
          handleKeyDown={handleKeyDown}
        >
          <PreviewSettings
            sandboxMode={sandboxMode}
            useUserAgent={useUserAgent}
            handleSandboxModeChange={handleSandboxModeChange}
            handleUseUserAgentChange={handleUseUserAgentChange}
          />
        </PreviewUrlInput>

        <PreviewFrame
          isLoading={isLoading}
          viewMode={viewMode}
          lastValidUrl={lastValidUrl}
          sandboxMode={sandboxMode}
          useUserAgent={useUserAgent}
          iframeRef={iframeRef}
          openExternalUrl={openExternalUrl}
        />

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            ملاحظة: بعض المواقع قد تمنع عرضها داخل إطارات iframe لأسباب أمنية. إذا كنت تواجه مشكلة في العرض، جرب أحد الخيارات التالية:
          </p>
          <ul className="mr-6 mt-2 list-disc">
            <li>تغيير إعدادات "Sandbox" من الإعدادات المتقدمة</li>
            <li>استخدام خيار "في نافذة جديدة" لفتح الموقع في متصفح منفصل</li>
            <li>تفعيل خيار "محاكاة متصفح جوال" للمساعدة في تجاوز بعض القيود</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WebsitePreview;
