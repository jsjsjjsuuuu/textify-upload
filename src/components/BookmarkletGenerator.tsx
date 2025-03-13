
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon, PlayIcon, AlertCircleIcon } from "lucide-react";
import { useBookmarkletGenerator } from "@/hooks/useBookmarkletGenerator";
import { useClipboard } from "@/hooks/useClipboard";
import { ImageData } from "@/types/ImageData";
import BookmarkletButton from "./BookmarkletButton";
import BookmarkletInstructions from "./BookmarkletInstructions";
import { useState, useEffect, useRef } from "react";
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
      // طريقة جديدة محسنة: استخدام بيانات البوكماركلت مباشرة
      console.log("بيانات الإدخال التلقائي:", rawDataObject);
      debugRef.current = JSON.stringify(rawDataObject);
      
      // حفظ البيانات في localStorage لمشاركتها مع النافذة الجديدة
      localStorage.setItem('autofillData', JSON.stringify(rawDataObject));

      // استخدام طريقة جديدة: صفحة وسيطة للإدخال التلقائي
      const intermediateHtml = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>جاري تنفيذ الإدخال التلقائي...</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial; text-align: center; margin-top: 50px; }
            .loading { margin: 20px auto; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <h2>جاري تنفيذ الإدخال التلقائي...</h2>
          <div class="loading"></div>
          <p>يرجى الانتظار، سيتم تعبئة البيانات تلقائياً خلال ثوانٍ.</p>
          <pre id="debug" style="text-align: left; direction: ltr; font-size: 12px; border: 1px solid #ddd; padding: 10px; margin: 20px; max-height: 200px; overflow: auto; display: none"></pre>
          
          <script>
            // الحصول على البيانات من localStorage
            try {
              const autofillData = JSON.parse(localStorage.getItem('autofillData') || '{}');
              document.getElementById('debug').textContent = JSON.stringify(autofillData, null, 2);
              
              // تنفيذ سكريبت البوكماركلت مباشرة بعد فترة قصيرة
              setTimeout(() => {
                try {
                  // تحضير سكريبت الإدخال التلقائي
                  const targetUrl = '${lastUsedUrl || 'about:blank'}';
                  
                  // فتح موقع الهدف أولاً ثم تنفيذ الإدخال التلقائي
                  const scriptToRun = \`
                    (function() {
                      // تحميل البيانات من localStorage
                      const autofillData = JSON.parse(localStorage.getItem('autofillData') || '{}');
                      console.log("بيانات الإدخال التلقائي:", autofillData);
                      
                      // وظائف مساعدة للعثور على الحقول وملئها
                      function fillField(selectors, value) {
                        if (!value) return false;
                        
                        // للتوافق مع أكبر عدد من المواقع، نحاول عدة طرق للعثور على الحقول
                        const allSelectors = (typeof selectors === 'string') ? [selectors] : selectors;
                        
                        for (const selector of allSelectors) {
                          // البحث عن جميع العناصر التي تتطابق مع المحددات
                          let elements = [];
                          try {
                            elements = [...document.querySelectorAll(selector)];
                          } catch (e) {
                            console.warn("محدد غير صالح:", selector);
                            continue;
                          }
                          
                          // محاولة أخرى للبحث عن الحقول حسب النوع أو الاسم أو الملصق
                          if (elements.length === 0) {
                            elements = [...document.querySelectorAll('input, textarea, select')]
                              .filter(el => {
                                const labels = document.querySelectorAll('label[for="' + el.id + '"]');
                                if (labels.length && labels[0].textContent && 
                                    (labels[0].textContent.includes(selector) || 
                                     selector.includes(labels[0].textContent))) {
                                  return true;
                                }
                                
                                return el.placeholder && 
                                      (el.placeholder.includes(selector) || selector.includes(el.placeholder)) ||
                                       el.name && 
                                      (el.name.includes(selector) || selector.includes(el.name)) ||
                                       el.id && 
                                      (el.id.includes(selector) || selector.includes(el.id));
                              });
                          }
                          
                          if (elements.length > 0) {
                            // ملء أول عنصر وجدناه
                            const element = elements[0];
                            
                            // الإجراء يعتمد على نوع العنصر
                            if (element.tagName === 'SELECT') {
                              // للقوائم المنسدلة، محاولة العثور على الخيار المناسب
                              const options = [...element.options];
                              const option = options.find(opt => 
                                opt.text.includes(value) || value.includes(opt.text) || 
                                opt.value.includes(value) || value.includes(opt.value)
                              );
                              
                              if (option) {
                                element.value = option.value;
                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                return true;
                              }
                            } else {
                              // للحقول النصية والمناطق النصية
                              element.value = value;
                              element.dispatchEvent(new Event('input', { bubbles: true }));
                              element.dispatchEvent(new Event('change', { bubbles: true }));
                              return true;
                            }
                          }
                        }
                        
                        return false;
                      }
                      
                      // تأخير قصير للتأكد من تحميل الصفحة بالكامل
                      setTimeout(() => {
                        // محاولة ملء البيانات باستخدام عدة استراتيجيات
                        if (autofillData.hasOwnProperty("companyName")) fillField(['input[name*="company"], input[placeholder*="شركة"], input[id*="company"]', 'الشركة', 'شركة', 'company'], autofillData.companyName);
                        if (autofillData.hasOwnProperty("code")) fillField(['input[name*="code"], input[placeholder*="كود"], input[id*="code"]', 'كود', 'رمز', 'code', 'رقم الطلب'], autofillData.code);
                        if (autofillData.hasOwnProperty("senderName")) fillField(['input[name*="name"], input[placeholder*="اسم"], input[id*="name"]', 'الاسم', 'اسم المرسل', 'sender', 'customer'], autofillData.senderName);
                        if (autofillData.hasOwnProperty("phoneNumber")) fillField(['input[name*="phone"], input[placeholder*="هاتف"], input[id*="phone"], input[type="tel"]', 'هاتف', 'رقم الهاتف', 'phone', 'mobile', 'تليفون', 'جوال'], autofillData.phoneNumber);
                        if (autofillData.hasOwnProperty("province")) fillField(['select[name*="province"], select[id*="province"]', 'input[name*="province"], input[id*="province"]', 'المحافظة', 'محافظة', 'city', 'province', 'region'], autofillData.province);
                        if (autofillData.hasOwnProperty("price")) fillField(['input[name*="price"], input[placeholder*="سعر"], input[id*="price"]', 'السعر', 'المبلغ', 'price', 'amount', 'cost'], autofillData.price);
                        
                        // إذا كان هناك حقول متعددة، ملء الكل
                        if (autofillData.multiple && Array.isArray(autofillData.items)) {
                          // تنفيذ منطق الإدخال المتعدد هنا...
                        }
                        
                        // إضافة عنصر تأكيد للمستخدم
                        const notification = document.createElement('div');
                        notification.style.position = 'fixed';
                        notification.style.top = '10px';
                        notification.style.right = '10px';
                        notification.style.padding = '10px';
                        notification.style.backgroundColor = '#4CAF50';
                        notification.style.color = 'white';
                        notification.style.borderRadius = '5px';
                        notification.style.zIndex = '9999';
                        notification.textContent = 'تم محاولة ملء البيانات تلقائياً';
                        document.body.appendChild(notification);
                        
                        // إخفاء الإشعار بعد 3 ثوانٍ
                        setTimeout(() => {
                          notification.style.opacity = '0';
                          notification.style.transition = 'opacity 0.5s';
                          setTimeout(() => notification.remove(), 500);
                        }, 3000);
                      }, 1000);
                    })();
                  \`;
                  
                  // تحويل الموقع المستهدف
                  if (targetUrl && targetUrl !== 'about:blank') {
                    window.location.href = targetUrl;
                    // تنفيذ السكريبت بعد فترة للتأكد من تحميل الصفحة
                    setTimeout(() => {
                      eval(scriptToRun);
                    }, 2000);
                  } else {
                    // إذا لم يكن هناك موقع مستهدف، تنفيذ السكريبت مباشرة
                    eval(scriptToRun);
                  }
                } catch (error) {
                  console.error("خطأ في تنفيذ السكريبت:", error);
                  document.body.innerHTML += '<div style="color: red; margin-top: 20px;">حدث خطأ في تنفيذ الإدخال التلقائي: ' + error.message + '</div>';
                }
              }, 500);
            } catch (error) {
              console.error("خطأ في قراءة البيانات:", error);
              document.body.innerHTML += '<div style="color: red; margin-top: 20px;">خطأ في قراءة البيانات: ' + error.message + '</div>';
            }
          </script>
        </body>
        </html>
      `;
      
      // إنشاء blob لاستخدامه كـ URL للصفحة المؤقتة
      const blob = new Blob([intermediateHtml], { type: 'text/html' });
      const intermediateUrl = URL.createObjectURL(blob);
      
      // فتح نافذة جديدة باستخدام الصفحة المؤقتة
      const newWindow = window.open(intermediateUrl, '_blank');
      
      if (newWindow) {
        toast({
          title: "تم بدء الإدخال التلقائي",
          description: "تم فتح نافذة جديدة وسيتم محاولة تعبئة البيانات",
          variant: "default"
        });
      } else {
        toast({
          title: "خطأ في فتح النافذة",
          description: "يرجى السماح بالنوافذ المنبثقة في متصفحك",
          variant: "destructive"
        });
      }
      
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
              <li>قم بفتح الموقع المطلوب قبل النقر على "تنفيذ مباشرة"</li>
              <li>تأكد من تسجيل الدخول إلى الموقع المستهدف قبل محاولة ملء البيانات</li>
              <li>إذا لم تعمل الميزة، حاول استخدام زر المفضلة بدلاً من "تنفيذ مباشرة"</li>
              <li>بعض المواقع قد تمنع الإدخال التلقائي لأسباب أمنية</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkletGenerator;
