
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon, PlayIcon, AlertCircleIcon } from "lucide-react";
import { useBookmarkletGenerator } from "@/hooks/useBookmarkletGenerator";
import { useClipboard } from "@/hooks/useClipboard";
import { ImageData } from "@/types/ImageData";
import BookmarkletButton from "./BookmarkletButton";
import BookmarkletInstructions from "./BookmarkletInstructions";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const { 
    bookmarkletUrl, 
    bookmarkletCode, 
    rawDataObject,
    executeScript 
  } = useBookmarkletGenerator(
    imageData,
    multipleImages,
    isMultiMode,
    isOpen
  );
  
  // استخدام الهوك الخاص بنسخ النص
  const { copied, copyToClipboard } = useClipboard();
  const { toast } = useToast();
  
  // إضافة حالة لتتبع تنفيذ السكريبت
  const [isExecuting, setIsExecuting] = useState(false);

  // التحقق مما إذا كان آخر URL مستخدم هو موقع Google
  const lastUsedUrl = typeof window !== 'undefined' ? localStorage.getItem('lastAutoFillUrl') || '' : '';
  const isGoogleUrl = lastUsedUrl.includes('google.com') || lastUsedUrl.includes('docs.google.com');
  
  // نسخ الرابط إلى الحافظة
  const handleCopyToClipboard = () => {
    copyToClipboard(bookmarkletUrl);
  };

  // وظيفة تنفيذ سكريبت الإدخال التلقائي محسنة
  const handleExecuteScript = async () => {
    setIsExecuting(true);
    try {
      console.log("بيانات الإدخال التلقائي:", rawDataObject);
      
      // حفظ البيانات في localStorage لضمان عدم فقدانها
      localStorage.setItem('autofillData', JSON.stringify(rawDataObject));
      
      // استخدام الطريقة المباشرة: تنفيذ السكريبت مباشرة على الصفحة الهدف
      const targetUrl = lastUsedUrl || 'about:blank';
      
      if (targetUrl === 'about:blank') {
        toast({
          title: "لا يوجد موقع هدف",
          description: "يرجى فتح الموقع المستهدف أولاً ثم المحاولة مرة أخرى",
          variant: "destructive"
        });
        setIsExecuting(false);
        return;
      }
      
      // إضافة خيارات محسنة لزيادة فرص النجاح
      const options = {
        clickSubmitButton: true,    // النقر على زر الحفظ
        waitBeforeClick: 2000,      // انتظار ثانيتين قبل النقر
        retryCount: 5               // محاولة النقر 5 مرات
      };
      
      // استدعاء وظيفة تنفيذ السكريبت مع الخيارات المحسنة
      executeScript(targetUrl, options);
      
      toast({
        title: "تم بدء الإدخال التلقائي",
        description: "سيتم محاولة النقر على زر الحفظ عدة مرات لضمان تسجيل البيانات",
        variant: "default"
      });
      
      // إغلاق مربع الحوار بعد التنفيذ مع تأخير أطول
      setTimeout(() => {
        onClose();
        setIsExecuting(false);
      }, 3000);
    } catch (error) {
      console.error("خطأ في تنفيذ السكريبت:", error);
      toast({
        title: "خطأ في تنفيذ الإدخال التلقائي",
        description: "حدث خطأ: " + (error as Error).message,
        variant: "destructive"
      });
      setIsExecuting(false);
    }
  };
  
  // التحقق من دعم خاصية Bookmarklet في المتصفح
  const isBookmarkletSupported = () => {
    // التحقق من عدم استخدام متصفح جوال أو iOS
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return !isMobile || (isMobile && !isIOS);
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
            {isBookmarkletSupported() ? (
              <>
                اسحب الزر أدناه إلى شريط المفضلة في متصفحك، ثم انقر عليه في أي موقع تريد ملء البيانات فيه.
                {isGoogleUrl && <p className="mt-2 text-amber-500 font-semibold">ملاحظة: قد تحتاج للانتقال إلى Google Sheets في متصفحك واستخدام الـ bookmarklet من هناك</p>}
                {isMultiMode && <p className="mt-2 text-amber-500 font-semibold">ملاحظة: سيظهر لك شريط تحكم يمكنك من خلاله التنقل بين البيانات</p>}
              </>
            ) : (
              <div className="text-amber-500 font-semibold">
                <AlertCircleIcon className="inline-block ml-1 h-4 w-4" />
                يبدو أنك تستخدم متصفح جوال، قد لا يكون دعم Bookmarklet متاحاً. يمكنك استخدام زر "تنفيذ مباشرة" بدلاً من ذلك.
              </div>
            )}
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
          
          {/* أزرار التحكم */}
          <div className="flex justify-between items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleCopyToClipboard}
            >
              {copied ? <CheckIcon className="ml-2 h-4 w-4" /> : <CopyIcon className="ml-2 h-4 w-4" />}
              {copied ? "تم النسخ" : "نسخ الرابط"}
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              className="w-full bg-brand-green hover:bg-brand-green/90"
              onClick={handleExecuteScript}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <span className="flex items-center">
                  <span className="animate-spin ml-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  جاري التنفيذ...
                </span>
              ) : (
                <>
                  <PlayIcon className="ml-2 h-4 w-4" />
                  تنفيذ مباشرة
                </>
              )}
            </Button>
          </div>
          
          {/* تعليمات الاستخدام */}
          <BookmarkletInstructions 
            isMultiMode={isMultiMode} 
            isGoogleUrl={isGoogleUrl}
          />
          
          {/* اقتراحات إضافية للمستخدم مع إضافة إشعار حول النقر التلقائي على زر الحفظ */}
          <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-700/30">
            <p className="font-semibold mb-1 text-yellow-700 dark:text-yellow-400">ملاحظات مهمة عن حفظ البيانات:</p>
            <ul className="mr-4 list-disc space-y-1 text-xs">
              <li>النظام سيحاول <strong>النقر تلقائياً</strong> على زر الحفظ أو الإضافة بعد ملء النموذج</li>
              <li>في حال فشل النقر التلقائي، سيظهر إشعار يطلب منك النقر يدوياً على زر الحفظ</li>
              <li>سيتم محاولة النقر على الزر <strong>عدة مرات</strong> لضمان تسجيل البيانات</li>
              <li>في بعض المواقع، تحتاج للتأكد من ظهور رسالة تأكيد بعد الحفظ للتأكد من نجاح العملية</li>
              <li>إذا استمرت المشكلة، حاول فتح نافذة جديدة للموقع والتأكد من تسجيل الدخول أولاً</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkletGenerator;
