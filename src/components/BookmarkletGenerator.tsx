
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon } from "lucide-react";
import { useBookmarkletGenerator } from "@/hooks/useBookmarkletGenerator";
import { useClipboard } from "@/hooks/useClipboard";
import { ImageData } from "@/types/ImageData";
import BookmarkletButton from "./BookmarkletButton";
import BookmarkletInstructions from "./BookmarkletInstructions";

interface BookmarkletGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: ImageData | null;
  multipleImages?: ImageData[];
  isMultiMode?: boolean;
}

const BookmarkletGenerator = ({ 
  isOpen, 
  onClose, 
  imageData, 
  multipleImages = [], 
  isMultiMode = false 
}: BookmarkletGeneratorProps) => {
  // استخدام الهوك الخاص بإنشاء الـ bookmarklet
  const { bookmarkletUrl } = useBookmarkletGenerator(
    imageData,
    multipleImages,
    isMultiMode,
    isOpen
  );
  
  // استخدام الهوك الخاص بنسخ النص
  const { copied, copyToClipboard } = useClipboard();
  
  // التحقق مما إذا كان آخر URL مستخدم هو موقع Google
  const lastUsedUrl = typeof window !== 'undefined' ? localStorage.getItem('lastAutoFillUrl') || '' : '';
  const isGoogleUrl = lastUsedUrl.includes('google.com') || lastUsedUrl.includes('docs.google.com');
  
  // نسخ الرابط إلى الحافظة
  const handleCopyToClipboard = () => {
    copyToClipboard(bookmarkletUrl);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl mb-2">
            {isMultiMode 
              ? `أداة ملء البيانات المتعددة (${multipleImages.length} صورة)` 
              : isGoogleUrl
                ? 'أداة ملء بيانات Google Sheets/Docs'
                : 'أداة ملء البيانات تلقائياً'
            }
          </DialogTitle>
          <DialogDescription className="text-center">
            اسحب الزر أدناه إلى شريط المفضلة في متصفحك، ثم انقر عليه في أي موقع تريد ملء البيانات فيه.
            {isGoogleUrl && <p className="mt-2 text-amber-500 font-semibold">ملاحظة: قد تحتاج للانتقال إلى Google Sheets في متصفحك واستخدام الـ bookmarklet من هناك</p>}
            {isMultiMode && <p className="mt-2 text-amber-500 font-semibold">ملاحظة: سيظهر لك شريط تحكم يمكنك من خلاله التنقل بين البيانات</p>}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 mt-4">
          {/* زر الـ bookmarklet */}
          <BookmarkletButton 
            url={bookmarkletUrl} 
            isMultiMode={isMultiMode}
            isGoogleMode={isGoogleUrl}
            imagesCount={multipleImages.length} 
          />
          
          {/* زر النسخ */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleCopyToClipboard}
            >
              {copied ? <CheckIcon className="ml-2 h-4 w-4" /> : <CopyIcon className="ml-2 h-4 w-4" />}
              {copied ? "تم النسخ" : "نسخ الرابط"}
            </Button>
          </div>
          
          {/* تعليمات الاستخدام */}
          <BookmarkletInstructions 
            isMultiMode={isMultiMode} 
            isGoogleUrl={isGoogleUrl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkletGenerator;
