/**
 * مكون ProcessingIndicator
 * يعرض حالة تقدم معالجة الملفات مع تأثيرات تفاعلية
 * 
 * @component
 * @param {Object} props - خصائص المكون
 * @param {boolean} props.isProcessing - حالة المعالجة الحالية
 * @param {number} props.processingProgress - نسبة تقدم المعالجة
 * @param {number} props.activeUploads - عدد الملفات قيد المعالجة
 * @param {number} props.queueLength - إجمالي عدد الملفات في قائمة الانتظار
 */

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
  // حالة إخفاء المؤشر
  const [shouldHide, setShouldHide] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // إعادة تعيين الحالة عند بدء المعالجة
  useEffect(() => {
    if (isProcessing) {
      setShouldHide(false);
      setIsComplete(false);
    }
  }, [isProcessing]);
  
  // تحديث حالة الاكتمال وإخفاء المؤشر
  useEffect(() => {
    if (processingProgress >= 100 && activeUploads === 0 && isProcessing) {
      setIsComplete(true);
      const hideTimer = setTimeout(() => {
        setShouldHide(true);
      }, 2000);
      return () => clearTimeout(hideTimer);
    }
  }, [isProcessing, processingProgress, activeUploads]);
  
  // عدم عرض المؤشر إذا لم تكن هناك معالجة جارية
  if (!isProcessing || shouldHide) return null;

  // تأثيرات الحركة
  const containerAnimation = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={containerAnimation.initial}
        animate={containerAnimation.animate}
        exit={containerAnimation.exit}
        className="mb-6 backdrop-blur-lg bg-blue-50/10 dark:bg-blue-900/10 border border-blue-100/20 dark:border-blue-900/20 rounded-xl p-4 shadow-lg"
      >
        <div className="flex flex-wrap justify-between items-center gap-4">
          <motion.div 
            className="flex items-center"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
          >
            <motion.div 
              className="flex items-center justify-center bg-gradient-to-br from-blue-100/30 to-blue-50/10 dark:from-blue-800/30 dark:to-blue-900/10 rounded-full w-10 h-10 ml-3 shadow-inner"
              animate={{
                scale: isComplete ? [1, 1.2, 1] : 1,
                transition: { duration: 0.3 }
              }}
            >
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </motion.div>
              )}
            </motion.div>
            <div>
              <motion.h3 
                className="font-semibold text-gray-900 dark:text-gray-100 flex items-center"
                animate={{ opacity: [0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                {isComplete ? "اكتملت المعالجة" : "جاري المعالجة"}
                {!isComplete && (
                  <Badge 
                    variant="outline" 
                    className="mr-2 bg-blue-100/20 text-blue-700 dark:text-blue-300 border-blue-200/30"
                  >
                    {activeUploads} / {queueLength}
                  </Badge>
                )}
              </motion.h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isComplete ? "تم استخراج البيانات بنجاح" : "يتم معالجة الصور، يرجى الانتظار..."}
              </p>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <motion.span 
              className="text-sm font-medium text-blue-700 dark:text-blue-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {Math.round(processingProgress)}%
            </motion.span>
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
        
        <motion.div 
          className="mt-3"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Progress 
            value={processingProgress} 
            className="h-2 bg-blue-100/20 dark:bg-blue-800/30"
          >
            <motion.div 
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete ? "bg-green-500 dark:bg-green-400" : "bg-blue-500 dark:bg-blue-400"
              }`}
              style={{ width: `${processingProgress}%` }}
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 0.5 }}
            />
          </Progress>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProcessingIndicator;
