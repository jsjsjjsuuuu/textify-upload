
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageData } from "@/types/ImageData";

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
        generateMultiBookmarklet(multipleImages);
      } else if (imageData) {
        generateBookmarklet(imageData);
      }
    }
  }, [imageData, multipleImages, isOpen, isMultiMode]);

  const generateBookmarklet = (data: ImageData) => {
    // إنشاء الأوبجكت الذي سيتم تصديره
    const exportData = {
      code: data.code || "",
      senderName: data.senderName || "",
      phoneNumber: data.phoneNumber || "",
      province: data.province || "",
      price: data.price || "",
      companyName: data.companyName || ""
    };
    
    // إنشاء كود جافاسكريبت للـ bookmarklet
    const bookmarkletScript = `
      (function() {
        try {
          // البيانات المستخرجة من الصورة
          const exportData = ${JSON.stringify(exportData)};
          console.log("تم استيراد البيانات:", exportData);
          
          // البحث عن الحقول في الصفحة الحالية
          const findAndFillField = (labels, value) => {
            if (!value) return;
            
            for (const label of labels) {
              // البحث عن حقل الإدخال بعدة طرق
              const inputField = 
                document.querySelector(\`input[name*="\${label}"]\`) || 
                document.querySelector(\`input[id*="\${label}"]\`) ||
                document.querySelector(\`input[placeholder*="\${label}"]\`) ||
                document.querySelector(\`textarea[name*="\${label}"]\`) ||
                document.querySelector(\`textarea[id*="\${label}"]\`) ||
                document.querySelector(\`textarea[placeholder*="\${label}"]\`);
                
              if (inputField) {
                // ملء الحقل بالقيمة
                inputField.value = value;
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(\`تم ملء حقل \${label} بالقيمة \${value}\`);
                return true;
              }
            }
            
            // إذا لم يتم العثور على أي حقل، حاول البحث عن التسميات
            const allLabels = document.querySelectorAll('label');
            for (const labelElement of allLabels) {
              if (labels.some(l => labelElement.textContent.toLowerCase().includes(l.toLowerCase()))) {
                const labelFor = labelElement.getAttribute('for');
                if (labelFor) {
                  const input = document.getElementById(labelFor);
                  if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(\`تم ملء حقل \${labelElement.textContent} بالقيمة \${value}\`);
                    return true;
                  }
                }
              }
            }
            
            return false;
          };
          
          // محاولة ملء الحقول مع عدة محاولات للعثور على الأسماء المناسبة
          findAndFillField(['code', 'الكود', 'رمز', 'رقم الطلب', 'order-id'], exportData.code);
          findAndFillField(['name', 'الاسم', 'اسم', 'اسم المرسل', 'sender', 'customer'], exportData.senderName);
          findAndFillField(['phone', 'هاتف', 'رقم الهاتف', 'جوال', 'موبايل', 'mobile'], exportData.phoneNumber);
          findAndFillField(['province', 'محافظة', 'المحافظة', 'city', 'مدينة', 'المدينة', 'region'], exportData.province);
          findAndFillField(['price', 'سعر', 'السعر', 'المبلغ', 'التكلفة', 'amount', 'cost'], exportData.price);
          findAndFillField(['company', 'شركة', 'اسم الشركة', 'الشركة', 'vendor'], exportData.companyName);
          
          alert('تم ملء البيانات المستخرجة في الصفحة الحالية');
        } catch (error) {
          console.error('حدث خطأ أثناء ملء البيانات:', error);
          alert('حدث خطأ أثناء ملء البيانات: ' + error.message);
        }
      })();
    `;
    
    // تنظيف الكود وتحويله ليناسب الـ bookmarklet
    const cleanCode = bookmarkletScript
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\n\r]/g, '');
    
    // إنشاء رابط الـ bookmarklet
    const bookmarklet = `javascript:${encodeURIComponent(cleanCode)}`;
    
    setBookmarkletCode(cleanCode);
    setBookmarkletUrl(bookmarklet);
  };

  const generateMultiBookmarklet = (images: ImageData[]) => {
    // تجميع بيانات الصور
    const allExportData = images.map(img => ({
      code: img.code || "",
      senderName: img.senderName || "",
      phoneNumber: img.phoneNumber || "",
      province: img.province || "",
      price: img.price || "",
      companyName: img.companyName || "",
      number: img.number || 0
    }));
    
    // إنشاء كود جافاسكريبت للـ bookmarklet متعدد البيانات
    const bookmarkletScript = `
      (function() {
        try {
          // جميع البيانات المستخرجة من الصور
          const allExportData = ${JSON.stringify(allExportData)};
          console.log("تم استيراد البيانات لـ", allExportData.length, "صورة");
          
          // الفهرس الحالي للصورة التي سيتم ملء بياناتها
          let currentIndex = 0;
          
          // دالة للبحث عن الحقول وملئها
          const findAndFillField = (labels, value) => {
            if (!value) return;
            
            for (const label of labels) {
              // البحث عن حقل الإدخال بعدة طرق
              const inputField = 
                document.querySelector(\`input[name*="\${label}"]\`) || 
                document.querySelector(\`input[id*="\${label}"]\`) ||
                document.querySelector(\`input[placeholder*="\${label}"]\`) ||
                document.querySelector(\`textarea[name*="\${label}"]\`) ||
                document.querySelector(\`textarea[id*="\${label}"]\`) ||
                document.querySelector(\`textarea[placeholder*="\${label}"]\`);
                
              if (inputField) {
                // ملء الحقل بالقيمة
                inputField.value = value;
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(\`تم ملء حقل \${label} بالقيمة \${value}\`);
                return true;
              }
            }
            
            // إذا لم يتم العثور على أي حقل، حاول البحث عن التسميات
            const allLabels = document.querySelectorAll('label');
            for (const labelElement of allLabels) {
              if (labels.some(l => labelElement.textContent.toLowerCase().includes(l.toLowerCase()))) {
                const labelFor = labelElement.getAttribute('for');
                if (labelFor) {
                  const input = document.getElementById(labelFor);
                  if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(\`تم ملء حقل \${labelElement.textContent} بالقيمة \${value}\`);
                    return true;
                  }
                }
              }
            }
            
            return false;
          };
          
          // دالة لملء بيانات صورة واحدة
          const fillData = (data) => {
            findAndFillField(['code', 'الكود', 'رمز', 'رقم الطلب', 'order-id'], data.code);
            findAndFillField(['name', 'الاسم', 'اسم', 'اسم المرسل', 'sender', 'customer'], data.senderName);
            findAndFillField(['phone', 'هاتف', 'رقم الهاتف', 'جوال', 'موبايل', 'mobile'], data.phoneNumber);
            findAndFillField(['province', 'محافظة', 'المحافظة', 'city', 'مدينة', 'المدينة', 'region'], data.province);
            findAndFillField(['price', 'سعر', 'السعر', 'المبلغ', 'التكلفة', 'amount', 'cost'], data.price);
            findAndFillField(['company', 'شركة', 'اسم الشركة', 'الشركة', 'vendor'], data.companyName);
          };
          
          // إنشاء لوحة تحكم متحركة
          const createPanel = () => {
            const panel = document.createElement('div');
            panel.style.position = 'fixed';
            panel.style.top = '10px';
            panel.style.right = '10px';
            panel.style.backgroundColor = '#f8f9fa';
            panel.style.border = '1px solid #dee2e6';
            panel.style.borderRadius = '5px';
            panel.style.padding = '10px';
            panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
            panel.style.zIndex = '9999';
            panel.style.direction = 'rtl';
            panel.style.fontFamily = 'Arial, sans-serif';
            
            const title = document.createElement('h3');
            title.textContent = 'أداة ملء البيانات تلقائياً';
            title.style.margin = '0 0 10px 0';
            title.style.fontSize = '16px';
            title.style.fontWeight = 'bold';
            panel.appendChild(title);
            
            const info = document.createElement('div');
            info.innerHTML = \`الصورة: <span id="current-index">\${currentIndex + 1}</span> من \${allExportData.length}\`;
            info.style.marginBottom = '10px';
            info.style.fontSize = '14px';
            panel.appendChild(info);
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.gap = '5px';
            
            const prevButton = document.createElement('button');
            prevButton.textContent = 'السابق';
            prevButton.style.padding = '5px 10px';
            prevButton.style.backgroundColor = '#6c757d';
            prevButton.style.color = 'white';
            prevButton.style.border = 'none';
            prevButton.style.borderRadius = '3px';
            prevButton.style.cursor = 'pointer';
            prevButton.onclick = () => {
              if (currentIndex > 0) {
                currentIndex--;
                document.getElementById('current-index').textContent = (currentIndex + 1).toString();
                fillData(allExportData[currentIndex]);
              }
            };
            buttonsContainer.appendChild(prevButton);
            
            const nextButton = document.createElement('button');
            nextButton.textContent = 'التالي';
            nextButton.style.padding = '5px 10px';
            nextButton.style.backgroundColor = '#28a745';
            nextButton.style.color = 'white';
            nextButton.style.border = 'none';
            nextButton.style.borderRadius = '3px';
            nextButton.style.cursor = 'pointer';
            nextButton.onclick = () => {
              if (currentIndex < allExportData.length - 1) {
                currentIndex++;
                document.getElementById('current-index').textContent = (currentIndex + 1).toString();
                fillData(allExportData[currentIndex]);
              }
            };
            buttonsContainer.appendChild(nextButton);
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'إغلاق';
            closeButton.style.padding = '5px 10px';
            closeButton.style.backgroundColor = '#dc3545';
            closeButton.style.color = 'white';
            closeButton.style.border = 'none';
            closeButton.style.borderRadius = '3px';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = () => {
              document.body.removeChild(panel);
            };
            buttonsContainer.appendChild(closeButton);
            
            panel.appendChild(buttonsContainer);
            
            // جعل اللوحة قابلة للسحب
            let isDragging = false;
            let offsetX, offsetY;
            
            title.style.cursor = 'move';
            title.addEventListener('mousedown', (e) => {
              isDragging = true;
              offsetX = e.clientX - panel.getBoundingClientRect().left;
              offsetY = e.clientY - panel.getBoundingClientRect().top;
            });
            
            document.addEventListener('mousemove', (e) => {
              if (isDragging) {
                panel.style.right = 'auto';
                panel.style.left = (e.clientX - offsetX) + 'px';
                panel.style.top = (e.clientY - offsetY) + 'px';
              }
            });
            
            document.addEventListener('mouseup', () => {
              isDragging = false;
            });
            
            return panel;
          };
          
          // إضافة لوحة التحكم إلى الصفحة
          const panel = createPanel();
          document.body.appendChild(panel);
          
          // ملء البيانات الأولى تلقائياً
          fillData(allExportData[currentIndex]);
          
        } catch (error) {
          console.error('حدث خطأ أثناء ملء البيانات:', error);
          alert('حدث خطأ أثناء ملء البيانات: ' + error.message);
        }
      })();
    `;
    
    // تنظيف الكود وتحويله ليناسب الـ bookmarklet
    const cleanCode = bookmarkletScript
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\n\r]/g, '');
    
    // إنشاء رابط الـ bookmarklet
    const bookmarklet = `javascript:${encodeURIComponent(cleanCode)}`;
    
    setBookmarkletCode(cleanCode);
    setBookmarkletUrl(bookmarklet);
  };
  
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
