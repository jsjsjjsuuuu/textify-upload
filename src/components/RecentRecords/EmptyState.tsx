
import React from 'react';
import { PackageX, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const EmptyState = () => {
  return (
    <motion.div 
      className="empty-state-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        >
          <PackageX className="empty-state-icon" />
        </motion.div>
        <motion.div
          className="absolute top-0 left-0 w-full h-full blur-2xl bg-indigo-500/10 rounded-full -z-10"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </div>
      
      <h3 className="empty-state-text mb-2">
        لا توجد مهام متاحة
      </h3>
      <p className="text-slate-400 mb-6">
        لم نتمكن من العثور على أي مهام متطابقة مع معايير البحث الحالية
      </p>
      
      <Button className="glass-button">
        <Search className="mr-2 h-4 w-4" />
        بحث في جميع المهام
      </Button>
    </motion.div>
  );
};

export default EmptyState;
