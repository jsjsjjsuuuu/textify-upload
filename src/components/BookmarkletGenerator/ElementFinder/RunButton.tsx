
import React from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2 } from "lucide-react";

interface RunButtonProps {
  isRunning: boolean;
  onRun: () => void;
}

const RunButton: React.FC<RunButtonProps> = ({ isRunning, onRun }) => {
  const handleRun = () => {
    console.log("زر التنفيذ: بدء تنفيذ الأتمتة");
    onRun();
  };

  return (
    <Button
      onClick={handleRun}
      disabled={isRunning}
      className="bg-purple-600 hover:bg-purple-700"
    >
      {isRunning ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          جاري التنفيذ...
        </>
      ) : (
        <>
          <PlayCircle className="h-4 w-4 mr-1" />
          تنفيذ الأتمتة
        </>
      )}
    </Button>
  );
};

export default RunButton;
