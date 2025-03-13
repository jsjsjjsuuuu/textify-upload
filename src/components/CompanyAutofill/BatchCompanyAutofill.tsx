
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, AlertTriangle } from "lucide-react";
import { DeliveryCompany } from "@/types/DeliveryCompany";
import { ImageData } from "@/types/ImageData";
import { getDeliveryCompanyById } from "@/utils/deliveryCompanies/companyData";
import { useCompanyAutofill } from "@/hooks/useCompanyAutofill";

interface BatchCompanyAutofillProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
  companyId: string;
}

const BatchCompanyAutofill = ({ isOpen, onClose, images, companyId }: BatchCompanyAutofillProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{[key: string]: boolean}>({});
  const { executeAutofill } = useCompanyAutofill();
  
  const company = getDeliveryCompanyById(companyId);
  
  // فلترة الصور المكتملة
  const eligibleImages = images.filter(img => img.status === "completed");
  
  const handleBatchAutofill = async () => {
    if (eligibleImages.length === 0 || !company) return;
    
    setIsProcessing(true);
    setResults({});
    setProgress(0);
    
    const url = company.formUrl || company.websiteUrl;
    if (!url) {
      setIsProcessing(false);
      return;
    }
    
    // فتح نافذة موقع الشركة
    const targetWindow = window.open(url, `batch-autofill-${company.id}-${Date.now()}`);
    if (!targetWindow) {
      setIsProcessing(false);
      return;
    }
    
    // الانتظار حتى يتم تحميل الصفحة
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (targetWindow.closed) {
          clearInterval(checkInterval);
          resolve(null);
        } else if (targetWindow.document.readyState === 'complete') {
          clearInterval(checkInterval);
          setTimeout(resolve, 1500);
        }
      }, 500);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 30000);
    });
    
    // بدء عملية الإدخال التلقائي لكل صورة
    for (let i = 0; i < eligibleImages.length; i++) {
      const image = eligibleImages[i];
      
      try {
        // طلب من المستخدم تأكيد الاستمرار
        if (i > 0) {
          if (!confirm(`هل تريد الاستمرار بإدخال البيانات للوصل التالي؟ (${i+1}/${eligibleImages.length})`)) {
            break;
          }
        }
        
        // تنفيذ الإدخال التلقائي
        const result = await executeAutofill(companyId, image, url);
        setResults(prev => ({...prev, [image.id]: result.success}));
        
        // تأخير صغير بين الطلبات
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("خطأ في الإدخال التلقائي للصورة:", image.id, error);
        setResults(prev => ({...prev, [image.id]: false}));
      }
      
      // تحديث نسبة التقدم
      setProgress(Math.round(((i + 1) / eligibleImages.length) * 100));
    }
    
    setIsProcessing(false);
  };
  
  const successCount = Object.values(results).filter(r => r === true).length;
  const failureCount = Object.values(results).filter(r => r === false).length;
  const totalProcessed = successCount + failureCount;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {company?.logoUrl && (
              <img 
                src={company.logoUrl} 
                alt={company?.name} 
                className="h-6 w-6 object-contain"
              />
            )}
            إدخال دفعة من البيانات - {company?.name}
          </DialogTitle>
          <DialogDescription>
            سيتم إدخال بيانات {eligibleImages.length} صورة في موقع {company?.name}.
            ستحتاج إلى تأكيد كل عملية إدخال.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-6">
          {eligibleImages.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-500 inline-block ml-2" />
              <span className="text-amber-800 dark:text-amber-400">
                لا توجد صور جاهزة للإدخال. تأكد من معالجة الصور أولاً.
              </span>
            </div>
          ) : (
            <>
              {isProcessing && (
                <div className="mb-4">
                  <Progress value={progress} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    جاري إدخال البيانات... ({totalProcessed}/{eligibleImages.length})
                  </p>
                </div>
              )}
              
              {Object.keys(results).length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto p-2 border rounded-md">
                  <div className="flex justify-between text-sm font-medium pb-2 border-b">
                    <span>ملخص النتائج:</span>
                    <span className="text-green-600 dark:text-green-400">
                      نجاح: {successCount}/{eligibleImages.length}
                    </span>
                  </div>
                  
                  {eligibleImages.map(image => {
                    const isProcessed = image.id in results;
                    const isSuccessful = results[image.id] === true;
                    
                    return (
                      <div 
                        key={image.id}
                        className={`flex items-center justify-between p-2 text-sm rounded-md ${
                          !isProcessed ? 'bg-gray-50 dark:bg-gray-800/40' :
                          isSuccessful ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <span className="truncate flex-1">
                          {image.senderName || image.companyName || `صورة ${image.number}`}
                        </span>
                        
                        {isProcessed && (
                          isSuccessful ? (
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {Object.keys(results).length > 0 ? "إغلاق" : "إلغاء"}
          </Button>
          <Button 
            onClick={handleBatchAutofill} 
            disabled={isProcessing || eligibleImages.length === 0 || !company}
            className="bg-brand-green hover:bg-brand-green/90"
          >
            {isProcessing ? "جاري الإدخال..." : "بدء الإدخال الآلي"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchCompanyAutofill;
