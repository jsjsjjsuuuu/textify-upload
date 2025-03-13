
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon, ExternalLinkIcon, PlayIcon } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { DeliveryCompany } from "@/types/DeliveryCompany";
import { getDeliveryCompanyById } from "@/utils/deliveryCompanies/companyData";
import { useCompanyAutofill } from "@/hooks/useCompanyAutofill";
import { useClipboard } from "@/hooks/useClipboard";
import { useToast } from "@/hooks/use-toast";

interface CompanyAutofillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: ImageData;
  companyId: string;
}

const CompanyAutofillDialog = ({ isOpen, onClose, imageData, companyId }: CompanyAutofillDialogProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const company = getDeliveryCompanyById(companyId);
  
  const { executeAutofill, generateBookmarkletUrl } = useCompanyAutofill();
  const { copied, copyToClipboard } = useClipboard();
  
  const bookmarkletUrl = company ? generateBookmarkletUrl(companyId, imageData) : "";
  
  // وظيفة نسخ رابط الإدخال التلقائي
  const handleCopyBookmarklet = () => {
    if (bookmarkletUrl) {
      copyToClipboard(bookmarkletUrl);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الإدخال التلقائي"
      });
    }
  };
  
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
    if (!company) return;
    
    setIsExecuting(true);
    try {
      await executeAutofill(companyId, imageData);
    } finally {
      setIsExecuting(false);
      onClose();
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
            الإدخال التلقائي - {company.name}
          </DialogTitle>
          <DialogDescription>
            إدخال البيانات المستخرجة في نموذج شركة {company.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          {/* عرض البيانات التي سيتم إدخالها */}
          <div className="bg-muted/50 p-3 rounded-md space-y-2">
            <h3 className="text-sm font-medium">البيانات التي سيتم إدخالها:</h3>
            <ul className="space-y-1 text-sm">
              {company.fields.map(field => {
                const value = imageData[field.name as keyof ImageData] as string;
                return (
                  <li key={field.name} className="flex justify-between">
                    <span className="text-muted-foreground">{field.description || field.name}:</span>
                    <span className="font-medium">{value || "—"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          
          {/* خيارات الإدخال التلقائي */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">طرق الإدخال التلقائي:</h3>
            
            <div className="flex justify-between items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleCopyBookmarklet}
              >
                {copied ? <CheckIcon className="ml-2 h-4 w-4" /> : <CopyIcon className="ml-2 h-4 w-4" />}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleOpenWebsite}
              >
                <ExternalLinkIcon className="ml-2 h-4 w-4" />
                فتح الموقع
              </Button>
            </div>
          </div>
          
          {/* تعليمات الاستخدام */}
          <div className="text-sm space-y-2">
            <p className="font-medium text-muted-foreground">يمكنك استخدام الإدخال التلقائي بإحدى الطرق التالية:</p>
            <ol className="list-decimal mr-5 space-y-1 text-muted-foreground">
              <li>انقر على <strong>تنفيذ مباشرة</strong> لفتح موقع الشركة وتنفيذ الإدخال التلقائي</li>
              <li>انقر على <strong>فتح الموقع</strong> ثم الصق رابط الإدخال في شريط العنوان</li>
              <li>أو انسخ الرابط وأضفه كإشارة مرجعية في متصفحك</li>
            </ol>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isExecuting}
          >
            إلغاء
          </Button>
          
          <Button 
            onClick={handleExecuteAutofill}
            disabled={isExecuting}
            className="bg-brand-green hover:bg-brand-green/90"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyAutofillDialog;
