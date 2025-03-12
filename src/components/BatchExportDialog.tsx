
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageData } from "@/types/ImageData";
import { createBatchBookmarkletCode } from "@/lib/gemini";
import { Info, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BatchExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
}

const BatchExportDialog = ({ isOpen, onClose, images }: BatchExportDialogProps) => {
  const [selectedImages, setSelectedImages] = useState<Record<string, boolean>>({});
  const [bookmarkletUrl, setBookmarkletUrl] = useState<string>("");
  const { toast } = useToast();

  // تحديد كل الصور عند فتح النافذة
  React.useEffect(() => {
    if (isOpen) {
      const initialSelected = images.reduce((acc, img) => {
        // اختيار الصور التي تم استخراج بياناتها بنجاح
        if (img.status === "completed") {
          acc[img.id] = true;
        }
        return acc;
      }, {} as Record<string, boolean>);
      
      setSelectedImages(initialSelected);
    } else {
      setBookmarkletUrl("");
    }
  }, [isOpen, images]);

  const toggleSelectImage = (id: string) => {
    setSelectedImages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectAll = () => {
    const completedImages = images
      .filter(img => img.status === "completed")
      .reduce((acc, img) => {
        acc[img.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    
    setSelectedImages(completedImages);
  };

  const deselectAll = () => {
    setSelectedImages({});
  };

  const generateBookmarklet = () => {
    // تحديد الصور المختارة
    const selectedImagesData = images.filter(img => selectedImages[img.id]);
    
    if (selectedImagesData.length === 0) {
      toast({
        title: "لم يتم اختيار أي صور",
        description: "يرجى اختيار صورة واحدة على الأقل للتصدير",
        variant: "destructive"
      });
      return;
    }
    
    // إنشاء كود الـ bookmarklet
    const bookmarkletCode = createBatchBookmarkletCode(selectedImagesData);
    const bookmarkletUrl = `javascript:${encodeURIComponent(bookmarkletCode)}`;
    
    setBookmarkletUrl(bookmarkletUrl);
    
    toast({
      title: "تم إنشاء Bookmarklet",
      description: `تم تصدير بيانات ${selectedImagesData.length} صورة بنجاح`,
      variant: "default"
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookmarkletUrl);
    toast({
      title: "تم النسخ",
      description: "تم نسخ الرابط إلى الحافظة"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <ExternalLink className="ml-2 text-brand-coral" size={20} />
            تصدير بيانات متعددة دفعة واحدة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            اختر الصور التي تريد تصدير بياناتها دفعة واحدة
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold">اختر الصور ({Object.values(selectedImages).filter(Boolean).length} / {images.filter(img => img.status === "completed").length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} className="h-7 text-xs">
                اختيار الكل
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll} className="h-7 text-xs">
                إلغاء الاختيار
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr className="text-right">
                    <th className="px-3 py-2.5 text-xs font-medium">اختيار</th>
                    <th className="px-3 py-2.5 text-xs font-medium">الرقم</th>
                    <th className="px-3 py-2.5 text-xs font-medium">الكود</th>
                    <th className="px-3 py-2.5 text-xs font-medium">اسم المرسل</th>
                    <th className="px-3 py-2.5 text-xs font-medium">رقم الهاتف</th>
                    <th className="px-3 py-2.5 text-xs font-medium">المحافظة</th>
                    <th className="px-3 py-2.5 text-xs font-medium">السعر</th>
                  </tr>
                </thead>
                <tbody>
                  {images
                    .filter(img => img.status === "completed")
                    .map(image => (
                      <tr 
                        key={image.id} 
                        className="hover:bg-muted/20 border-t border-border/10"
                      >
                        <td className="px-3 py-2.5 text-center">
                          <Checkbox 
                            checked={!!selectedImages[image.id]} 
                            onCheckedChange={() => toggleSelectImage(image.id)} 
                            id={`select-${image.id}`}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-xs">{image.number}</td>
                        <td className="px-3 py-2.5 text-xs">{image.code || "—"}</td>
                        <td className="px-3 py-2.5 text-xs">{image.senderName || "—"}</td>
                        <td className="px-3 py-2.5 text-xs">{image.phoneNumber || "—"}</td>
                        <td className="px-3 py-2.5 text-xs">{image.province || "—"}</td>
                        <td className="px-3 py-2.5 text-xs">{image.price || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {bookmarkletUrl ? (
            <div className="mt-2 space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-brand-coral/10 text-xs">
                <Info className="h-4 w-4 text-brand-coral mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">كيفية استخدام Bookmarklet:</p>
                  <ol className="list-decimal text-xs mr-4 space-y-1">
                    <li>اسحب الزر أدناه إلى شريط المفضلة في المتصفح</li>
                    <li>افتح الموقع الذي تريد ملء بياناته</li>
                    <li>انقر على الـ bookmarklet في شريط المفضلة</li>
                    <li>سيتم ملء البيانات تلقائياً والانتقال بين السجلات</li>
                  </ol>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={bookmarkletUrl}
                  className="py-2 px-4 rounded-md bg-brand-coral text-white text-sm font-medium hover:bg-brand-coral/90 transition-colors"
                  draggable="true"
                  onClick={(e) => e.preventDefault()}
                >
                  <span className="flex items-center gap-1.5">
                    <ExternalLink size={14} />
                    اسحب هذا الزر إلى شريط المفضلة
                  </span>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="text-xs"
                >
                  <Copy size={14} className="ml-1.5" />
                  نسخ الرابط
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex justify-between items-center gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <Button
            onClick={generateBookmarklet}
            disabled={Object.values(selectedImages).filter(Boolean).length === 0}
            className="bg-brand-coral hover:bg-brand-coral/90"
          >
            تصدير الصور المحددة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchExportDialog;
