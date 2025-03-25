
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";

interface SheetsExportButtonProps {
  images: ImageData[];
}

const SheetsExportButton: React.FC<SheetsExportButtonProps> = ({ images }) => {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "وظيفة معطلة",
      description: "تم تعطيل وظائف Google Sheets في هذا الإصدار",
      variant: "destructive"
    });
  };

  return (
    <Button
      onClick={handleClick}
      className="w-full bg-gray-400 hover:bg-gray-500"
      disabled={true}
    >
      <AlertTriangle className="h-4 w-4 ml-2" />
      تم تعطيل التصدير إلى Google Sheets
    </Button>
  );
};

export default SheetsExportButton;
