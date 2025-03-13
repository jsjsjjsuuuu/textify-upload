
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ImageData } from "@/types/ImageData";
import { Check, X, AlertTriangle } from "lucide-react";

interface BatchSubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageData[];
  onSubmit: (id: string) => void;
}

const BatchSubmitDialog = ({ isOpen, onClose, images, onSubmit }: BatchSubmitDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{[key: string]: boolean}>({});
  
  // فلترة الصور التي يمكن إرسالها (المكتملة وغير المرسلة)
  const eligibleImages = images.filter(img => 
    img.status === "completed" && 
    !img.submitted && 
    (img.phoneNumber ? img.phoneNumber.replace(/[^\d]/g, '').length === 11 : true)
  );
  
  const handleBatchSubmit = async () => {
    if (eligibleImages.length === 0) return;
    
    setIsSubmitting(true);
    setResults({});
    setProgress(0);
    
    for (let i = 0; i < eligibleImages.length; i++) {
      const image = eligibleImages[i];
      
      try {
        // استدعاء دالة الإرسال لكل صورة
        onSubmit(image.id);
        
        // تأخير صغير بين الطلبات
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // تسجيل النتيجة (لإظهارها في الواجهة)
        setResults(prev => ({...prev, [image.id]: true}));
      } catch (error) {
        console.error("خطأ في إرسال الصورة:", image.id, error);
        setResults(prev => ({...prev, [image.id]: false}));
      }
      
      // تحديث نسبة التقدم
      setProgress(Math.round(((i + 1) / eligibleImages.length) * 100));
    }
    
    setIsSubmitting(false);
  };
  
  const successCount = Object.values(results).filter(r => r === true).length;
  const failureCount = Object.values(results).filter(r => r === false).length;
  const totalProcessed = successCount + failureCount;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">إرسال دفعة من البيانات</DialogTitle>
          <DialogDescription>
            سيتم إرسال {eligibleImages.length} صورة إلى النظام دفعة واحدة.
            تأكد من مراجعة البيانات قبل الإرسال.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-6">
          {eligibleImages.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-500 inline-block ml-2" />
              <span className="text-amber-800 dark:text-amber-400">
                لا توجد صور جاهزة للإرسال. تأكد من معالجة الصور وإكمال البيانات المطلوبة أولاً.
              </span>
            </div>
          ) : (
            <>
              {isSubmitting && (
                <div className="mb-4">
                  <Progress value={progress} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    جاري إرسال البيانات... ({totalProcessed}/{eligibleImages.length})
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
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {Object.keys(results).length > 0 ? "إغلاق" : "إلغاء"}
          </Button>
          <Button 
            onClick={handleBatchSubmit} 
            disabled={isSubmitting || eligibleImages.length === 0}
            className="bg-brand-green hover:bg-brand-green/90"
          >
            {isSubmitting ? "جاري الإرسال..." : "إرسال الكل دفعة واحدة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchSubmitDialog;
