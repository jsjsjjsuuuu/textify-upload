
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface BatchArrowProps {
  isFirst?: boolean;
  isLast?: boolean;
}

const BatchArrow: React.FC<BatchArrowProps> = ({ isFirst = false, isLast = false }) => {
  return (
    <div 
      className="absolute right-10 flex flex-col items-center justify-center" 
      style={{ 
        height: isFirst || isLast ? '50%' : '100%', 
        // زيادة عرض الخط لجعله أكثر وضوحًا
        width: '4px' 
      }}
    >
      {!isLast && (
        <div className="relative h-full w-full">
          {/* خط عمودي أكثر وضوحًا وجاذبية */}
          <div 
            className="absolute top-0 bottom-0 right-1/2 border-r-4 border-dashed border-yellow-500 opacity-70 transition-all duration-300 hover:opacity-100"
            style={{ 
              borderStyle: 'dashed',
              borderColor: 'rgba(234, 179, 8, 0.6)',  // لون أكثر شفافية
              boxShadow: '0 0 5px rgba(234, 179, 8, 0.3)' // إضافة تأثير الظل
            }}
          ></div>
          
          {isFirst && (
            <motion.div 
              className="absolute -bottom-2 right-0 transform translate-x-1/2"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 0.3, 
                type: 'spring',  // استخدام animation spring للحركة
                stiffness: 200,
                damping: 10
              }}
            >
              <ChevronDown 
                className="h-6 w-6 text-yellow-500 animate-bounce" 
                strokeWidth={2.5}  // زيادة سمك الخط
                style={{ 
                  filter: 'drop-shadow(0 0 2px rgba(234, 179, 8, 0.5))' // إضافة تأثير الظل
                }}
              />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchArrow;
