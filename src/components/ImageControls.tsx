
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileJson, 
  FileText, 
  RefreshCw, 
  Eraser, 
  HardDriveDownload,
  Key
} from 'lucide-react';
import { Link } from "react-router-dom";

interface ImageControlsProps {
  totalImages: number;
  completedImages: number;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onRefreshImages: () => void;
  onCleanupDuplicates: () => void;
}

const ImageControls: React.FC<ImageControlsProps> = ({
  totalImages,
  completedImages,
  onExportJSON,
  onExportCSV,
  onRefreshImages,
  onCleanupDuplicates
}) => {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6 shadow-sm">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="text-sm font-medium">
            <span className="text-green-600 dark:text-green-400">{completedImages}</span>
            <span className="mx-1 text-gray-500">/</span>
            <span>{totalImages}</span>
            <span className="mr-2 text-gray-500">صور مكتملة</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCleanupDuplicates}
            className="flex items-center"
            title="تنظيف الصور المكررة"
          >
            <Eraser className="h-4 w-4 ml-1" />
            <span>تنظيف التكرارات</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshImages}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            <span>تحديث الصور</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="flex items-center"
            disabled={completedImages === 0}
          >
            <FileText className="h-4 w-4 ml-1" />
            <span>تصدير CSV</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExportJSON}
            className="flex items-center"
            disabled={completedImages === 0}
          >
            <FileJson className="h-4 w-4 ml-1" />
            <span>تصدير JSON</span>
          </Button>
          
          <Link to="/api-keys">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-200"
            >
              <Key className="h-4 w-4 ml-1" />
              <span>إدارة مفاتيح API</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ImageControls;
