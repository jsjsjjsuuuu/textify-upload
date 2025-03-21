
import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface BrowserToggleProps {
  useBrowserData: boolean;
  onToggle: (value: boolean) => void;
  isRunning?: boolean;
}

const BrowserToggle: React.FC<BrowserToggleProps> = ({ useBrowserData, onToggle, isRunning }) => {
  // تأكد من أن الحالة الافتراضية هي true دائمًا
  const [isRealBrowser, setIsRealBrowser] = useState(true);
  
  useEffect(() => {
    // تحديث الحالة المحلية بناءً على الخاصية
    setIsRealBrowser(true); // تجاهل قيمة useBrowserData وجعلها true دائمًا
    // إذا كانت القيمة الحالية false، قم بتغييرها إلى true
    if (!useBrowserData) {
      onToggle(true);
    }
  }, [useBrowserData, onToggle]);
  
  const handleToggle = (checked: boolean) => {
    // لا نسمح بتعيين القيمة إلى false أبدًا
    const newValue = true;
    setIsRealBrowser(newValue);
    onToggle(newValue);
  };
  
  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <Switch
        id="browser-toggle"
        checked={isRealBrowser}
        onCheckedChange={handleToggle}
        disabled={true} // تعطيل التبديل تمامًا
      />
      <Label htmlFor="browser-toggle" className="cursor-pointer">
        استخدام متصفح حقيقي
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              تم تفعيل وضع المتصفح الحقيقي بشكل دائم للحصول على أفضل النتائج وتجنب مشاكل الأتمتة.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default BrowserToggle;
