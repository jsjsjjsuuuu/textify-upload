
import React from 'react';
import { FolderOpen } from 'lucide-react';

const ImageEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 h-full min-h-[300px] text-center border-2 border-dashed rounded-lg">
      <div className="w-12 h-12 mb-4 bg-muted rounded-full flex items-center justify-center">
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">لا توجد صور</h3>
      <p className="text-muted-foreground">
        قم بتحميل صور ليتم معالجتها واستخراج البيانات منها
      </p>
    </div>
  );
};

export default ImageEmptyState;
