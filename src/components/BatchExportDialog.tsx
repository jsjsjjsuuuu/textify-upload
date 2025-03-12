import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageData } from "@/types/ImageData";
import BookmarkletGenerator from "@/components/BookmarkletGenerator";

interface BatchExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
}

const BatchExportDialog = ({ isOpen, onClose, images }: BatchExportDialogProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  
  // فلترة الصور المكتملة فقط
  const completedImages = useMemo(() => 
    images.filter(img => img.status === "completed"), 
    [images]
  );
  
  // الصور المحددة كاملة
  const selectedImagesData = useMemo(() => 
    completedImages.filter(img => selectedImages.includes(img.id)),
    [completedImages, selectedImages]
  );

  // تحديد أو إلغاء تحديد كل الصور
  const toggleSelectAll = () => {
    if (selectedImages.length === completedImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(completedImages.map(img => img.id));
    }
  };

  // تبديل تحديد صورة واحدة
  const toggleSelectImage = (id: string) => {
    if (selectedImages.includes(id)) {
      setSelectedImages(selectedImages.filter(imageId => imageId !== id));
    } else {
      setSelectedImages([...selectedImages, id]);
    }
  };
  
  // فتح نافذة إنشاء Bookmarklet
  const openBookmarkletGenerator = () => {
    setIsBookmarkletOpen(true);
  };
  
  // إعادة تعيين الحالة عند الإغلاق
  const handleClose = () => {
    setSelectedImages([]);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl mb-2">تصدير البيانات للصور المحددة</DialogTitle>
            <DialogDescription>
              حدد الصور التي تريد تصدير بياناتها، ثم انقر على "إنشاء Bookmarklet".
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-4 justify-end">
              <Checkbox 
                id="selectAll" 
                checked={selectedImages.length === completedImages.length && completedImages.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="selectAll" className="text-sm cursor-pointer mr-2">
                تحديد الكل ({completedImages.length})
              </label>
            </div>
            
            <ScrollArea className="h-[200px] rounded-md border p-2">
              {completedImages.length > 0 ? (
                <div className="space-y-2">
                  {completedImages.map(image => (
                    <div key={image.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md justify-between">
                      <div className="flex items-center">
                        <Checkbox 
                          id={`image-${image.id}`} 
                          checked={selectedImages.includes(image.id)}
                          onCheckedChange={() => toggleSelectImage(image.id)}
                          className="ml-2"
                        />
                        <div className="mr-2 flex flex-col">
                          <span className="text-sm font-medium">
                            {image.senderName || "بدون اسم"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            كود: {image.code || "غير متوفر"} | {image.province || "غير متوفر"}
                          </span>
                        </div>
                      </div>
                      {image.number && (
                        <span className="text-xs bg-brand-coral/10 text-brand-coral px-2 py-1 rounded">
                          #{image.number}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">لا توجد صور مكتملة</p>
                </div>
              )}
            </ScrollArea>
            
            <p className="text-sm text-muted-foreground mt-4">
              تم تحديد {selectedImages.length} من أصل {completedImages.length} صورة.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              className="ml-2"
            >
              إلغاء
            </Button>
            <Button
              onClick={openBookmarkletGenerator}
              disabled={selectedImages.length === 0}
              className="bg-brand-coral text-white hover:bg-brand-coral/90"
            >
              إنشاء Bookmarklet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {isBookmarkletOpen && (
        <BookmarkletGenerator
          isOpen={isBookmarkletOpen}
          onClose={() => setIsBookmarkletOpen(false)}
          imageData={null}
          multipleImages={selectedImagesData}
          isMultiMode={true}
        />
      )}
    </>
  );
};

export default BatchExportDialog;
