
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BrowserToggleProps {
  useRealBrowser: boolean;
  isRunning: boolean;
  onToggle: (value: boolean) => void;
}

const BrowserToggle: React.FC<BrowserToggleProps> = ({
  useRealBrowser,
  isRunning,
  onToggle,
}) => {
  // عند تحميل المكون، نجعل الوضع الافتراضي هو استخدام متصفح حقيقي
  useEffect(() => {
    if (!useRealBrowser) {
      console.log("تفعيل وضع المتصفح الحقيقي تلقائياً");
      onToggle(true);
    }
  }, []);

  const handleToggle = (value: boolean) => {
    console.log(`تم تبديل وضع المتصفح الحقيقي إلى: ${value ? 'مفعل' : 'غير مفعل'}`);
    onToggle(value);
  };

  return (
    <div className="flex items-center space-x-2 space-x-reverse">
      <Switch
        id="use-real-browser"
        checked={useRealBrowser}
        onCheckedChange={handleToggle}
        disabled={isRunning}
      />
      <Label htmlFor="use-real-browser">استخدام متصفح حقيقي للتنفيذ</Label>
    </div>
  );
};

export default BrowserToggle;
