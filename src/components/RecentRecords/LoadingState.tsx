
import React from 'react';
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const LoadingState = () => {
  // تأثير التلاشي للعناصر التي تظهر أثناء التحميل
  const pulseAnimation = {
    opacity: [0.4, 0.7, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    }
  };

  return (
    <motion.div 
      className="loading-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center">
        <motion.div animate={pulseAnimation}>
          <Loader2 className="loading-spinner" />
        </motion.div>
        <motion.p 
          className="mt-4 text-indigo-300 text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          جاري تحميل البيانات...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default LoadingState;
