
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon, PlayIcon, AlertCircleIcon } from "lucide-react";
import { useBookmarkletGenerator } from "@/hooks/useBookmarkletGenerator";
import { useClipboard } from "@/hooks/useClipboard";
import { ImageData } from "@/types/ImageData";
import BookmarkletButton from "./BookmarkletButton";
import BookmarkletInstructions from "./BookmarkletInstructions";
import { useState, useEffect } from "react";
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
  const { bookmarkletUrl, bookmarkletCode } = useBookmarkletGenerator(
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
  
  // محاولة الوصول إلى صفحة ويب مفتوحة
  useEffect(() => {
    const checkForOpenedTabs = () => {
      if (isOpen && bookmarkletUrl && window.opener) {
        try {
          // محاولة الوصول إلى النافذة المفتوحة والتحقق من قابليتها للوصول
          const openerWindow = window.opener;
          if (openerWindow && !openerWindow.closed) {
            toast({
              title: "يمكنك تنفيذ الإدخال التلقائي مباشرة",
              description: "تم اكتشاف نافذة مفتوحة، يمكنك النقر على 'تنفيذ مباشرة' لتعبئة البيانات",
              variant: "default"
            });
          }
        } catch (error) {
          console.error("خطأ في الوصول إلى النافذة المفتوحة:", error);
        }
      }
    };
    
    checkForOpenedTabs();
  }, [isOpen, bookmarkletUrl, toast]);
  
  // نسخ الرابط إلى الحافظة
  const handleCopyToClipboard = () => {
    copyToClipboard(bookmarkletUrl);
  };

  // إضافة وظيفة تنفيذ سكريبت الإدخال التلقائي في نافذة الحالية
  const handleExecuteScript = async () => {
    setIsExecuting(true);
    try {
      // استخراج السكريبت من الرابط
      const scriptContent = decodeURIComponent(
        bookmarkletUrl.replace('javascript:', '')
      );
      
      // تسجيل السكريبت للتشخيص
      console.log("سكريبت الإدخال التلقائي:", scriptContent.substring(0, 100) + "...");
      
      // حفظ آخر عنوان URL في التخزين المحلي للإشارة إليه في السكريبت
      localStorage.setItem('lastAutoFillUrl', window.location.href);
      
      // التحقق من وجود نافذة مفتوحة يمكن استخدامها
      if (window.opener && !window.opener.closed) {
        try {
          // محاولة تنفيذ السكريبت في النافذة المفتوحة
          // إعداد فتح نافذة جديدة مع السكريبت - نهج أكثر موثوقية
          const newWindow = window.open('about:blank', '_blank');
          
          if (newWindow) {
            // كتابة صفحة HTML بسيطة للتأكد من تحميل المستند بشكل صحيح
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>جاري تنفيذ الإدخال التلقائي...</title>
                <meta charset="utf-8">
              </head>
              <body>
                <h3 style="font-family: Arial; text-align: center; margin-top: 50px;">جاري تنفيذ الإدخال التلقائي...</h3>
                <p style="font-family: Arial; text-align: center;">سيتم تحويلك تلقائياً خلال لحظات.</p>
                <script>
                  // استدعاء السكريبت المطلوب بعد تحميل الصفحة
                  setTimeout(function() {
                    try {
                      ${scriptContent}
                    } catch (err) {
                      console.error("Error executing script:", err);
                      document.body.innerHTML += '<p style="color: red; text-align: center;">حدث خطأ: ' + err.message + '</p>';
                    }
                  }, 500);
                </script>
              </body>
              </html>
            `);
            
            // إغلاق الكتابة للتأكد من تحميل المستند
            newWindow.document.close();
            
            toast({
              title: "تم فتح نافذة جديدة",
              description: "تم تحويل الإدخال التلقائي إلى نافذة جديدة. يرجى التحقق منها.",
              variant: "default"
            });
          } else {
            throw new Error("لم يتم فتح النافذة الجديدة. قد تكون النوافذ المنبثقة محظورة.");
          }
        } catch (error) {
          console.error("خطأ في تنفيذ السكريبت في نافذة:", error);
          // فتح في نافذة جديدة كخطة بديلة
          window.open(`javascript:${scriptContent}`, '_blank');
          toast({
            title: "تم فتح نافذة جديدة",
            description: "سيتم تنفيذ الإدخال التلقائي في نافذة جديدة. قد تحتاج إلى السماح بالنوافذ المنبثقة.",
            variant: "default"
          });
        }
      } else {
        // فتح نافذة جديدة مع السكريبت
        const newWindow = window.open('about:blank', '_blank');
        
        if (newWindow) {
          // كتابة صفحة HTML بسيطة للتأكد من تحميل المستند بشكل صحيح
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>جاري تنفيذ الإدخال التلقائي...</title>
              <meta charset="utf-8">
            </head>
            <body>
              <h3 style="font-family: Arial; text-align: center; margin-top: 50px;">جاري تنفيذ الإدخال التلقائي...</h3>
              <p style="font-family: Arial; text-align: center;">سيتم تحويلك تلقائياً خلال لحظات إلى الموقع المستهدف.</p>
              <script>
                // استدعاء السكريبت المطلوب بعد تحميل الصفحة
                setTimeout(function() {
                  try {
                    ${scriptContent}
                  } catch (err) {
                    console.error("Error executing script:", err);
                    document.body.innerHTML += '<p style="color: red; text-align: center;">حدث خطأ: ' + err.message + '</p>';
                  }
                }, 500);
              </script>
            </body>
            </html>
          `);
          
          // إغلاق الكتابة للتأكد من تحميل المستند
          newWindow.document.close();
          
          toast({
            title: "تم فتح نافذة الإدخال التلقائي",
            description: "يرجى فتح موقع الويب المطلوب في نافذة أخرى ثم استخدام زر التنفيذ مرة أخرى",
            variant: "default"
          });
        } else {
          // استخدام الطريقة التقليدية كخطة بديلة
          window.open(`javascript:${scriptContent}`, '_blank');
          toast({
            title: "تم فتح نافذة جديدة",
            description: "يرجى السماح بالنوافذ المنبثقة إذا لم تظهر النافذة",
            variant: "default"
          });
        }
      }
      
      // حفظ حالة الإدخال التلقائي في التخزين المحلي
      localStorage.setItem('lastAutoFillDate', new Date().toISOString());
      
      // إغلاق مربع الحوار بعد التنفيذ
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("خطأ في تنفيذ السكريبت:", error);
      toast({
        title: "خطأ في تنفيذ الإدخال التلقائي",
        description: "حدث خطأ: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
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
          
          {/* اقتراحات إضافية للمستخدم */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border border-muted">
            <p className="font-semibold mb-1">نصائح للاستخدام الأمثل:</p>
            <ul className="mr-4 list-disc space-y-1 text-xs">
              <li>إذا لم تتم عملية الإدخال التلقائي، تأكد من فتح الموقع المطلوب قبل النقر على "تنفيذ مباشرة"</li>
              <li>تأكد من تسجيل الدخول إلى الموقع المستهدف قبل محاولة ملء البيانات</li>
              <li>إذا كنت تستخدم نظام Google، قد تحتاج للسماح بالنوافذ المنبثقة</li>
              <li>بعض المواقع قد تمنع الإدخال التلقائي، حاول نسخ الحقول يدوياً في هذه الحالة</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkletGenerator;
