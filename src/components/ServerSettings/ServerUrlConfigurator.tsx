
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAutomationServerUrl } from "@/utils/automationServerUrl";
import { RefreshCw } from "lucide-react";

interface ServerUrlConfiguratorProps {
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  onCheckStatus: () => void;
  isLoading: boolean;
}

const ServerUrlConfigurator: React.FC<ServerUrlConfiguratorProps> = ({
  serverUrl,
  onServerUrlChange,
  onCheckStatus,
  isLoading
}) => {
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">عنوان URL الحالي:</h3>
        <div className="p-3 bg-muted rounded-md text-sm font-mono break-all">
          {getAutomationServerUrl()}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium">تعيين عنوان URL مخصص:</h3>
        <div className="flex space-x-2 flex-row-reverse">
          <Input
            dir="ltr"
            type="text"
            value={serverUrl}
            onChange={(e) => onServerUrlChange(e.target.value)}
            placeholder="أدخل عنوان URL للخادم"
            className="flex-1"
          />
          <Button 
            variant="secondary" 
            onClick={onCheckStatus}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                جارٍ الفحص...
              </>
            ) : (
              'فحص الاتصال'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServerUrlConfigurator;
