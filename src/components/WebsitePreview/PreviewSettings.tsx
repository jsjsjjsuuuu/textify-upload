
import React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PreviewSettingsProps {
  sandboxMode: string;
  useUserAgent: boolean;
  handleSandboxModeChange: (value: string) => void;
  handleUseUserAgentChange: (checked: boolean) => void;
}

const PreviewSettings = ({
  sandboxMode,
  useUserAgent,
  handleSandboxModeChange,
  handleUseUserAgentChange,
}: PreviewSettingsProps) => {
  return (
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
  );
};

export default PreviewSettings;
