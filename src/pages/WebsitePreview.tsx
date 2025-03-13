
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
import { ExternalLink, RefreshCw, AlertCircle, Save, Key, Database } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; 
import { Input } from "@/components/ui/input";

interface SavedCredential {
  domain: string;
  username: string;
  password: string;
  date: string;
}

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
  const [autoFillScript, setAutoFillScript] = useState<string>("");
  const [autoFillApplied, setAutoFillApplied] = useState<boolean>(false);
  
  // إضافة حالة لإدارة مربع حوار حفظ بيانات تسجيل الدخول
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState<boolean>(false);
  const [savedCredentials, setSavedCredentials] = useState<SavedCredential[]>([]);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [credentialsViewOpen, setCredentialsViewOpen] = useState<boolean>(false);

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
    
    // التحقق من وجود نص autoFill في المعلمات
    const autoFill = searchParams.get("autoFill");
    const script = searchParams.get("script");
    if (autoFill === "true" && script) {
      setAutoFillScript(decodeURIComponent(script));
    }
    
    // استرجاع بيانات تسجيل الدخول المحفوظة
    const storedCredentials = localStorage.getItem("savedLoginCredentials");
    if (storedCredentials) {
      try {
        const parsedCredentials = JSON.parse(storedCredentials) as SavedCredential[];
        setSavedCredentials(parsedCredentials);
      } catch (error) {
        console.error("خطأ في استرجاع بيانات تسجيل الدخول:", error);
      }
    }
  }, [searchParams]);
  
  // تنفيذ سكريبت الإدخال التلقائي بعد تحميل الصفحة
  useEffect(() => {
    if (autoFillScript && iframeRef.current && !autoFillApplied) {
      const handleIframeLoad = () => {
        try {
          // التحقق من أن الصفحة تحميلت بشكل كامل
          setTimeout(() => {
            executeAutoFillScript();
            setAutoFillApplied(true);
          }, 2000); // انتظار 2 ثانية بعد تحميل الإطار
        } catch (error) {
          console.error("Error executing autofill script:", error);
          toast({
            title: "خطأ في الإدخال التلقائي",
            description: "تعذر تنفيذ الإدخال التلقائي في الإطار. قد تحتاج لفتح الموقع في نافذة خارجية.",
            variant: "destructive"
          });
        }
      };
      
      if (iframeRef.current.contentDocument?.readyState === 'complete') {
        handleIframeLoad();
      } else {
        iframeRef.current.addEventListener('load', handleIframeLoad);
        return () => {
          iframeRef.current?.removeEventListener('load', handleIframeLoad);
        };
      }
    }
  }, [autoFillScript, iframeRef.current, autoFillApplied]);
  
  const executeAutoFillScript = () => {
    if (!iframeRef.current || !autoFillScript) return;
    
    try {
      // محاولة تنفيذ السكريبت داخل الإطار
      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeWindow) {
        throw new Error("لا يمكن الوصول إلى نافذة الإطار");
      }
      
      // للمواقع التي تمنع الوصول مثل مواقع Google
      if (lastValidUrl.includes('google.com') || lastValidUrl.includes('docs.google.com')) {
        window.open(`javascript:${autoFillScript.replace('javascript:', '')}`, '_blank');
        toast({
          title: "تم فتح موقع Google في نافذة جديدة",
          description: "تم فتح موقع Google في نافذة جديدة. الرجاء تنفيذ سكريبت الإدخال هناك يدوياً.",
          variant: "warning"
        });
        return;
      }
      
      // إنشاء عنصر <script> وإضافته إلى محتوى الإطار
      const scriptElement = iframeWindow.document.createElement('script');
      scriptElement.textContent = decodeURIComponent(autoFillScript.replace('javascript:', ''));
      iframeWindow.document.body.appendChild(scriptElement);
      
      // حذف عنصر السكريبت بعد التنفيذ
      setTimeout(() => {
        iframeWindow.document.body.removeChild(scriptElement);
        
        // تنظيف عنوان URL بعد التنفيذ
        setSearchParams(
          searchParams => {
            searchParams.delete('autoFill');
            searchParams.delete('script');
            return searchParams;
          },
          { replace: true }
        );
        
        setAutoFillScript("");
      }, 100);
    } catch (error) {
      console.error("Error executing script in iframe:", error);
      // إذا فشل التنفيذ داخل الإطار، نفتح الموقع في نافذة جديدة
      window.open(`${lastValidUrl}#${autoFillScript}`, '_blank');
      toast({
        title: "تم فتح الموقع في نافذة جديدة",
        description: "تعذر تنفيذ السكريبت في الإطار. تم فتح الموقع في نافذة جديدة.",
        variant: "warning"
      });
    }
  };

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
    
    // التحقق مما إذا كان عنوان URL هو Google Sheets
    const isGoogleSheets = validatedUrl.includes('docs.google.com/spreadsheets');
    if (isGoogleSheets && viewMode === 'iframe') {
      toast({
        title: "تنبيه",
        description: "قد لا يعمل بعض مواقع Google بشكل صحيح داخل الإطار. استخدم 'فتح في نافذة خارجية' للتجربة الأفضل.",
        variant: "warning",
      });
    }
    
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
  
  // وظيفة حفظ بيانات تسجيل الدخول
  const saveLoginCredentials = () => {
    if (!currentUsername || !currentPassword) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }
    
    // استخراج اسم النطاق من URL
    const urlObj = new URL(lastValidUrl);
    const domain = urlObj.hostname;
    
    const newCredential: SavedCredential = {
      domain,
      username: currentUsername,
      password: currentPassword,
      date: new Date().toISOString()
    };
    
    // التحقق مما إذا كان النطاق موجودًا بالفعل وتحديثه
    const updatedCredentials = [...savedCredentials];
    const existingIndex = updatedCredentials.findIndex(cred => cred.domain === domain);
    
    if (existingIndex >= 0) {
      updatedCredentials[existingIndex] = newCredential;
    } else {
      updatedCredentials.push(newCredential);
    }
    
    // حفظ البيانات المحدثة
    setSavedCredentials(updatedCredentials);
    localStorage.setItem("savedLoginCredentials", JSON.stringify(updatedCredentials));
    
    toast({
      title: "تم الحفظ",
      description: `تم حفظ بيانات تسجيل الدخول لـ ${domain}`,
    });
    
    // إغلاق مربع الحوار وإعادة تعيين الحقول
    setCredentialsDialogOpen(false);
    setCurrentUsername("");
    setCurrentPassword("");
  };
  
  // حذف بيانات تسجيل دخول محفوظة
  const deleteCredential = (domain: string) => {
    const updatedCredentials = savedCredentials.filter(cred => cred.domain !== domain);
    setSavedCredentials(updatedCredentials);
    localStorage.setItem("savedLoginCredentials", JSON.stringify(updatedCredentials));
    
    toast({
      title: "تم الحذف",
      description: `تم حذف بيانات تسجيل الدخول لـ ${domain}`,
    });
  };
  
  // التحقق مما إذا كان العنوان هو Google Sheets
  const isGoogleSheetsUrl = lastValidUrl.includes('docs.google.com/spreadsheets');

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

          <div className="flex items-center gap-2 mb-4 flex-wrap">
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
            
            {/* زر حفظ بيانات تسجيل الدخول */}
            <Button 
              variant="outline" 
              className="text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
              onClick={() => setCredentialsDialogOpen(true)}
            >
              <Key className="h-4 w-4 ml-2" />
              حفظ بيانات الدخول
            </Button>
            
            {/* زر عرض بيانات تسجيل الدخول المحفوظة */}
            <Button 
              variant="outline" 
              className="text-sm bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/30"
              onClick={() => setCredentialsViewOpen(true)}
            >
              <Database className="h-4 w-4 ml-2" />
              بيانات الدخول المحفوظة {savedCredentials.length > 0 && `(${savedCredentials.length})`}
            </Button>
          </div>
          
          {isGoogleSheetsUrl && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 ml-2 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                مستندات Google قد لا تعمل بشكل صحيح داخل الإطار. ننصح باستخدام زر "فتح في نافذة خارجية" للحصول على تجربة أفضل.
              </p>
            </div>
          )}

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
              <li>الآن يمكنك تسجيل الدخول تلقائيًا إذا كنت قد حفظت بيانات الدخول من قبل</li>
              <li>يمكنك حفظ بيانات تسجيل الدخول لكل موقع باستخدام زر "حفظ بيانات الدخول"</li>
              <li>إذا كنت تواجه مشكلة في تسجيل الدخول، استخدم خيار "فتح في نافذة خارجية" لفتح الموقع في تبويب جديد</li>
              <li>جرب تغيير إعدادات الـ Sandbox إلى "كامل الصلاحيات" لتمكين تخزين الكوكيز وتتبع الجلسة</li>
              <li>في بعض الحالات، قد تحتاج لاستخدام "فتح في نافذة خارجية" ثم الرجوع بعد تسجيل الدخول</li>
              <li>بعض المواقع تحتوي على حماية ضد الـ iframe وقد لا تعمل داخل المعاينة على الإطلاق</li>
              <li>لمواقع Google مثل Sheets وDocs، يتم فتح الموقع في نافذة جديدة تلقائيًا</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* مربع حوار حفظ بيانات تسجيل الدخول */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حفظ بيانات تسجيل الدخول</DialogTitle>
            <DialogDescription>
              أدخل بيانات تسجيل الدخول للموقع الحالي ({new URL(lastValidUrl || "https://example.com").hostname})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={currentUsername}
                onChange={e => setCurrentUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCredentialsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button type="button" onClick={saveLoginCredentials}>
              <Save className="ml-2 h-4 w-4" /> حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* مربع حوار عرض بيانات تسجيل الدخول المحفوظة */}
      <Dialog open={credentialsViewOpen} onOpenChange={setCredentialsViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>بيانات تسجيل الدخول المحفوظة</DialogTitle>
            <DialogDescription>
              قائمة بيانات تسجيل الدخول التي قمت بحفظها
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {savedCredentials.length === 0 ? (
              <p className="text-center py-4 text-gray-500">لا توجد بيانات محفوظة</p>
            ) : (
              <div className="space-y-4">
                {savedCredentials.map((cred, index) => (
                  <div key={index} className="border p-3 rounded-md relative bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{cred.domain}</h4>
                        <p className="text-sm text-gray-500">المستخدم: {cred.username}</p>
                        <p className="text-sm text-gray-500">
                          تم الحفظ: {new Date(cred.date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCredential(cred.domain)}
                        className="h-8"
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
};

export default WebsitePreview;
