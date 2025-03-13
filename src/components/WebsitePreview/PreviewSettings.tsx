
import React from "react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface PreviewSettingsProps {
  sandboxMode: string;
  useUserAgent: boolean;
  allowFullAccess?: boolean;
  handleSandboxModeChange: (value: string) => void;
  handleUseUserAgentChange: (checked: boolean) => void;
  handleAllowFullAccessChange?: (checked: boolean) => void;
}

const PreviewSettings = ({ 
  sandboxMode, 
  useUserAgent, 
  allowFullAccess = false,
  handleSandboxModeChange, 
  handleUseUserAgentChange,
  handleAllowFullAccessChange 
}: PreviewSettingsProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mt-2">
      <CollapsibleTrigger className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        إعدادات متقدمة
        <ChevronDown className="h-4 w-4 mr-1 transition-transform" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="space-y-3 rounded-md border p-3 text-sm">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">خيارات Sandbox:</Label>
            <RadioGroup 
              value={sandboxMode} 
              onValueChange={handleSandboxModeChange}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="allow-same-origin allow-scripts allow-popups allow-forms" id="option1" />
                <Label htmlFor="option1" className="text-xs">افتراضي (آمن)</Label>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox" id="option2" />
                <Label htmlFor="option2" className="text-xs">متوسط (يسمح بالنوافذ المنبثقة)</Label>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox allow-storage-access-by-user-activation" id="option3" />
                <Label htmlFor="option3" className="text-xs">موسع (يسمح بتخزين البيانات)</Label>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="" id="option4" />
                <Label htmlFor="option4" className="text-xs">كامل الصلاحيات (غير آمن)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="use-ua" className="text-xs">محاكاة متصفح جوال</Label>
            <Switch 
              id="use-ua" 
              checked={useUserAgent}
              onCheckedChange={handleUseUserAgentChange}
            />
          </div>

          {handleAllowFullAccessChange && (
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-full-access" className="text-xs">السماح بالوصول الكامل (مناسب لمواقع تسجيل الدخول)</Label>
              <Switch 
                id="allow-full-access" 
                checked={allowFullAccess}
                onCheckedChange={handleAllowFullAccessChange}
              />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PreviewSettings;
