
import React, { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface BatchArrowProps {
  isFirst?: boolean;
  isLast?: boolean;
}

const BatchArrow: React.FC<BatchArrowProps> = ({ isFirst = false, isLast = false }) => {
  // إضافة تأثير جانبي للتحقق من الحالة وطباعة معلومات التصحيح
  useEffect(() => {
    console.log('BatchArrow rendering:', { isFirst, isLast });
  }, [isFirst, isLast]);

  // تحديد ارتفاع مناسب حسب الموضع
  const getHeightStyle = () => {
    if (isFirst && !isLast) return 'bottom-0 h-[50%]'; // يبدأ من المنتصف ويمتد للأسفل
    if (isLast && !isFirst) return 'top-0 h-[50%]'; // يبدأ من الأعلى ويمتد للمنتصف
    if (!isFirst && !isLast) return 'h-full'; // يمتد بالكامل
    return 'h-0'; // لا يظهر إذا كان العنصر الوحيد
  };

  return (
    <div 
      className="absolute right-10 flex flex-col items-center justify-center pointer-events-none"
      style={{ zIndex: 10 }} // تأكد من أن العنصر يظهر فوق العناصر الأخرى
    >
      {!isLast && (
        <div 
          className={`relative w-4 ${getHeightStyle()}`}
          style={{ 
            minHeight: '50px', // ضمان وجود ارتفاع أدنى للخط
          }}
        >
          {/* خط عمودي أكثر وضوحًا */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 border-l-4 border-yellow-500 h-full"
            style={{ 
              borderStyle: 'dashed',
              opacity: 0.9, // زيادة الشفافية لتكون أكثر وضوحًا
              boxShadow: '0 0 8px rgba(234, 179, 8, 0.5)', // تأثير توهج للخط
              width: '4px', // عرض الخط
            }}
          />
          
          {isFirst && (
            <motion.div 
              className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 0.3, 
                type: 'spring',
                stiffness: 200,
                damping: 10
              }}
            >
              <ChevronDown 
                className="h-8 w-8 text-yellow-500 animate-bounce" 
                strokeWidth={3}
                style={{ 
                  filter: 'drop-shadow(0 0 3px rgba(234, 179, 8, 0.7))'
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
