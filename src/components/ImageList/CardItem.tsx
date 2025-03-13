
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import DraggableImage from "./DraggableImage";
import ImageDataForm from "./ImageDataForm";
import ActionButtons from "./ActionButtons";
import BookmarkletGenerator from "@/components/BookmarkletGenerator";
import { autoFillWebsiteForm } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Send, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CardItemProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const CardItem = ({ 
  image, 
  isSubmitting, 
  onImageClick, 
  onTextChange, 
  onDelete, 
  onSubmit, 
  formatDate 
}: CardItemProps) => {
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleExport = (imageId: string) => {
    if (imageId === image.id) {
      setIsBookmarkletOpen(true);
    }
  };

  const isGoogleUrl = (url: string) => {
    return url.includes('google.com') || url.includes('docs.google.com');
  };

  const handleAutoFill = async () => {
    // حفظ الإعداد الافتراضي في localStorage
    const lastUsedUrl = localStorage.getItem('lastAutoFillUrl');
    const url = prompt("أدخل عنوان URL للموقع الذي تريد ملء البيانات فيه:", lastUsedUrl || "https://");
    if (!url) return;
    
    // التحقق مما إذا كان عنوان URL هو Google Sheets أو مستندات Google
    if (isGoogleUrl(url)) {
      toast({
        title: "تنبيه - مواقع Google",
        description: "مواقع Google مثل Sheets لا تدعم الإدخال التلقائي داخل التطبيق. استخدم خيار 'تصدير' لإنشاء bookmarklet ثم استخدمه في المتصفح.",
        variant: "warning",
        duration: 7000
      });
      
      // عرض مربع حوار تصدير الـ bookmarklet مباشرة
      setIsBookmarkletOpen(true);
      return;
    }
    
    // حفظ URL في localStorage للاستخدام القادم
    localStorage.setItem('lastAutoFillUrl', url);
    localStorage.setItem('lastPreviewUrl', url);
    
    setIsAutoFilling(true);
    
    try {
      // إعداد البيانات للإرسال
      const formData = {
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || "",
        companyName: image.companyName || "",
        code: image.code || "",
        extractedText: image.extractedText || ""
      };
      
      // فحص ما إذا كان هناك بيانات كافية للإدخال التلقائي
      const dataFields = Object.values(formData).filter(Boolean);
      if (dataFields.length <= 1) { // إذا كان هناك حقل واحد فقط أو لا يوجد حقول
        toast({
          title: "لا توجد بيانات كافية",
          description: "لا يوجد ما يكفي من البيانات المستخرجة للإدخال التلقائي. الرجاء استخراج المزيد من البيانات أولاً.",
          variant: "destructive"
        });
        setIsAutoFilling(false);
        return;
      }
      
      // إنشاء نص البرمجة النصية مباشرة
      const scriptText = `
        (function() {
          const data = ${JSON.stringify(formData)};
          
          // عرض إشعار حول النجاح أو الفشل
          const showNotification = (message, isSuccess) => {
            const notification = document.createElement('div');
            notification.style.cssText = \`
              position: fixed;
              top: 20px;
              right: 20px;
              background: \${isSuccess ? '#4CAF50' : '#F44336'};
              color: white;
              padding: 15px 20px;
              border-radius: 5px;
              z-index: 10000;
              direction: rtl;
              font-family: Arial;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            \`;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
          };
          
          // إنشاء عنصر لعرض حالة التقدم
          const progressBar = document.createElement('div');
          progressBar.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; height: 4px; background: #0f0; z-index: 9999; transition: width 0.3s;';
          document.body.appendChild(progressBar);
          
          // وظيفة لتحديث شريط التقدم
          const updateProgress = (percent) => {
            progressBar.style.width = percent + '%';
            if (percent === 100) {
              setTimeout(() => progressBar.remove(), 1000);
            }
          };
          
          // وظيفة للتحقق من نوع الصفحة
          const checkPageType = () => {
            // التحقق من مواقع Google
            if (window.location.hostname.includes('google.com')) {
              showNotification('مواقع Google لا تدعم الإدخال التلقائي بشكل كامل، حاول استخدام أزرار الإدخال اليدوية', false);
              return false;
            }
            return true;
          };
          
          if (!checkPageType()) {
            updateProgress(100);
            return;
          }
          
          // وظيفة للبحث عن الحقول وملئها
          const fillFields = () => {
            const fields = {
              'senderName': ['sender', 'name', 'الاسم', 'المرسل', 'إسم'],
              'phoneNumber': ['phone', 'tel', 'mobile', 'هاتف', 'موبايل', 'جوال', 'رقم'],
              'province': ['province', 'city', 'region', 'محافظة', 'المحافظة', 'المدينة', 'منطقة'],
              'price': ['price', 'cost', 'amount', 'سعر', 'المبلغ', 'التكلفة', 'قيمة'],
              'companyName': ['company', 'vendor', 'شركة', 'المورد', 'البائع'],
              'code': ['code', 'id', 'number', 'رقم', 'كود', 'معرف']
            };
            
            let filledCount = 0;
            const totalFields = Object.keys(fields).length;
            
            // البحث عن وسوم الإدخال ذات الصلة
            const findRelevantElements = (selector) => {
              return [
                ...document.querySelectorAll(\`input[id*="\${selector}"i]\`),
                ...document.querySelectorAll(\`input[name*="\${selector}"i]\`),
                ...document.querySelectorAll(\`input[placeholder*="\${selector}"i]\`),
                ...document.querySelectorAll(\`textarea[id*="\${selector}"i]\`),
                ...document.querySelectorAll(\`textarea[name*="\${selector}"i]\`),
                ...document.querySelectorAll(\`textarea[placeholder*="\${selector}"i]\`),
                ...document.querySelectorAll(\`select[id*="\${selector}"i]\`),
                ...document.querySelectorAll(\`select[name*="\${selector}"i]\`),
                ...document.querySelectorAll(\`div[role="textbox"][aria-label*="\${selector}"i]\`)
              ];
            };
            
            for (const [dataKey, selectors] of Object.entries(fields)) {
              if (!data[dataKey]) continue;
              
              let fieldFilled = false;
              for (const selector of selectors) {
                const elements = findRelevantElements(selector);
                
                for (const element of elements) {
                  if (element.disabled || element.readOnly) continue;
                  
                  try {
                    if (element instanceof HTMLSelectElement) {
                      const options = Array.from(element.options);
                      const bestMatch = options.find(opt => 
                        opt.text.toLowerCase().includes(data[dataKey].toLowerCase())
                      );
                      if (bestMatch) {
                        element.value = bestMatch.value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        fieldFilled = true;
                        break;
                      }
                    } else if (element.getAttribute('role') === 'textbox') {
                      // للتعامل مع حقول النص في Google Docs/Sheets
                      element.textContent = data[dataKey];
                      element.dispatchEvent(new Event('input', { bubbles: true }));
                      fieldFilled = true;
                      break;
                    } else {
                      element.value = data[dataKey];
                      element.dispatchEvent(new Event('input', { bubbles: true }));
                      element.dispatchEvent(new Event('change', { bubbles: true }));
                      fieldFilled = true;
                      break;
                    }
                  } catch (e) {
                    console.error('Error filling field:', e);
                  }
                }
                
                if (fieldFilled) {
                  filledCount++;
                  updateProgress((filledCount / totalFields) * 100);
                  break;
                }
              }
            }
            
            // البحث عن الحقول بناءً على التسميات (labels)
            if (filledCount < totalFields) {
              const labels = document.querySelectorAll('label');
              
              for (const [dataKey, selectors] of Object.entries(fields)) {
                if (!data[dataKey] || selectors.some(s => findRelevantElements(s).length > 0)) continue;
                
                for (const label of labels) {
                  if (selectors.some(s => label.textContent.toLowerCase().includes(s.toLowerCase()))) {
                    const forAttr = label.getAttribute('for');
                    if (forAttr) {
                      const input = document.getElementById(forAttr);
                      if (input && !input.disabled && !input.readOnly) {
                        try {
                          input.value = data[dataKey];
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                          filledCount++;
                          updateProgress((filledCount / totalFields) * 100);
                        } catch (e) {
                          console.error('Error filling field by label:', e);
                        }
                      }
                    }
                  }
                }
              }
            }
            
            // إذا تم ملء كل الحقول المطلوبة
            if (filledCount > 0) {
              navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                .then(() => console.log('تم نسخ البيانات إلى الحافظة'))
                .catch(() => console.warn('فشل نسخ البيانات إلى الحافظة'));
              showNotification(\`تم ملء \${filledCount} حقول بنجاح\`, true);
            } else {
              showNotification('لم يتم العثور على حقول متطابقة في هذه الصفحة', false);
            }
            
            return filledCount;
          };
          
          // تنفيذ عملية الملء
          const filledCount = fillFields();
          updateProgress(100);
          
          return filledCount;
        })();
      `;
      
      // تنفيذ السكريبت
      const bookmarkletUrl = `javascript:${encodeURIComponent(scriptText)}`;
      
      // استخدام iframe للتنفيذ إذا لم يكن موقع Google
      if (!isGoogleUrl(url)) {
        const previewUrl = url;
        localStorage.setItem('lastPreviewUrl', previewUrl);
        
        // تحويل المستخدم لصفحة المعاينة
        navigate('/preview?url=' + encodeURIComponent(previewUrl) + '&autoFill=true&script=' + encodeURIComponent(bookmarkletUrl));
        
        toast({
          title: "تم التحويل إلى صفحة المعاينة",
          description: "سيتم فتح الموقع وتنفيذ الإدخال التلقائي هناك. قد تحتاج لتسجيل الدخول أولاً.",
          variant: "default"
        });
      } else {
        // استخدام bookmarklet مباشرة للمواقع المقيدة
        setIsBookmarkletOpen(true);
      }
    } catch (error) {
      console.error("خطأ في الإدخال التلقائي:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة الإدخال التلقائي: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const navigateToPreview = () => {
    const lastUsedUrl = localStorage.getItem('lastAutoFillUrl');
    if (lastUsedUrl) {
      localStorage.setItem('lastPreviewUrl', lastUsedUrl);
      navigate('/preview');
    } else {
      toast({
        title: "لم يتم تحديد موقع",
        description: "الرجاء استخدام خاصية الإدخال التلقائي أولاً لتحديد الموقع",
        variant: "default"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto"
    >
      <Card className="overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow border-border/60 dark:border-gray-700/60 rounded-xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* صورة العنصر (55% العرض) */}
            <div className="md:col-span-7 border-b md:border-b-0 md:border-l border-border/30 dark:border-gray-700/30">
              <DraggableImage 
                image={image} 
                onImageClick={onImageClick} 
                formatDate={formatDate} 
              />
            </div>
            
            {/* بيانات العنصر (45% العرض) */}
            <div className="md:col-span-5">
              <ImageDataForm 
                image={image} 
                onTextChange={onTextChange} 
              />
            </div>
          </div>
          
          <div className="px-4 pb-4 border-t border-border/30 dark:border-gray-700/30 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ActionButtons 
                imageId={image.id}
                isSubmitting={isSubmitting}
                isCompleted={image.status === "completed"}
                isSubmitted={!!image.submitted}
                isPhoneNumberValid={isPhoneNumberValid}
                onDelete={onDelete}
                onSubmit={onSubmit}
                onExport={handleExport}
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30"
                  onClick={handleAutoFill}
                  disabled={isAutoFilling || !image.extractedText}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isAutoFilling ? "جاري الإدخال..." : "إدخال تلقائي"}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                  onClick={navigateToPreview}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  معاينة الموقع
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <BookmarkletGenerator 
        isOpen={isBookmarkletOpen} 
        onClose={() => setIsBookmarkletOpen(false)} 
        imageData={isBookmarkletOpen ? image : null}
      />
    </motion.div>
  );
};

export default CardItem;
