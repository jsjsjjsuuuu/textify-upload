
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface AdvancedOptionsProps {
  showAdvanced: boolean;
  isGeneratingUrl: boolean;
  onRegenerateBookmarklet: () => void;
  onToggleAdvanced: () => void;
}

const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  showAdvanced,
  isGeneratingUrl,
  onRegenerateBookmarklet,
  onToggleAdvanced
}) => {
  return (
    <>
      {showAdvanced && (
        <div className="mt-4 space-y-3">
          <Separator />
          <h3 className="text-sm font-medium pt-2">خيارات متقدمة:</h3>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRegenerateBookmarklet}
            className="w-full"
            disabled={isGeneratingUrl}
          >
            <RefreshCw className="h-3.5 w-3.5 ml-1.5" />
            إعادة إنشاء رمز Bookmarklet
          </Button>
          
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md p-3 mt-2">
            <h4 className="text-xs font-medium text-amber-800 dark:text-amber-400 flex items-center">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              ملاحظات هامة
            </h4>
            <ul className="text-xs text-amber-700 dark:text-amber-500 mt-1 space-y-1 list-disc list-inside">
              <li>قد تحتاج لإعادة إنشاء الرابط بعد تحديثات النظام</li>
              <li>بعض المواقع قد تمنع تشغيل البرامج النصية الخارجية</li>
              <li>للحصول على أفضل النتائج، استخدم متصفح Chrome أو Firefox أو Edge</li>
            </ul>
          </div>
        </div>
      )}
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onToggleAdvanced}
        className="text-xs w-full mt-2"
      >
        {showAdvanced ? "إخفاء الخيارات المتقدمة" : "إظهار الخيارات المتقدمة"}
      </Button>
    </>
  );
};

export default AdvancedOptions;
