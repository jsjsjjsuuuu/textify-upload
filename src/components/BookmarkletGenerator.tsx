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
      
      // إنشاء محتوى HTML للصفحة الوسيطة التي ستقوم بتنفيذ السكريبت
      const scriptToRun = `
      try {
        // حفظ البيانات في متغير
        const autofillData = ${JSON.stringify(rawDataObject)};
        console.log("بيانات الإدخال التلقائي:", autofillData);
        
        // تحديد وظيفة ملء الحقول
        function fillField(selectors, value) {
          if (!value) return false;
          
          // التأكد من أن selectors هو مصفوفة
          const allSelectors = (typeof selectors === 'string') ? [selectors] : selectors;
          
          // البحث عن حقول الإدخال
          for (const selector of allSelectors) {
            // محاولة باستخدام querySelector
            let elements = [];
            try {
              elements = [...document.querySelectorAll(selector)];
            } catch (e) {
              continue;
            }
            
            // البحث بطرق أخرى إذا لم نجد
            if (elements.length === 0) {
              elements = [...document.querySelectorAll('input, textarea, select, [contenteditable="true"]')]
                .filter(el => {
                  // البحث في النصوص المرتبطة بالعنصر
                  const labels = document.querySelectorAll('label[for="' + el.id + '"]');
                  let labelText = '';
                  if (labels.length) {
                    labelText = labels[0].textContent || '';
                  }
                  
                  return (el.placeholder && (el.placeholder.includes(selector) || selector.includes(el.placeholder))) ||
                         (el.name && (el.name.includes(selector) || selector.includes(el.name))) ||
                         (el.id && (el.id.includes(selector) || selector.includes(el.id))) ||
                         (el.className && (el.className.includes(selector) || selector.includes(el.className))) ||
                         (labelText && (labelText.includes(selector) || selector.includes(labelText)));
                });
            }
            
            // ملء أول عنصر وجدناه
            if (elements.length > 0) {
              const element = elements[0];
              
              // التعامل مع العناصر المختلفة
              if (element.tagName === 'SELECT') {
                // القوائم المنسدلة
                const options = [...element.options];
                const option = options.find(opt => {
                  const optText = opt.text.toLowerCase();
                  const optValue = opt.value.toLowerCase();
                  const valueToCheck = value.toString().toLowerCase();
                  
                  return optText.includes(valueToCheck) || 
                         valueToCheck.includes(optText) || 
                         optValue.includes(valueToCheck) || 
                         valueToCheck.includes(optValue);
                });
                
                if (option) {
                  element.value = option.value;
                  element.dispatchEvent(new Event('change', { bubbles: true }));
                  return true;
                }
              } else if (element.hasAttribute('contenteditable')) {
                // عناصر قابلة للتحرير
                element.innerHTML = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
              } else {
                // حقول نصية
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                // محاولة تحديث حالة React
                try {
                  const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                  if (nativeValueSetter) {
                    nativeValueSetter.call(element, value);
                  }
                } catch (e) {}
                return true;
              }
            }
          }
          
          return false;
        }
        
        // محددات للحقول المختلفة
        const fieldSelectors = {
          companyName: [
            'input[name*="company"], input[placeholder*="شركة"], input[id*="company"], input[name*="COMPANY"]',
            'شركة', 'الشركة', 'company', 'COMPANY', 'الجهة', 'جهة', 'المؤسسة'
          ],
          code: [
            'input[name*="code"], input[placeholder*="كود"], input[id*="code"], input[name*="CODE"]',
            'كود', 'رمز', 'code', 'CODE', 'رقم الطلب', 'رقم الفاتورة', 'رقم البضاعة', 'رقم'
          ],
          senderName: [
            'input[name*="name"], input[placeholder*="اسم"], input[id*="name"], input[name*="NAME"], input[name*="sender"]',
            'الاسم', 'اسم', 'اسم المرسل', 'sender', 'SENDER', 'customer', 'المرسل', 'العميل', 'الزبون', 'name'
          ],
          phoneNumber: [
            'input[name*="phone"], input[placeholder*="هاتف"], input[id*="phone"], input[type="tel"], input[name*="PHONE"], input[name*="TEL"]',
            'هاتف', 'رقم الهاتف', 'phone', 'تليفون', 'موبايل', 'جوال', 'الهاتف', 'الجوال', 'mobile', 'MOBILE', 'PHONE'
          ],
          province: [
            'select[name*="province"], select[id*="province"], select[name*="city"], select[id*="city"], select[name*="region"], select[id*="region"]',
            'input[name*="province"], input[id*="province"], input[name*="city"], input[id*="city"]',
            'المحافظة', 'محافظة', 'city', 'province', 'region', 'المدينة', 'مدينة', 'المنطقة', 'منطقة'
          ],
          price: [
            'input[name*="price"], input[placeholder*="سعر"], input[id*="price"], input[name*="amount"], input[name*="PRICE"]',
            'السعر', 'المبلغ', 'price', 'amount', 'cost', 'المبلغ', 'القيمة', 'سعر', 'الكلفة', 'التكلفة'
          ]
        };
        
        // تأخير قصير للتأكد من تحميل الصفحة
        setTimeout(() => {
          // ملء الحقول
          let filledFields = 0;
          
          if (autofillData.multiple && Array.isArray(autofillData.items) && autofillData.items.length > 0) {
            // الوضع المتعدد - نستخدم العنصر الأول فقط الآن
            const item = autofillData.items[0];
            
            for (const [field, selectors] of Object.entries(fieldSelectors)) {
              if (item[field]) {
                if (fillField(selectors, item[field])) {
                  filledFields++;
                }
              }
            }
          } else {
            // وضع العنصر الواحد
            for (const [field, selectors] of Object.entries(fieldSelectors)) {
              if (autofillData[field]) {
                if (fillField(selectors, autofillData[field])) {
                  filledFields++;
                }
              }
            }
          }
          
          // عرض إشعار
          const notification = document.createElement('div');
          notification.style.position = 'fixed';
          notification.style.top = '10px';
          notification.style.right = '10px';
          notification.style.padding = '10px 15px';
          notification.style.backgroundColor = filledFields > 0 ? '#4CAF50' : '#FF9800';
          notification.style.color = 'white';
          notification.style.fontSize = '14px';
          notification.style.fontWeight = 'bold';
          notification.style.borderRadius = '5px';
          notification.style.zIndex = '999999';
          notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
          notification.style.direction = 'rtl';
          
          if (filledFields > 0) {
            notification.textContent = \`✓ تم ملء \${filledFields} من الحقول بنجاح!\`;
          } else {
            notification.textContent = '⚠️ لم يتم العثور على حقول مناسبة للملء. جرب موقعاً آخر.';
          }
          
          document.body.appendChild(notification);
          
          // إخفاء الإشعار بعد 5 ثوانٍ
          setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.7s';
            setTimeout(() => notification.remove(), 700);
          }, 5000);
        }, 500);
      } catch (error) {
        console.error("خطأ في تنفيذ السكريبت:", error);
        alert("حدث خطأ أثناء تنفيذ السكريبت: " + error.message);
      }
      `;
      
      // فتح نافذة جديدة بالموقع المستهدف
      const newWindow = window.open(targetUrl, '_blank');
      
      if (!newWindow) {
        toast({
          title: "تم منع النوافذ المنبثقة",
          description: "يرجى السماح بالنوافذ المنبثقة في متصفحك",
          variant: "destructive"
        });
        setIsExecuting(false);
        return;
      }
      
      // تنفيذ السكريبت في النافذة المستهدفة بعد فترة قصيرة للسماح بتحميل الصفحة
      setTimeout(() => {
        try {
          // تأكد من أن النافذة لا تزال مفتوحة
          if (newWindow && !newWindow.closed) {
            try {
              // محاولة تنفيذ السكريبت على الصفحة المستهدفة
              newWindow.eval(scriptToRun);
              
              toast({
                title: "تم تنفيذ الإدخال التلقائي",
                description: "تمت محاولة ملء البيانات في الصفحة المستهدفة",
                variant: "default"
              });
            } catch (evalError) {
              console.error("خطأ في تنفيذ السكريبت:", evalError);
              
              // في حالة الفشل، جرب طريقة بديلة: إنشاء علامة سكريبت
              try {
                const scriptTag = newWindow.document.createElement('script');
                scriptTag.textContent = scriptToRun;
                newWindow.document.head.appendChild(scriptTag);
                
                toast({
                  title: "تم تنفيذ الإدخال التلقائي",
                  description: "تمت محاولة ملء البيانات باستخدام طريقة بديلة",
                  variant: "default"
                });
              } catch (scriptError) {
                console.error("فشل تنفيذ السكريبت بالطرق البديلة:", scriptError);
                toast({
                  title: "فشل تنفيذ الإدخال التلقائي",
                  description: "يبدو أن الموقع يمنع الوصول إلى السكريبت. حاول استخدام زر المفضلة بدلاً من ذلك.",
                  variant: "destructive"
                });
              }
            }
          } else {
            toast({
              title: "تم إغلاق النافذة",
              description: "يبدو أن النافذة المستهدفة تم إغلاقها",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("خطأ عام في تنفيذ السكريبت:", error);
          toast({
            title: "فشل تنفيذ الإدخال التلقائي",
            description: "حدث خطأ غير متوقع. حاول استخدام زر المفضلة بدلاً من ذلك.",
            variant: "destructive"
          });
        }
        
        setIsExecuting(false);
      }, 1000);
      
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
