
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, ExternalLink, Monitor, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AppHeader from "@/components/AppHeader";

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
        <header className="mb-6 animate-slide-up">
          <Button
            variant="ghost"
            className="flex items-center text-brand-brown hover:text-brand-coral mb-4 transition-colors"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="ml-2" size={16} />
            <span>العودة إلى الرئيسية</span>
          </Button>
          <h1 className="text-3xl font-bold text-brand-brown mb-3">معاينة المواقع الخارجية</h1>
          <p className="text-muted-foreground">
            قم بعرض المواقع الخارجية داخل تطبيقك لتسهيل تصدير البيانات المستخرجة
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800/90 rounded-xl shadow-md p-4 mb-4"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={handleUrlChange}
                  onKeyDown={handleKeyDown}
                  placeholder="أدخل عنوان URL للموقع (مثال: https://example.com)"
                  className="pr-10 text-right flex-1"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={viewMode} onValueChange={(value: "iframe" | "external") => setViewMode(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="طريقة العرض" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iframe">داخل التطبيق</SelectItem>
                  <SelectItem value="external">في نافذة جديدة</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-shrink-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium text-right">إعدادات متقدمة</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Switch 
                          id="user-agent"
                          checked={useUserAgent}
                          onCheckedChange={handleUseUserAgentChange}
                        />
                        <Label htmlFor="user-agent" className="text-right">محاكاة متصفح جوال</Label>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-right block">إعدادات Sandbox</Label>
                        <Select value={sandboxMode} onValueChange={handleSandboxModeChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="إعدادات Sandbox" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="allow-same-origin allow-scripts allow-popups allow-forms">قياسي</SelectItem>
                            <SelectItem value="allow-same-origin allow-scripts allow-popups allow-forms allow-modals">سماح بالنوافذ المنبثقة</SelectItem>
                            <SelectItem value="allow-same-origin allow-scripts allow-popups allow-forms allow-storage-access-by-user-activation">سماح بالوصول للتخزين</SelectItem>
                            <SelectItem value="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-storage-access-by-user-activation allow-top-navigation">كامل (غير آمن)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button onClick={() => loadWebsite()} className="bg-brand-brown hover:bg-brand-brown/90 flex-shrink-0">
                <Monitor className="ml-2 h-4 w-4" />
                عرض الموقع
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={refreshWebsite}
                      className="flex-shrink-0"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تحديث الصفحة</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={openExternalUrl}
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>فتح في صفحة جديدة</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </motion.div>

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
