import React, { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { Loader, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface ProcessingIndicatorProps {
  isProcessing: boolean;
  processingProgress: number;
  activeUploads: number;
  queueLength: number;
}

const ProcessingIndicator = ({
  isProcessing,
  processingProgress,
  activeUploads,
  queueLength
}: ProcessingIndicatorProps) => {
  // إضافة متغير حالة داخلي لتتبع عندما يجب إخفاء المؤشر
  const [shouldHide, setShouldHide] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // إعادة ضبط الحالة عندما تتغير حالة المعالجة
  useEffect(() => {
    if (isProcessing) {
      setShouldHide(false);
      setIsComplete(false);
    }
  }, [isProcessing]);
  
  // إضافة تأخير للإخفاء بعد اكتمال المعالجة
  useEffect(() => {
    if (processingProgress >= 100 && activeUploads === 0 && isProcessing) {
      // تعيين حالة الاكتمال
      setIsComplete(true);
      
      // انتظر لحظة قبل الإخفاء للتأكد من أن المستخدم رأى التقدم 100%
      const hideTimer = setTimeout(() => {
        setShouldHide(true);
      }, 2000); // تأخير أطول (2 ثوان) لضمان رؤية المستخدم للحالة النهائية
      
      return () => clearTimeout(hideTimer);
    }
  }, [isProcessing, processingProgress, activeUploads]);

  // عرض السجلات التشخيصية لمعرفة متى يجب إخفاء المؤشر
  useEffect(() => {
    console.log(`حالة مؤشر المعالجة: isProcessing=${isProcessing}, progress=${processingProgress}%, activeUploads=${activeUploads}, shouldHide=${shouldHide}, isComplete=${isComplete}`);
  }, [isProcessing, processingProgress, activeUploads, shouldHide, isComplete]);
  
  // تحسين شرط العرض 
  // لا يظهر المؤشر إذا تم اكتمال المعالجة أو إذا كان يجب إخفاؤه
  if (!isProcessing || shouldHide) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl p-4 shadow-sm"
        dir="rtl"
      >
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-800 rounded-full w-10 h-10 ml-3">
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Loader className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                {isComplete ? "اكتملت المعالجة" : "جاري المعالجة"}
                {!isComplete && (
                  <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-700 border-blue-200">
                    {activeUploads} / {queueLength}
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isComplete ? "تم استخراج البيانات بنجاح" : "يتم معالجة الصور، يرجى الانتظار..."}
              </p>
            </div>
          </div>
          
          <div className="mt-2 sm:mt-0 flex items-center gap-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {Math.round(processingProgress)}%
            </span>
            {!isComplete && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-1" />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  جاري العمل...
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3">
          <Progress value={processingProgress} className="h-2 bg-blue-200 dark:bg-blue-800/50">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete ? "bg-green-600 dark:bg-green-500" : "bg-blue-600 dark:bg-blue-500"
              }`} 
              style={{ width: `${processingProgress}%` }}
            />
          </Progress>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProcessingIndicator;
