
import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Trash } from "lucide-react";
import BookmarkletStats from "./BookmarkletStats";

interface ExportDataSectionProps {
  stats: {
    total: number;
    ready: number;
    success: number;
    error: number;
    lastUpdate: Date | null;
  };
  imagesCount: number;
  validImagesCount: number;
  storedCount: number;
  onExport: () => void;
  onClear: () => void;
}

const ExportDataSection: React.FC<ExportDataSectionProps> = ({
  stats,
  imagesCount,
  validImagesCount,
  storedCount,
  onExport,
  onClear
}) => {
  return (
    <div className="space-y-4">
      {/* جزء عرض الإحصائيات */}
      <BookmarkletStats 
        stats={stats} 
        imagesCount={imagesCount} 
        validImagesCount={validImagesCount} 
      />
      
      <div className="flex flex-col space-y-3">
        <Button onClick={onExport} className="bg-brand-green hover:bg-brand-green/90">
          <Save className="h-4 w-4 ml-2" />
          تصدير البيانات إلى ذاكرة المتصفح
        </Button>
        
        {storedCount > 0 && (
          <Button variant="outline" onClick={onClear} className="border-destructive/30 text-destructive hover:bg-destructive/10">
            <Trash className="h-4 w-4 ml-2" />
            مسح البيانات المخزنة
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExportDataSection;
