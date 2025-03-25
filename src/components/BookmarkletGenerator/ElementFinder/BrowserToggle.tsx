
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import { toast } from "sonner";

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
  // عند تحميل المكون، نجعل الوضع الافتراضي هو استخدام متصفح حقيقي وتفعيله إجبارياً
  useEffect(() => {
    if (!useRealBrowser) {
      console.log("تفعيل وضع المتصفح الحقيقي تلقائياً وإجبارياً");
      onToggle(true);
      
      // إعلام المستخدم
      toast.info("تم تفعيل وضع المتصفح الحقيقي", {
        description: "هذا ضروري لتنفيذ الأتمتة بشكل صحيح على مواقع الويب الحديثة"
      });
    }
  }, [useRealBrowser, onToggle]);

  const handleToggle = (value: boolean) => {
    // دائمًا نبقي على وضع المتصفح الحقيقي مفعل
    if (!value) {
      toast.info("وضع المتصفح الحقيقي مطلوب", {
        description: "لا يمكن تعطيل هذا الوضع لأنه ضروري للأتمتة الناجحة"
      });
      return;
    }
    
    console.log(`تم تبديل وضع المتصفح الحقيقي إلى: ${value ? 'مفعل' : 'غير مفعل'}`);
    onToggle(true); // دائمًا نرسل "true"
  };

  return (
    <div className="flex items-center space-x-2 space-x-reverse justify-between bg-green-50 p-3 rounded-md border border-green-100">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-green-500" />
        <Label htmlFor="use-real-browser" className="font-medium text-green-800">
          وضع المتصفح الحقيقي
          <span className="text-xs font-normal block text-green-600 mt-1">
            يتم تنفيذ الأتمتة من خلال متصفح حقيقي على الخادم (مفعل دائماً)
          </span>
        </Label>
      </div>
      <Switch
        id="use-real-browser"
        checked={true} // دائمًا مفعل
        onCheckedChange={handleToggle}
        disabled={true} // دائمًا معطل للتأكد من عدم تغييره
        className="data-[state=checked]:bg-green-600"
      />
    </div>
  );
};

export default BrowserToggle;
