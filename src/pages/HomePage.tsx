import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, ChevronUp, Clock, Database, FileText, Upload, Users, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import AppHeader from '@/components/AppHeader';
import { Pricing } from '@/components/ui/pricing';
import { WorldMapDemo } from '@/components/ui/world-map-demo';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
const HomePage = () => {
  const navigate = useNavigate();
  const [openFeatureDialog, setOpenFeatureDialog] = useState<string | null>(null);

  // معلومات الباقات المحدثة للاستخدام مع مكون التسعير الجديد
  const pricingPlans = [{
    id: 'standard',
    name: 'الباقة العادية',
    price: '500',
    yearlyPrice: '400',
    period: 'شهرياً',
    description: 'مناسبة للاستخدام الفردي والشركات الصغيرة',
    features: ['رفع 750 صورة يومياً', 'معالجة بيانات دقيقة', 'دعم فني أساسي'],
    buttonText: 'اختر هذه الباقة',
    href: '/register?plan=standard',
    isPopular: false
  }, {
    id: 'vip',
    name: 'الباقة VIP',
    price: '1000',
    yearlyPrice: '800',
    period: 'شهرياً',
    description: 'للشركات المتوسطة التي تتطلب سرعة ودقة',
    features: ['رفع 1600 صورة يومياً', 'معالجة بيانات بسرعة مضاعفة', 'دعم فني متقدم', 'أولوية في معالجة الطلبات'],
    buttonText: 'اختر هذه الباقة',
    href: '/register?plan=vip',
    isPopular: true
  }, {
    id: 'pro',
    name: 'الباقة PRO',
    price: '2400',
    yearlyPrice: '1900',
    period: 'شهرياً',
    description: 'للشركات الكبيرة والمؤسسات',
    features: ['رفع 3500 صورة يومياً', 'خوارزميات متطورة لاستخراج البيانات', 'دعم فني على مدار الساعة', 'تكامل مع الأنظمة الأخرى', 'تقارير تفصيلية وأرشفة تلقائية'],
    buttonText: 'اختر هذه الباقة',
    href: '/register?plan=pro',
    isPopular: false
  }];

  // مزايا إضافية
  const additionalFeatures = [{
    title: 'أتمتة إدخال البيانات',
    description: 'إدخال البيانات في المواقع دون الحاجة لـ API',
    icon: <FileText />
  }, {
    title: 'رفع متعدد للصور',
    description: 'دعم رفع صور متعددة دفعة واحدة بكفاءة عالية',
    icon: <Upload />
  }, {
    title: 'واجهة سهلة الاستخدام',
    description: 'لوحة تحكم بواجهة سهلة وبسيطة للمستخدمين',
    icon: <Users />
  }, {
    title: 'تحليل جودة البيانات',
    description: 'تحليل جودة البيانات وقياس نسبة الدقة',
    icon: <ChevronUp />
  }, {
    title: 'سجل عمليات مفصل',
    description: 'سجل تفصيلي لكل ملف تمت معالجته',
    icon: <Clock />
  }, {
    title: 'إرسال البيانات بسرعة',
    description: 'إرسال البيانات إلى المواقع المستهدفة بسرعة فائقة',
    icon: <Zap />
  }];
  const timelineItems = [{
    year: '2024',
    title: 'معالجة الصور بالذكاء الاصطناعي',
    description: 'نقدم حلولًا متقدمة لاستخراج البيانات بدقة عالية',
    items: ['استخراج نصوص من مختلف أنواع الصور', 'التعرف على الأختام والتواقيع', 'تصنيف وفهرسة البيانات تلقائيًا']
  }, {
    year: '2023',
    title: 'أتمتة إدخال البيانات',
    description: 'حلول ذكية لتسريع وأتمتة عمليات إدخال البيانات',
    items: ['دعم المؤسسات الحكومية والخاصة', 'معالجة أكثر من 10,000 صورة يوميًا', 'دقة في استخراج البيانات تصل إلى 99%']
  }, {
    year: 'أوائل 2023',
    title: 'بداية الابتكار',
    description: 'إطلاق منصة متكاملة لاستخراج البيانات',
    items: ['حل مشاكل إدخال البيانات اليدوي', 'تطوير خوارزميات متقدمة', 'بناء حلول سريعة وموثوقة']
  }];

  // دالة لعرض نافذة حوار عند النقر على ميزة إضافية
  const showFeatureDialog = (featureTitle: string) => {
    setOpenFeatureDialog(featureTitle);
  };

  // دالة للتوجيه إلى صفحة التسجيل مع باقة محددة
  const handleSelectPlan = (planId: string) => {
    navigate(`/register?plan=${planId}`);
  };
  return <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader />
      
      {/* قسم الترحيب - Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden bg-transparent md:py-[33px]">
        <div className="container mx-auto max-w-6xl relative z-10 px-0 my-[45px]">
          {/* تم تغيير تصميم هذا القسم بشكل كامل */}
          <div className="flex flex-col md:flex-row gap-8 items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-3xl overflow-hidden shadow-xl p-8">
            <div className="md:w-1/2 space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-right"
              >
                <Badge className="bg-blue-600 text-white mb-4 px-3 py-1 text-sm">الحل الأمثل لاستخراج البيانات</Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-800 dark:text-blue-200 leading-tight">
                  استخرج البيانات من صورك <span className="text-indigo-600 dark:text-indigo-400">بكفاءة عالية</span>
                </h1>
                <p className="text-gray-700 dark:text-gray-300 mt-4 text-lg">
                  نقدم لك منصة متكاملة تعمل بالذكاء الاصطناعي لاستخراج البيانات من الصور وتحويلها إلى نصوص قابلة للاستخدام
                </p>
                
                <div className="flex gap-4 mt-8">
                  <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 px-6 rounded-xl">
                    <Link to="/register">ابدأ الآن</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-950/50 px-6 rounded-xl">
                    <Link to="/service">تعرف على خدماتنا</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              className="md:w-1/2 relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white dark:border-gray-800">
                <img 
                  src="/placeholder-image.jpg" 
                  alt="استخراج البيانات من الصور" 
                  className="w-full h-auto object-cover aspect-video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent"></div>
              </div>
              
              {/* إضافة أيقونات على الصورة */}
              <div className="absolute -top-4 -right-4 bg-indigo-500 text-white p-3 rounded-full shadow-lg">
                <FileText size={24} />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg">
                <Database size={24} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      
      <WorldMapDemo />
      
      
          <section className="py-20 px-6 bg-white dark:bg-[#0A2342]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="apple-header text-3xl md:text-4xl font-medium tracking-tight mb-4 text-[#0A2342] dark:text-white">
              جدولنا الزمني
            </h2>
            <p className="text-[#34495E] dark:text-gray-300 text-lg">
              تطور خدماتنا وخططنا المستقبلية
            </p>
          </div>
          
          <div className="relative mx-auto max-w-4xl">
            {/* خط العمود الجديد - منتصف */}
            <div className="absolute h-full w-1 bg-gradient-to-b from-[#0A2342] via-[#1F4068] to-[#34495E] right-1/2 transform translate-x-1/2 left-1/2"></div>
            
            {/* عناصر الجدول الزمني بتصميم جديد */}
            {timelineItems.map((item, index) => <div key={index} className={`mb-16 relative flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`w-[45%] relative ${index % 2 === 0 ? 'ml-12' : 'mr-12'}`}>
                  {/* النقطة المضيئة على الخط */}
                  <div className="absolute w-5 h-5 bg-[#0A2342] rounded-full top-6 transform -translate-y-1/2 shadow-md shadow-[#1F4068]/30 z-10" style={{
                [index % 2 === 0 ? 'right' : 'left']: '-42px'
              }}>
                    <div className="absolute w-3 h-3 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  
                  {/* بطاقة المحتوى */}
                  <motion.div initial={{
                opacity: 0,
                x: index % 2 === 0 ? 20 : -20
              }} whileInView={{
                opacity: 1,
                x: 0
              }} transition={{
                duration: 0.5,
                delay: 0.1
              }} viewport={{
                once: true
              }} className="bg-white dark:bg-[#1F4068] p-6 rounded-xl shadow-md border border-[#0A2342]/10 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      <h3 className="text-xl font-bold text-[#0A2342] dark:text-white">{item.title}</h3>
                    </div>
                    
                    <p className="text-[#34495E] dark:text-gray-300 mb-4">{item.description}</p>
                    
                    <ul className="space-y-2">
                      {item.items.map((subItem, subIndex) => <li key={subIndex} className="flex items-start">
                          <div className="mr-2 mt-1 text-[#0A2342] dark:text-blue-400">
                            <CheckCircle2 size={16} />
                          </div>
                          <span className="text-[#34495E] dark:text-gray-300">{subItem}</span>
                        </li>)}
                    </ul>
                  </motion.div>
                </div>
              </div>)}
          </div>
        </div>
      </section>
      
      {/* قسم الباقات المتوفرة */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <Pricing plans={pricingPlans} title="باقات مرنة تناسب احتياجاتك" description="اختر الباقة المناسبة لاحتياجاتك واستمتع بميزات استخراج البيانات المتقدمة" onSelectPlan={handleSelectPlan} />
        </div>
      </section>
      
      
      
      
      <footer className="bg-card border-t py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-right">
              <h3 className="font-bold text-lg mb-4">استخراج البيانات</h3>
              <p className="text-muted-foreground">
                خدمة متكاملة لاستخراج البيانات من الصور وأتمتتها بسرعة وكفاءة عالية
              </p>
              <div className="mt-4">
                <ThemeToggle />
              </div>
            </div>
            
            <div className="text-right">
              <h3 className="font-bold text-lg mb-4">روابط سريعة</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                    الصفحة الرئيسية
                  </Link>
                </li>
                <li>
                  <Link to="/service" className="text-muted-foreground hover:text-foreground transition-colors">
                    خدماتنا
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    تسجيل الدخول
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                    إنشاء حساب
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="text-right">
              <h3 className="font-bold text-lg mb-4">تواصل معنا</h3>
              <p className="text-muted-foreground mb-2">
                يسعدنا الإجابة عن استفساراتك وتقديم الدعم اللازم
              </p>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link to="/contact">
                    اتصل بنا
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="text-center text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} خدمة استخراج البيانات - جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>;
};
export default HomePage;
