
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon, PlayIcon, AlertCircleIcon } from "lucide-react";
import { useBookmarkletGenerator } from "@/hooks/useBookmarkletGenerator";
import { useClipboard } from "@/hooks/useClipboard";
import { ImageData } from "@/types/ImageData";
import BookmarkletButton from "./BookmarkletButton";
import BookmarkletInstructions from "./BookmarkletInstructions";
import { useState, useRef } from "react";
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
  const { bookmarkletUrl, bookmarkletCode, rawDataObject } = useBookmarkletGenerator(
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
  const debugRef = useRef<string | null>(null);

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
      debugRef.current = JSON.stringify(rawDataObject);
      
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
      
      // تطوير طريقة التنفيذ باستخدام صفحة وسيطة
      const intermediateHtmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>جاري تنفيذ الإدخال التلقائي...</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f9f9f9;
            flex-direction: column;
            text-align: center;
            direction: rtl;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            max-width: 80%;
            width: 500px;
          }
          .progress-container {
            margin: 20px 0;
            background-color: #eee;
            border-radius: 20px;
            height: 10px;
            overflow: hidden;
          }
          .progress-bar {
            height: 100%;
            background-color: #4CAF50;
            width: 0%;
            transition: width 0.5s;
            border-radius: 20px;
          }
          h1 {
            margin-top: 0;
            color: #333;
            font-size: 1.5rem;
          }
          p {
            margin-bottom: 20px;
            color: #666;
            line-height: 1.6;
          }
          .status-text {
            font-weight: bold;
            margin: 10px 0;
          }
          .success { color: #4CAF50; }
          .error { color: #f44336; }
          .warning { color: #ff9800; }
          .button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 10px;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #45a049;
          }
          .button-secondary {
            background-color: #666;
          }
          .button-secondary:hover {
            background-color: #555;
          }
          .loading-spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid #4CAF50;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loading-spinner"></div>
          <h1>جاري تنفيذ الإدخال التلقائي</h1>
          <div class="progress-container">
            <div class="progress-bar" id="progress"></div>
          </div>
          <p class="status-text" id="status">جاري التحضير للإدخال التلقائي...</p>
          <p>سيتم فتح الصفحة المستهدفة وإدخال البيانات تلقائياً خلال لحظات.</p>
          <p>لا تغلق هذه النافذة حتى تكتمل العملية.</p>
          <button class="button" id="continueBtn" style="display: none;">متابعة</button>
          <button class="button button-secondary" id="closeBtn" style="display: none;">إغلاق</button>
        </div>

        <script>
          // تحميل البيانات من localStorage
          const autofillData = ${JSON.stringify(rawDataObject)};
          const targetUrl = "${targetUrl}";
          let targetWindow = null;
          
          // تحديث حالة التقدم
          function updateProgress(percent, statusText, type = '') {
            document.getElementById('progress').style.width = percent + '%';
            const statusElement = document.getElementById('status');
            statusElement.textContent = statusText;
            statusElement.className = 'status-text ' + type;
          }

          // الدالة الرئيسية لتنفيذ الإدخال التلقائي
          async function executeAutofill() {
            try {
              updateProgress(10, 'جاري التحضير للإدخال التلقائي...');
              
              // تحضير السكريبت
              updateProgress(20, 'جاري تحضير سكريبت الإدخال التلقائي...');
              const scriptToRun = \`${bookmarkletCode.replace(/`/g, '\\`')}\`;
              
              // فتح النافذة المستهدفة
              updateProgress(40, 'جاري فتح الموقع المستهدف...');
              targetWindow = window.open(targetUrl, '_blank');
              
              if (!targetWindow) {
                throw new Error('تم منع النوافذ المنبثقة. يرجى السماح بالنوافذ المنبثقة في إعدادات المتصفح.');
              }
              
              updateProgress(60, 'تم فتح الموقع المستهدف، جاري الانتظار للتحميل...');
              
              // انتظر 2 ثانية للسماح بتحميل الصفحة
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // اختبار إذا ما زلنا نستطيع الوصول للنافذة (لم يتم إغلاقها)
              if (targetWindow.closed) {
                throw new Error('تم إغلاق النافذة المستهدفة.');
              }
              
              updateProgress(80, 'جاري تنفيذ سكريبت الإدخال التلقائي...');
              
              // نحاول استخدام آلية نقل رسائل postMessage
              try {
                targetWindow.postMessage({ 
                  type: 'AUTOFILL_DATA', 
                  data: autofillData 
                }, '*');
              } catch (e) {
                console.warn('فشل في استخدام postMessage:', e);
              }
              
              // محاولة تنفيذ السكريبت
              try {
                // إنشاء عنصر script وإضافته للصفحة المستهدفة
                const injectScript = () => {
                  try {
                    const script = targetWindow.document.createElement('script');
                    script.textContent = scriptToRun;
                    targetWindow.document.head.appendChild(script);
                    // إزالة العنصر بعد التنفيذ
                    setTimeout(() => {
                      try {
                        script.remove();
                      } catch (e) {}
                    }, 100);
                    return true;
                  } catch (e) {
                    console.error('فشل حقن السكريبت:', e);
                    return false;
                  }
                };
                
                // نحاول تنفيذ السكريبت إذا كانت الصفحة محملة
                if (targetWindow.document.readyState === 'complete') {
                  injectScript();
                } else {
                  // نضيف مستمع لحدث load إذا لم تكن الصفحة محملة بعد
                  targetWindow.addEventListener('load', () => {
                    setTimeout(injectScript, 1000);
                  });
                }
                
                // نحاول أيضًا باستخدام location.href
                try {
                  const jsPrefix = 'javascript:';
                  // نتأكد من أن الرمز لا يحتوي على بادئة javascript: بالفعل
                  const jsCodeToExecute = scriptToRun.startsWith(jsPrefix) 
                    ? scriptToRun.substring(jsPrefix.length) 
                    : scriptToRun;
                  
                  targetWindow.location.href = jsPrefix + encodeURIComponent(jsCodeToExecute);
                } catch (e) {
                  console.warn('فشل في استخدام location.href:', e);
                }
                
                updateProgress(100, 'تم تنفيذ سكريبت الإدخال التلقائي بنجاح!', 'success');
              } catch (scriptError) {
                console.error('فشل في تنفيذ السكريبت:', scriptError);
                updateProgress(100, 'حدث خطأ أثناء تنفيذ السكريبت. قد تكون قيود أمان الموقع تمنع ذلك.', 'warning');
              }
              
              // إظهار زر الإغلاق
              document.getElementById('closeBtn').style.display = 'inline-block';
              document.getElementById('continueBtn').style.display = 'inline-block';
            } catch (error) {
              console.error('خطأ في تنفيذ الإدخال التلقائي:', error);
              updateProgress(100, 'خطأ: ' + error.message, 'error');
              document.getElementById('closeBtn').style.display = 'inline-block';
            }
          }
          
          // تنفيذ العملية فور تحميل الصفحة
          window.addEventListener('load', executeAutofill);
          
          // إضافة مستمعي الأحداث للأزرار
          document.getElementById('closeBtn').addEventListener('click', () => {
            window.close();
          });
          
          document.getElementById('continueBtn').addEventListener('click', () => {
            // فتح الموقع المستهدف مرة أخرى مع تمرير السكريبت كجزء من الرابط
            const bookmarkletUrl = "javascript:" + encodeURIComponent(\`${bookmarkletCode.replace(/`/g, '\\`')}\`);
            window.open(targetUrl + "#" + bookmarkletUrl, '_blank');
          });
          
          // إضافة مستمع لرسائل من النافذة المستهدفة
          window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'AUTOFILL_RESULT') {
              if (event.data.success) {
                updateProgress(100, 'تم ملء ' + event.data.filledCount + ' حقول بنجاح!', 'success');
              } else {
                updateProgress(100, 'لم يتم العثور على حقول مناسبة للملء', 'warning');
              }
            }
          });
        </script>
      </body>
      </html>
      `;
      
      // إنشاء بلوب من المحتوى
      const blob = new Blob([intermediateHtmlContent], { type: 'text/html' });
      const intermediateUrl = URL.createObjectURL(blob);
      
      // فتح صفحة وسيطة
      window.open(intermediateUrl, '_blank');
      
      // إغلاق مربع الحوار بعد التنفيذ
      setTimeout(() => {
        onClose();
        
        // تحرير الموارد
        URL.revokeObjectURL(intermediateUrl);
        setIsExecuting(false);
      }, 2000);
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
          
          {/* اقتراحات إضافية للمستخدم */}
          <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border border-muted">
            <p className="font-semibold mb-1">نصائح حول مشكلة رفض السكريبت:</p>
            <ul className="mr-4 list-disc space-y-1 text-xs">
              <li>بعض المواقع تمنع تنفيذ السكريبت تلقائياً لأسباب أمنية</li>
              <li>جرب فتح الموقع المطلوب في نافذة جديدة ثم استخدم زر المفضلة</li>
              <li>بعض المتصفحات تتطلب تغيير إعدادات الأمان للسماح بتنفيذ السكريبت</li>
              <li>إذا كنت تستخدم موقع Google، حاول استخدام ميزة زر المفضلة بدلاً من زر التنفيذ المباشر</li>
              <li>يمكنك تجربة نسخ السكريبت ولصقه في شريط العنوان يدوياً بإضافة "javascript:" في البداية</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkletGenerator;
