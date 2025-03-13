
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PreviewSettingsProps {
  sandboxMode: string;
  useUserAgent: boolean;
  allowFullAccess: boolean;
  handleSandboxModeChange: (value: string) => void;
  handleUseUserAgentChange: (checked: boolean) => void;
  handleAllowFullAccessChange: (checked: boolean) => void;
}

const PreviewSettings = ({
  sandboxMode,
  useUserAgent,
  allowFullAccess,
  handleSandboxModeChange,
  handleUseUserAgentChange,
  handleAllowFullAccessChange,
}: PreviewSettingsProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">إعدادات المعاينة</h4>
          
          <div className="space-y-2">
            <Label htmlFor="sandbox-mode">وضع الصندوق الرملي</Label>
            <Select
              value={sandboxMode}
              onValueChange={handleSandboxModeChange}
              disabled={allowFullAccess}
            >
              <SelectTrigger id="sandbox-mode">
                <SelectValue placeholder="اختر وضع الصندوق الرملي" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow-same-origin allow-scripts allow-popups allow-forms">
                  متوسط (الافتراضي)
                </SelectItem>
                <SelectItem value="allow-same-origin allow-scripts allow-popups allow-forms allow-modals">
                  موسع
                </SelectItem>
                <SelectItem value="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation">
                  متقدم (مع التنقل)
                </SelectItem>
                <SelectItem value="">
                  آمن (مقيد)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              يؤثر على قدرة الصفحة على تنفيذ البرامج النصية والنوافذ المنبثقة
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="user-agent-switch">تغيير وكيل المستخدم</Label>
              <p className="text-xs text-muted-foreground">
                استخدام وكيل مستخدم للأجهزة المحمولة
              </p>
            </div>
            <Switch
              id="user-agent-switch"
              checked={useUserAgent}
              onCheckedChange={handleUseUserAgentChange}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="full-access-switch" className="text-amber-600 dark:text-amber-400">
                كامل الصلاحيات
              </Label>
              <p className="text-xs text-muted-foreground">
                تعطيل قيود الصندوق الرملي (مخاطر أمنية)
              </p>
            </div>
            <Switch
              id="full-access-switch"
              checked={allowFullAccess}
              onCheckedChange={handleAllowFullAccessChange}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
          
          {allowFullAccess && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
              تحذير: وضع كامل الصلاحيات يتجاوز حماية الصندوق الرملي، مما قد يسمح للمواقع غير الموثوقة بالوصول إلى بيانات التطبيق. استخدم هذا الخيار فقط مع المواقع الموثوقة.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PreviewSettings;
