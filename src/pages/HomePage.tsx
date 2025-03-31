import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import AppHeader from '@/components/AppHeader';
import { Pricing } from '@/components/ui/pricing';
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

  // دالة للتوجيه إلى صفحة التسجيل مع باقة محددة
  const handleSelectPlan = (planId: string) => {
    navigate(`/register?plan=${planId}`);
  };
  return <div className="min-h-screen bg-white dark:bg-[#0A2342]" dir="rtl">
      <AppHeader />
      
      {/* قسم الترحيب الجديد - Simple Hero Section */}
      <section className="py-20 px-6 bg-white dark:bg-[#0A2342]">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
              <div className="rounded-xl overflow-hidden shadow-lg">
                
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 text-right order-1 lg:order-2">
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6
            }} className="py-[24px] px-0 rounded-sm mx-0 my-[2px]">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[#0A2342] dark:text-white">
                  استخراج البيانات من الصور{' '}
                  <span className="text-blue-600 dark:text-blue-400">بذكاء اصطناعي متطور</span>
                </h1>
                
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
                  خدمة متكاملة لاستخراج البيانات من الصور وأتمتتها بسرعة وكفاءة، مع خطط اشتراك مرنة تناسب الجميع
                </p>
                
                <div className="mt-8">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-6" asChild>
                    <Link to="/register">
                      ابدأ الآن مجاناً
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* قسم الباقات المتوفرة */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-[#0D2B4B]">
        <div className="container mx-auto max-w-6xl">
          <Pricing plans={pricingPlans} title="باقات مرنة تناسب احتياجاتك" description="اختر الباقة المناسبة لاحتياجاتك واستمتع بميزات استخراج البيانات المتقدمة" onSelectPlan={handleSelectPlan} />
        </div>
      </section>
      
      {/* قسم الدعوة للعمل - CTA */}
      <section className="py-16 px-6 bg-blue-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">استفد من خدماتنا الآن</h2>
          <p className="text-lg mb-8 text-blue-100">
            ابدأ رحلتك مع منصتنا واستفد من تقنيات الذكاء الاصطناعي المتطورة في استخراج البيانات
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 text-lg" size="lg" asChild>
              <Link to="/register">
                إنشاء حساب جديد
              </Link>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-white text-white hover:bg-blue-700 text-lg" size="lg">
                  عرض توضيحي
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>عرض توضيحي للخدمة</AlertDialogTitle>
                  <AlertDialogDescription>
                    سجل الآن للحصول على عرض توضيحي مجاني للخدمة مع أحد المختصين لدينا.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={() => navigate('/register')}>
                    سجل الآن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>
      
      {/* تذييل الصفحة - Footer */}
      <footer className="bg-white dark:bg-[#0A2342] border-t py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-right">
              <h3 className="font-bold text-lg mb-4">استخراج البيانات</h3>
              <p className="text-gray-600 dark:text-gray-400">
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
                  <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    الصفحة الرئيسية
                  </Link>
                </li>
                <li>
                  <Link to="/service" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    خدماتنا
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    تسجيل الدخول
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    إنشاء حساب
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="text-right">
              <h3 className="font-bold text-lg mb-4">تواصل معنا</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
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
          
          <div className="mt-8 pt-8 border-t text-center text-gray-600 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} خدمة استخراج البيانات - جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>;
};
export default HomePage;