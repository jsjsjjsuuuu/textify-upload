import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, ChevronUp, Clock, Database, FileText, Upload, Users, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import AppHeader from '@/components/AppHeader';
import { Pricing } from '@/components/ui/pricing';
import { WorldMapDemo } from '@/components/ui/world-map-demo';
const HomePage = () => {
  // معلومات الباقات المحدثة للاستخدام مع مكون التسعير الجديد
  const pricingPlans = [{
    id: 'standard',
    name: 'الباقة العادية',
    price: '500',
    yearlyPrice: '400',
    period: 'شهريًا',
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
    period: 'شهريًا',
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
    period: 'شهريًا',
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
  return <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      {/* قسم الترحيب - Hero Section */}
      <section className="relative py-20 px-6 md:py-32 overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="text-center lg:text-right">
              
              <h1 className="apple-header md:text-5xl lg:text-6xl font-medium tracking-tight mb-6 text-4xl">
                استخراج البيانات من الصور <span className="text-brand-coral">بذكاء اصطناعي</span> متطور
              </h1>
              <p className="text-lg text-muted-foreground mb-8 md:text-base">
                خدمة متكاملة لاستخراج البيانات من الصور وأتمتتها بسرعة وكفاءة، مع خطط اشتراك مرنة تناسب الجميع
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-end gap-4">
                <Button className="apple-button bg-brand-coral text-white hover:bg-brand-coral/90" size="lg" asChild>
                  <Link to="/register" className="mx-[240px] my-0 py-[15px] px-[59px]">
                    ابدأ الآن مجاناً
                  </Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.6,
            delay: 0.2
          }} className="relative mx-auto max-w-md lg:max-w-none">
              <div className="elegant-upload relative overflow-hidden rounded-3xl shadow-2xl aspect-[4/3]">
                <img src="/placeholder-image.jpg" alt="استخراج البيانات من الصور" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                  <div className="text-white">
                    <h3 className="text-xl font-medium mb-2">استخراج دقيق للبيانات</h3>
                    <p className="text-white/80 text-sm">استخراج النصوص والبيانات من الصور بدقة عالية</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* إضافة قسم خريطة العالم - World Map Section */}
      <WorldMapDemo />
      
      {/* قسم الباقات المتوفرة */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <Pricing plans={pricingPlans} title="باقات مرنة تناسب احتياجاتك" description="اختر الباقة المناسبة لاحتياجاتك واستمتع بميزات استخراج البيانات المتقدمة" />
        </div>
      </section>
      
      {/* قسم المزايا الإضافية */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="apple-header text-3xl md:text-4xl font-medium tracking-tight mb-4">
              مزايا إضافية لتحسين سير عملك
            </h2>
            <p className="text-muted-foreground text-lg">
              استمتع بمجموعة من المزايا المتقدمة التي تساعدك في تسريع وتحسين عمليات معالجة البيانات
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="bg-card rounded-xl p-6 hover:shadow-md transition-shadow border">
                <div className="w-12 h-12 rounded-full bg-brand-beige flex items-center justify-center mb-4">
                  <div className="text-brand-brown">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="apple-subheader text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>)}
          </div>
        </div>
      </section>
      
      {/* قسم الدعوة للعمل - CTA */}
      <section className="py-16 px-6 bg-brand-brown text-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-8">
              ابدأ الآن واترك لنا مهمة استخراج بياناتك!
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              انضم إلى الآلاف من العملاء الذين يثقون بنا في استخراج وأتمتة بياناتهم من الصور بدقة وكفاءة عالية
            </p>
            <Button size="lg" className="bg-white text-brand-brown hover:bg-white/90" asChild>
              <Link to="/register">
                سجل حساب جديد الآن
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* تذييل الصفحة - Footer */}
      <footer className="bg-card border-t py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">استخراج البيانات</h3>
              <p className="text-muted-foreground">
                خدمة متكاملة لاستخراج البيانات من الصور وأتمتتها بسرعة وكفاءة عالية
              </p>
              <div className="mt-4">
                <ThemeToggle />
              </div>
            </div>
            
            <div>
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
            
            <div>
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