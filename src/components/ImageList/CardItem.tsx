
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
import { Send } from "lucide-react";

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
  
  const handleExport = (imageId: string) => {
    if (imageId === image.id) {
      setIsBookmarkletOpen(true);
    }
  };

  const handleAutoFill = async () => {
    // حفظ الإعداد الافتراضي في localStorage
    const lastUsedUrl = localStorage.getItem('lastAutoFillUrl');
    const url = prompt("أدخل عنوان URL للموقع الذي تريد ملء البيانات فيه:", lastUsedUrl || "https://");
    if (!url) return;
    
    // حفظ URL في localStorage للاستخدام القادم
    localStorage.setItem('lastAutoFillUrl', url);
    
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
      
      // إنشاء نص البرمجة النصية مباشرة
      const scriptText = `
        (function() {
          const data = ${JSON.stringify(formData)};
          
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
          
          // وظيفة للبحث عن الحقول وملئها
          const fillFields = () => {
            const fields = {
              'senderName': ['sender', 'name', 'الاسم', 'المرسل'],
              'phoneNumber': ['phone', 'tel', 'mobile', 'هاتف', 'موبايل', 'جوال'],
              'province': ['province', 'city', 'region', 'محافظة', 'المحافظة', 'المدينة'],
              'price': ['price', 'cost', 'amount', 'سعر', 'المبلغ', 'التكلفة'],
              'companyName': ['company', 'vendor', 'شركة', 'المورد'],
              'code': ['code', 'id', 'number', 'رقم', 'كود']
            };
            
            let filledCount = 0;
            const totalFields = Object.keys(fields).length;
            
            for (const [dataKey, selectors] of Object.entries(fields)) {
              if (!data[dataKey]) continue;
              
              for (const selector of selectors) {
                const elements = [
                  ...document.querySelectorAll(\`input[id*="\${selector}"i]\`),
                  ...document.querySelectorAll(\`input[name*="\${selector}"i]\`),
                  ...document.querySelectorAll(\`input[placeholder*="\${selector}"i]\`),
                  ...document.querySelectorAll(\`textarea[id*="\${selector}"i]\`),
                  ...document.querySelectorAll(\`textarea[name*="\${selector}"i]\`),
                  ...document.querySelectorAll(\`select[id*="\${selector}"i]\`)
                ];
                
                for (const element of elements) {
                  if (element.disabled || element.readOnly) continue;
                  
                  if (element instanceof HTMLSelectElement) {
                    const options = Array.from(element.options);
                    const bestMatch = options.find(opt => 
                      opt.text.toLowerCase().includes(data[dataKey].toLowerCase())
                    );
                    if (bestMatch) {
                      element.value = bestMatch.value;
                      element.dispatchEvent(new Event('change', { bubbles: true }));
                      filledCount++;
                      updateProgress((filledCount / totalFields) * 100);
                      break;
                    }
                  } else {
                    element.value = data[dataKey];
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    filledCount++;
                    updateProgress((filledCount / totalFields) * 100);
                    break;
                  }
                }
              }
            }
            
            // إذا تم ملء كل الحقول المطلوبة
            if (filledCount > 0) {
              navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                .then(() => console.log('تم نسخ البيانات إلى الحافظة'))
                .catch(() => console.warn('فشل نسخ البيانات إلى الحافظة'));
            }
            
            return filledCount;
          };
          
          // تنفيذ عملية الملء والتحقق من النجاح
          const filledCount = fillFields();
          if (filledCount > 0) {
            const notification = document.createElement('div');
            notification.style.cssText = \`
              position: fixed;
              top: 20px;
              right: 20px;
              background: #4CAF50;
              color: white;
              padding: 15px 20px;
              border-radius: 5px;
              z-index: 10000;
              direction: rtl;
              font-family: Arial;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            \`;
            notification.textContent = \`تم ملء \${filledCount} حقول بنجاح\`;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
          }
        })();
      `;
      
      // إنشاء وصلة bookmarklet وتنفيذها
      const bookmarkletUrl = `javascript:${encodeURIComponent(scriptText)}`;
      const scriptElement = document.createElement('script');
      scriptElement.textContent = decodeURIComponent(bookmarkletUrl.replace('javascript:', ''));
      document.body.appendChild(scriptElement);
      document.body.removeChild(scriptElement);
      
      toast({
        title: "تم تنفيذ الإدخال التلقائي",
        description: "تم محاولة ملء البيانات في النموذج",
        variant: "default"
      });
    } catch (error) {
      console.error("خطأ في الإدخال التلقائي:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة الإدخال التلقائي",
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
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
              
              <Button
                size="sm"
                variant="outline"
                className="flex items
                -center gap-1 text-xs bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30"
                onClick={handleAutoFill}
                disabled={isAutoFilling || !image.extractedText}
              >
                <Send className="h-3.5 w-3.5" />
                {isAutoFilling ? "جاري الإدخال..." : "إدخال تلقائي"}
              </Button>
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
