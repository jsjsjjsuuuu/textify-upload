
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface BatchArrowProps {
  isFirst?: boolean;
  isLast?: boolean;
}

const BatchArrow: React.FC<BatchArrowProps> = ({ isFirst = false, isLast = false }) => {
  // إذا كانت هذه هي أول صورة في المجموعة، نعرض فقط الخط المتجه لأسفل
  // إذا كانت هذه هي آخر صورة في المجموعة، نعرض فقط الخط المتجه لأعلى
  // وإلا نعرض خطًا متصلاً كاملاً
  
  return (
    <div className="absolute right-10 flex flex-col items-center justify-center" style={{ height: isFirst || isLast ? '50%' : '100%' }}>
      {!isLast && (
        <div className="relative h-full">
          <div className="absolute top-0 bottom-0 right-1/2 border-r-2 border-dashed border-yellow-500"></div>
          {isFirst && (
            <motion.div 
              className="absolute -bottom-2 right-0 transform translate-x-1/2"
              initial={{ y: -5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ChevronDown className="h-5 w-5 text-yellow-500" />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchArrow;
