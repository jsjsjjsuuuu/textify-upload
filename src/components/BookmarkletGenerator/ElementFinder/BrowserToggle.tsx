
import React from "react";
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
  return (
    <div className="flex items-center space-x-2 space-x-reverse">
      <Switch
        id="use-real-browser"
        checked={useRealBrowser}
        onCheckedChange={onToggle}
        disabled={isRunning}
      />
      <Label htmlFor="use-real-browser">استخدام متصفح حقيقي للتنفيذ</Label>
    </div>
  );
};

export default BrowserToggle;
