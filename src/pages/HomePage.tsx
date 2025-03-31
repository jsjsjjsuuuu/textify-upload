
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import { ArrowLeft } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader />
      
      {/* قسم الترحيب بأسلوب أبل - Apple-style Hero Section */}
      <section className="relative px-6 overflow-hidden bg-transparent py-[121px]">
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col items-center text-center my-[30px]">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6"
            >
              استخراج البيانات 
              <br />
              <span className="text-blue-600 dark:text-blue-400">بذكاء اصطناعي</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-10"
            >
              منصة متكاملة لاستخراج البيانات من الصور باستخدام أحدث تقنيات الذكاء الاصطناعي
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-16"
            >
              <Button 
                size="lg" 
                asChild 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-full text-lg"
              >
                <Link to="/upload">
                  ابدأ الآن
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="border-slate-300 text-slate-900 dark:text-white dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-8 py-6 rounded-full text-lg"
              >
                <Link to="/service">تعرف على خدماتنا</Link>
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* تأثيرات النقاط الزخرفية - Decorative dots */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl"></div>
      </section>
      
      {/* ميزات الخدمة */}
      <section className="py-20 px-6 bg-white dark:bg-[#0A2342]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4 text-[#0A2342] dark:text-white">
              مميزات منصتنا
            </h2>
            <p className="text-[#34495E] dark:text-gray-300 text-lg">
              نقدم حلولًا متكاملة لاستخراج البيانات بسهولة وكفاءة
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'معالجة تلقائية', description: 'استخراج البيانات من الصور بشكل آلي' },
              { title: 'دقة عالية', description: 'نسبة دقة تصل إلى 99% في استخراج البيانات' },
              { title: 'سرعة معالجة', description: 'معالجة مئات الصور في وقت قصير' }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white dark:bg-[#1F4068] p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-[#0A2342] dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-[#34495E] dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* قسم الدعوة للعمل */}
      <section className="py-20 px-6 bg-blue-50 dark:bg-blue-900/20">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-6 text-[#0A2342] dark:text-white"
          >
            جاهز للبدء؟
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-300 mb-10"
          >
            انضم إلينا الآن واستفد من أحدث تقنيات استخراج البيانات
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button 
              size="lg" 
              asChild 
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 rounded-full text-lg"
            >
              <Link to="/register">
                إنشاء حساب مجاني
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
