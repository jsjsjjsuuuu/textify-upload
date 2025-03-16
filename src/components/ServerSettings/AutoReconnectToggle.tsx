
import React from "react";
import { Switch } from "@/components/ui/switch";

interface AutoReconnectToggleProps {
  autoReconnect: boolean;
  onAutoReconnectChange: (checked: boolean) => void;
}

const AutoReconnectToggle: React.FC<AutoReconnectToggleProps> = ({
  autoReconnect,
  onAutoReconnectChange
}) => {
  return (
    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
      <div className="space-y-1">
        <h3 className="font-medium">إعادة الاتصال التلقائي</h3>
        <p className="text-sm text-muted-foreground">عند تمكين هذا الخيار، سيحاول التطبيق إعادة الاتصال بالخادم تلقائيًا</p>
      </div>
      <Switch
        checked={autoReconnect}
        onCheckedChange={onAutoReconnectChange}
        aria-label="تفعيل إعادة الاتصال التلقائي"
      />
    </div>
  );
};

export default AutoReconnectToggle;
