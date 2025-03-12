
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
}

const BookmarkletGenerator = ({ isOpen, onClose, imageData }: BookmarkletGeneratorProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [bookmarkletCode, setBookmarkletCode] = useState("");
  const [bookmarkletUrl, setBookmarkletUrl] = useState("");

  useEffect(() => {
    if (imageData && isOpen) {
      generateBookmarklet(imageData);
    }
  }, [imageData, isOpen]);

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
          <DialogTitle className="text-center text-xl mb-2">أداة ملء البيانات تلقائياً</DialogTitle>
          <DialogDescription className="text-center">
            اسحب الزر أدناه إلى شريط المفضلة في متصفحك، ثم انقر عليه في أي موقع تريد ملء البيانات فيه.
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
              ملء البيانات تلقائياً
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
              <li>سيتم ملء الحقول المتطابقة تلقائياً</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkletGenerator;
