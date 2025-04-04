
import React from 'react';
import { ImageIcon } from 'lucide-react';

const NoImagesPlaceholder: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
      <ImageIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-60" />
      <h3 className="text-xl font-medium text-center mb-2">لا توجد صور بعد</h3>
      <p className="text-muted-foreground text-center max-w-md">
        لم يتم رفع أي صور بعد. يرجى استخدام قسم "رفع الصور" لإضافة صور جديدة.
      </p>
    </div>
  );
};

export default NoImagesPlaceholder;
