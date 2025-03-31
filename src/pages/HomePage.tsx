
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  return (
    <div className="container mx-auto py-20 px-4 min-h-screen flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }} 
        className="text-right text-[#0A2342] dark:text-white"
      >
        <h1 className="apple-header md:text-5xl lg:text-6xl font-medium tracking-tight mb-6 text-4xl text-[#0A2342] dark:text-white">
          استخراج البيانات من الصور <span className="text-blue-700 dark:text-blue-400">بذكاء اصطناعي</span> متطور
        </h1>
        <p className="text-lg text-[#34495E] dark:text-white/80 mb-8 md:text-base">
          خدمة متكاملة لاستخراج البيانات من الصور وأتمتتها بسرعة وكفاءة، مع خطط اشتراك مرنة تناسب الجميع
        </p>
        <div className="flex justify-start gap-4">
          <Button 
            className="apple-button bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700" 
            size="lg" 
            asChild
          >
            <Link to="/register" className="py-[15px] px-[59px]">
              ابدأ الآن مجاناً
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default HomePage;
