
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageData } from "@/types/ImageData";
import { DeliveryCompany } from "@/types/DeliveryCompany";
import { getDeliveryCompanyById } from "@/utils/deliveryCompanies/companyData";
import { useCompanyAutofill } from "@/hooks/useCompanyAutofill";
import { useToast } from "@/hooks/use-toast";
import { PlayIcon, ExternalLinkIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface BatchCompanyAutofillProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
  companyId: string;
}

const BatchCompanyAutofill = ({ isOpen, onClose, images, companyId }: BatchCompanyAutofillProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const company = getDeliveryCompanyById(companyId);
  
  const { executeAutofill } = useCompanyAutofill();
  
  // تصفية الصور المكتملة فقط
  const completedImages = images.filter(img => img.status === "completed");
  
  // الانتقال للصورة التالية
  const goToNextImage = () => {
    if (currentIndex < completedImages.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  // الانتقال للصورة السابقة
  const goToPrevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  // الحصول على الصورة الحالية
  const currentImage = completedImages[currentIndex];
  
  // وظيفة فتح موقع الشركة في نافذة جديدة
  const handleOpenWebsite = () => {
    if (!company) return;
    
    const url = company.formUrl || company.websiteUrl;
    if (url) {
      window.open(url, `_blank_${company.id}`);
    } else {
      toast({
        title: "خطأ",
        description: "لم يتم تحديد رابط للموقع الإلكتروني لهذه الشركة",
        variant: "destructive"
      });
    }
  };
  
  // وظيفة تنفيذ الإدخال التلقائي
  const handleExecuteAutofill = async () => {
    if (!company || !currentImage) return;
    
    setIsExecuting(true);
    try {
      await executeAutofill(companyId, currentImage);
      // الانتقال تلقائيًا للصورة التالية بعد التنفيذ الناجح
      if (currentIndex < completedImages.length - 1) {
        setTimeout(() => {
          goToNextImage();
        }, 1000);
      }
    } finally {
      setIsExecuting(false);
    }
  };
  
  if (!company) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {company.logoUrl && (
              <img 
                src={company.logoUrl} 
                alt={company.name} 
                className="h-6 w-6 object-contain"
              />
            )}
            إدخال متعدد - {company.name}
          </DialogTitle>
          <DialogDescription>
            إدخال {completedImages.length} صورة في نموذج شركة {company.name}
          </DialogDescription>
        </DialogHeader>
        
        {completedImages.length > 0 ? (
          <div className="space-y-4 my-4">
            {/* عداد الصور */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={goToPrevImage}
                disabled={currentIndex === 0}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium">
                صورة {currentIndex + 1} من {completedImages.length}
              </span>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={goToNextImage}
                disabled={currentIndex === completedImages.length - 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
            </div>
            
            {/* عرض البيانات الحالية */}
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <h3 className="text-sm font-medium">البيانات التي سيتم إدخالها:</h3>
              <ul className="space-y-1 text-sm">
                {company.fields.map(field => {
                  const value = currentImage[field.name as keyof ImageData] as string;
                  return (
                    <li key={field.name} className="flex justify-between">
                      <span className="text-muted-foreground">{field.description || field.name}:</span>
                      <span className="font-medium">{value || "—"}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            {/* أزرار التحكم */}
            <div className="flex justify-between items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleOpenWebsite}
              >
                <ExternalLinkIcon className="ml-2 h-4 w-4" />
                فتح الموقع
              </Button>
              
              <Button 
                onClick={handleExecuteAutofill}
                disabled={isExecuting}
                className="w-full bg-brand-green hover:bg-brand-green/90"
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
            <div className="text-sm text-muted-foreground">
              <p>يمكنك التنقل بين الصور باستخدام الأزرار أعلاه ومن ثم تنفيذ الإدخال التلقائي لكل صورة.</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد صور مكتملة متاحة للإدخال التلقائي
          </div>
        )}
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isExecuting}
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchCompanyAutofill;
