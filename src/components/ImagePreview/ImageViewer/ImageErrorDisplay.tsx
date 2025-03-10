
import { ImageOff } from "lucide-react";

const ImageErrorDisplay = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
      <ImageOff size={48} />
      <p className="mt-2 text-center font-medium">فشل تحميل الصورة</p>
      <p className="text-sm text-muted-foreground mt-1">يمكنك محاولة تحميلها مرة أخرى</p>
    </div>
  );
};

export default ImageErrorDisplay;
