
import React from "react";
import { Badge } from "@/components/ui/badge";
import { FileBox, CheckCircle2, AlertTriangle } from "lucide-react";

interface BookmarkletStatsProps {
  stats: {
    total: number;
    ready: number;
    success: number;
    error: number;
    lastUpdate: Date | null;
  };
  imagesCount: number;
  validImagesCount: number;
}

const BookmarkletStats: React.FC<BookmarkletStatsProps> = ({ stats, imagesCount, validImagesCount }) => {
  return (
    <div className="bg-secondary/30 rounded-lg p-4">
      <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
        <span>حالة البيانات:</span>
        {stats.lastUpdate && (
          <span className="text-xs text-muted-foreground">
            آخر تحديث: {stats.lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <span className="text-muted-foreground">إجمالي الصور:</span>
          <Badge variant="outline" className="ml-2">
            {imagesCount}
          </Badge>
        </div>
        <div className="flex items-center">
          <span className="text-muted-foreground">العناصر المكتملة:</span>
          <Badge variant="outline" className="ml-2">
            {validImagesCount}
          </Badge>
        </div>
        <div className="flex items-center">
          <span className="text-muted-foreground">العناصر المخزنة:</span>
          <Badge variant={stats.total > 0 ? "default" : "outline"} className={stats.total > 0 ? "ml-2 bg-brand-green" : "ml-2"}>
            {stats.total}
          </Badge>
        </div>
        {stats.total > 0 && (
          <div className="flex items-center">
            <span className="text-muted-foreground">جاهزة للإدخال:</span>
            <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-600 border-blue-200">
              {stats.ready}
            </Badge>
          </div>
        )}
      </div>
      
      {stats.total > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {stats.success > 0 && (
            <div className="flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mr-1.5" />
              <span className="text-xs text-green-600">تم إدخال {stats.success} وصل بنجاح</span>
            </div>
          )}
          {stats.error > 0 && (
            <div className="flex items-center">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 mr-1.5" />
              <span className="text-xs text-red-600">فشل إدخال {stats.error} وصل</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookmarkletStats;
