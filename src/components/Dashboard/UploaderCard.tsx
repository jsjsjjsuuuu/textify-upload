
/**
 * مكون UploaderCard
 * بطاقة تحميل الملفات الرئيسية مع تأثيرات حركية
 * 
 * @component
 * @param {Object} props - خصائص المكون
 * @param {boolean} props.isProcessing - حالة معالجة الملفات
 * @param {Function} props.onFilesSelected - دالة معالجة اختيار الملفات
 */

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import FileUploader from '@/components/FileUploader';
import { motion } from 'framer-motion';

interface UploaderCardProps {
  isProcessing: boolean;
  onFilesSelected: (files: FileList | File[]) => void;
}

const UploaderCard: React.FC<UploaderCardProps> = ({ 
  isProcessing, 
  onFilesSelected 
}) => {
  // تأثيرات الظهور الحركية
  const appearanceAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  };

  return (
    <motion.div {...appearanceAnimation}>
      <Card className="overflow-hidden backdrop-blur-lg bg-white/5 dark:bg-gray-900/5 border-white/10 dark:border-gray-800/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-0">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            تحميل الصور
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isProcessing && (
            <motion.div 
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <FileUploader 
                onFilesSelected={onFilesSelected} 
                isProcessing={isProcessing} 
              />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UploaderCard;
