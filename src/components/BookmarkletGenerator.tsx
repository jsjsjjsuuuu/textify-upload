
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
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);
  const [executionAttempts, setExecutionAttempts] = useState(0);

  // التحقق مما إذا كان آخر URL مستخدم هو موقع Google
  const lastUsedUrl = typeof window !== 'undefined' ? localStorage.getItem('lastAutoFillUrl') || '' : '';
  const isGoogleUrl = lastUsedUrl.includes('google.com') || lastUsedUrl.includes('docs.google.com');
  
  // متابعة حالة التنفيذ
  useEffect(() => {
    if (isExecuting && executionAttempts > 0) {
      const timer = setTimeout(() => {
        if (executionAttempts < 5) {
          // محاولة النقر على زر الحفظ مرة أخرى بعد ثانيتين
          setExecutionStatus(`محاولة النقر على زر الحفظ (${executionAttempts + 1}/5)...`);
          setExecutionAttempts(prev => prev + 1);
          
          // استدعاء وظيفة النقر على زر الحفظ
          const targetUrl = lastUsedUrl || 'about:blank';
          if (targetUrl !== 'about:blank') {
            const options = {
              clickSubmitButton: true,
              waitBeforeClick: 2000,
              retryAttempt: executionAttempts
            };
            executeScript(targetUrl, options);
          }
        } else {
          // إنهاء المحاولات بعد 5 مرات
          setIsExecuting(false);
          setExecutionStatus("انتهت المحاولات. يرجى التحقق من نجاح الإضافة أو النقر يدوياً على زر الحفظ.");
          
          toast({
            title: "اكتملت محاولات النقر التلقائي",
            description: "تمت محاولة النقر على زر الحفظ 5 مرات. يرجى التحقق من نجاح الإضافة.",
            variant: "default"
          });
        }
      }, 3000); // انتظر 3 ثوانٍ بين المحاولات
      
      return () => clearTimeout(timer);
    }
  }, [isExecuting, executionAttempts, executeScript, lastUsedUrl, toast]);
  
  // نسخ الرابط إلى الحافظة
  const handleCopyToClipboard = () => {
    copyToClipboard(bookmarkletUrl);
  };

  // وظيفة تنفيذ سكريبت الإدخال التلقائي محسنة
  const handleExecuteScript = async () => {
    setIsExecuting(true);
    setExecutionStatus("جاري تنفيذ الإدخال التلقائي...");
    setExecutionAttempts(1);
    
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
        setExecutionStatus(null);
        return;
      }
      
      // إضافة خيارات محسنة لزيادة فرص النجاح
      const options = {
        clickSubmitButton: true,
        waitBeforeClick: 1500,      // انتظار 1.5 ثانية قبل النقر
        forceSubmit: true,          // الإجبار على محاولة النقر
        useRobustClickMethod: true, // استخدام طريقة أكثر قوة للنقر
        retryAttempt: 1             // محاولة أولى
      };
      
      // استدعاء وظيفة تنفيذ السكريبت مع الخيارات المحسنة
      executeScript(targetUrl, options);
      
      toast({
        title: "تم بدء الإدخال التلقائي",
        description: "سيتم محاولة النقر على زر الحفظ عدة مرات لضمان تسجيل البيانات",
        variant: "default"
      });
      
      // سيتم إغلاق مربع الحوار عبر useEffect الذي يراقب عدد المحاولات
    } catch (error) {
      console.error("خطأ في تنفيذ السكريبت:", error);
      toast({
        title: "خطأ في تنفيذ الإدخال التلقائي",
        description: "حدث خطأ: " + (error as Error).message,
        variant: "destructive"
      });
      setIsExecuting(false);
      setExecutionStatus(null);
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
          
          {/* حالة التنفيذ */}
          {executionStatus && (
            <div className={`text-sm p-2 rounded-md ${
              executionStatus.includes("خطأ") ? 
                "bg-red-50 text-red-700 border border-red-200" : 
                "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              <p>{executionStatus}</p>
              {executionAttempts > 0 && executionAttempts <= 5 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full" 
                    style={{ width: `${(executionAttempts / 5) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          
          {/* تعليمات الاستخدام */}
          <BookmarkletInstructions 
            isMultiMode={isMultiMode} 
            isGoogleUrl={isGoogleUrl}
          />
          
          {/* اقتراحات إضافية للمستخدم مع إشعار حول النقر التلقائي على زر الحفظ */}
          <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-700/30">
            <p className="font-semibold mb-1 text-yellow-700 dark:text-yellow-400">ملاحظات مهمة عن حفظ البيانات:</p>
            <ul className="mr-4 list-disc space-y-1 text-xs">
              <li><strong>نظام محسن جديد:</strong> سيحاول النقر على زر الحفظ تلقائياً <strong>5 مرات متتالية</strong> بفواصل زمنية لضمان نجاح الحفظ</li>
              <li>إذا لم تنجح المحاولات التلقائية، يرجى النقر يدوياً على زر الحفظ/الإضافة في الموقع</li>
              <li>تأكد من ظهور رسالة تأكيد من الموقع بعد الحفظ للتأكد من نجاح العملية</li>
              <li>قد تحتاج لتحديث صفحة الموقع وتسجيل الدخول مجدداً إذا كانت هناك مشكلة في الحفظ</li>
              <li>في حالة استمرار المشكلة، جرب استخدام زر المفضلة بدلاً من التنفيذ المباشر</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkletGenerator;
