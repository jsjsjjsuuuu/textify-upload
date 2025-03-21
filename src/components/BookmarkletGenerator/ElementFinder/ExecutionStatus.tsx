
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ExecutionStatusProps {
  isRunning: boolean;
  automationProgress: number;
  automationStatus: string;
  serverError: string | null;
}

const ExecutionStatus: React.FC<ExecutionStatusProps> = ({
  isRunning,
  automationProgress,
  automationStatus,
  serverError,
}) => {
  if (!isRunning && !serverError) return null;
  
  return (
    <div className="space-y-4">
      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{automationStatus}</span>
            <span>{automationProgress}%</span>
          </div>
          <Progress value={automationProgress} className="h-2" />
        </div>
      )}
      
      {serverError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>فشل تنفيذ الأتمتة</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExecutionStatus;
