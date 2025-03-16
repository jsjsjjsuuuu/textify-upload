
import React from "react";

interface ServerInfoDisplayProps {
  serverInfo: any | null;
  serverStatus: 'idle' | 'checking' | 'online' | 'offline';
}

const ServerInfoDisplay: React.FC<ServerInfoDisplayProps> = ({
  serverInfo,
  serverStatus
}) => {
  if (serverStatus !== 'online' || !serverInfo) {
    return null;
  }

  return (
    <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
      <h3 className="text-lg font-medium">معلومات الخادم:</h3>
      <div className="space-y-1 text-sm">
        <div><strong>الحالة:</strong> {serverInfo.status}</div>
        <div><strong>الرسالة:</strong> {serverInfo.message}</div>
        <div><strong>الوقت:</strong> {new Date(serverInfo.time).toLocaleString()}</div>
        {serverInfo.systemInfo && (
          <>
            <div><strong>إصدار Node.js:</strong> {serverInfo.systemInfo.nodeVersion}</div>
            <div><strong>المنصة:</strong> {serverInfo.systemInfo.platform}</div>
            <div><strong>وقت التشغيل:</strong> {Math.floor(serverInfo.systemInfo.uptime / 60)} دقيقة</div>
            <div><strong>البيئة:</strong> {serverInfo.systemInfo.env}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServerInfoDisplay;
