
import React from "react";
import { FileImage, Upload } from "lucide-react";

const ImageEmptyState: React.FC = () => {
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4 bg-muted/30">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center">
          <FileImage className="h-10 w-10 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-semibold">لا توجد صور</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        قم بتحميل صور جديدة باستخدام زر التحميل أعلاه، وستظهر هنا للمعالجة واستخراج البيانات منها.
      </p>
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-2 text-sm text-primary">
          <Upload className="h-4 w-4" />
          اسحب وأفلت الصور هنا أو انقر للتصفح
        </div>
      </div>
    </div>
  );
};

export default ImageEmptyState;
