
import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, FileDown } from "lucide-react";

interface ExportToolsProps {
  isRunning: boolean;
  onCopyBookmarklet: () => void;
  onExportJson: () => void;
}

const ExportTools: React.FC<ExportToolsProps> = ({
  isRunning,
  onCopyBookmarklet,
  onExportJson,
}) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={onCopyBookmarklet}
        disabled={isRunning}
      >
        <Copy className="h-4 w-4 mr-1" />
        نسخ Bookmarklet
      </Button>
      <Button
        variant="outline"
        onClick={onExportJson}
        disabled={isRunning}
      >
        <FileDown className="h-4 w-4 mr-1" />
        تصدير JSON
      </Button>
    </div>
  );
};

export default ExportTools;
