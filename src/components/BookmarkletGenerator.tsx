
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";
import { createBookmarkletCode, createBatchBookmarkletCode } from "@/lib/gemini/index";

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
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [bookmarkletCode, setBookmarkletCode] = useState("");
  const [bookmarkletUrl, setBookmarkletUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (isMultiMode && multipleImages.length > 0) {
        // استخدام الدالة المحسنة من مكتبة gemini
        const code = createBatchBookmarkletCode(multipleImages);
        setBookmarkletCode(code);
        setBookmarkletUrl(code);
      } else if (imageData) {
        // استخدام الدالة المحسنة من مكتبة gemini
        const code = createBookmarkletCode(imageData);
        setBookmarkletCode(code);
        setBookmarkletUrl(code);
      }
    }
  }, [imageData, multipleImages, isOpen, isMultiMode]);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletUrl);
      setCopied(true);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الـ Bookmarklet بنجاح"
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "خطأ في النسخ",
        description: "لم يتم نسخ الرابط. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl mb-2">
            {isMultiMode 
              ? `أداة ملء البيانات المتعددة (${multipleImages.length} صورة)` 
              : 'أداة ملء البيانات تلقائياً'
            }
          </DialogTitle>
          <DialogDescription className="text-center">
            اسحب الزر أدناه إلى شريط المفضلة في متصفحك، ثم انقر عليه في أي موقع تريد ملء البيانات فيه.
            {isMultiMode && <p className="mt-2 text-amber-500 font-semibold">ملاحظة: سيظهر لك شريط تحكم يمكنك من خلاله التنقل بين البيانات</p>}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 mt-4">
          <div className="border border-border rounded-md p-4 bg-muted/20 text-center">
            <a 
              href={bookmarkletUrl} 
              className="inline-block bg-brand-green text-white py-2 px-4 rounded-md hover:bg-brand-green/90 transition-colors"
              onClick={(e) => e.preventDefault()}
              title="اسحب هذا الزر إلى شريط المفضلة"
            >
              {isMultiMode ? `ملء البيانات المتعددة (${multipleImages.length})` : 'ملء البيانات تلقائياً'}
            </a>
            <p className="mt-2 text-sm text-muted-foreground">اسحب هذا الزر إلى شريط المفضلة في متصفحك</p>
          </div>
          
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={copyToClipboard}
            >
              {copied ? <CheckIcon className="ml-2 h-4 w-4" /> : <CopyIcon className="ml-2 h-4 w-4" />}
              {copied ? "تم النسخ" : "نسخ الرابط"}
            </Button>
          </div>
          
          <div className="text-sm mt-2 space-y-2">
            <h4 className="font-medium">كيفية الاستخدام:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
              <li>اسحب الزر الأخضر أعلاه إلى شريط المفضلة في متصفحك</li>
              <li>انتقل إلى الموقع الذي تريد ملء البيانات فيه</li>
              <li>انقر على الزر في شريط المفضلة</li>
              {isMultiMode ? (
                <>
                  <li>سيظهر شريط تحكم يمكنك من خلاله التنقل بين البيانات باستخدام أزرار "التالي" و"السابق"</li>
                  <li>يمكنك سحب شريط التحكم وتحريكه في أي مكان على الصفحة</li>
                </>
              ) : (
                <li>سيتم ملء الحقول المتطابقة تلقائياً</li>
              )}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkletGenerator;
