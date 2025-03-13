
import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  WebsitePreviewHeader,
  PreviewUrlInput,
  PreviewSettings,
  PreviewFrame
} from "@/components/WebsitePreview";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";

const WebsitePreview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"iframe" | "external">("iframe");
  const [sandboxMode, setSandboxMode] = useState<string>("allow-same-origin allow-scripts allow-popups allow-forms");
  const [useUserAgent, setUseUserAgent] = useState<boolean>(false);
  const [allowFullAccess, setAllowFullAccess] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
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

    const savedAllowFullAccess = localStorage.getItem("previewAllowFullAccess");
    if (savedAllowFullAccess) {
      setAllowFullAccess(savedAllowFullAccess === "true");
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

  const handleAllowFullAccessChange = (checked: boolean) => {
    setAllowFullAccess(checked);
    localStorage.setItem("previewAllowFullAccess", checked.toString());
  };

  return (
    <AuthGuard>
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
              allowFullAccess={allowFullAccess}
              handleSandboxModeChange={handleSandboxModeChange}
              handleUseUserAgentChange={handleUseUserAgentChange}
              handleAllowFullAccessChange={handleAllowFullAccessChange}
            />
          </PreviewUrlInput>

          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              className="text-sm"
              onClick={openExternalUrl}
            >
              <ExternalLink className="h-4 w-4 ml-2" />
              فتح في نافذة خارجية
            </Button>
            <Button 
              variant="outline" 
              className="text-sm"
              onClick={refreshWebsite}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث الصفحة
            </Button>
          </div>

          <PreviewFrame
            isLoading={isLoading}
            viewMode={viewMode}
            lastValidUrl={lastValidUrl}
            sandboxMode={sandboxMode}
            useUserAgent={useUserAgent}
            allowFullAccess={allowFullAccess}
            iframeRef={iframeRef}
            openExternalUrl={openExternalUrl}
          />

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-400 mb-2">
              مواقع تسجيل الدخول - نصائح للمعاينة
            </h3>
            <ul className="mr-6 list-disc text-sm space-y-2">
              <li>إذا كنت تواجه مشكلة في تسجيل الدخول، استخدم خيار "فتح في نافذة خارجية" لفتح الموقع في تبويب جديد</li>
              <li>جرب تغيير إعدادات الـ Sandbox إلى "كامل الصلاحيات" لتمكين تخزين الكوكيز وتتبع الجلسة</li>
              <li>في بعض الحالات، قد تحتاج لاستخدام "فتح في نافذة خارجية" ثم الرجوع بعد تسجيل الدخول</li>
              <li>بعض المواقع تحتوي على حماية ضد الـ iframe وقد لا تعمل داخل المعاينة على الإطلاق</li>
            </ul>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default WebsitePreview;
