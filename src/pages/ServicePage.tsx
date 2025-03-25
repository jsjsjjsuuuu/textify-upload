
import React from 'react';
import AppHeader from '@/components/AppHeader';
import { Separator } from "@/components/ui/separator";
import { Shield, Wrench, UserCheck, Zap, Clock, HeartHandshake } from 'lucide-react';

const ServicePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <div className="container mx-auto p-4 flex-1">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center my-8">خدمات التطبيق</h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            نقدم مجموعة متكاملة من الخدمات لمساعدتك في استخراج البيانات من الصور ومعالجتها بكفاءة
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
            <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">استخراج النصوص من الصور</h3>
                <Separator className="my-4 w-1/3" />
                <p className="text-muted-foreground text-center">
                  تحويل النصوص في الصور إلى نصوص قابلة للنسخ والتحرير بدقة عالية باستخدام تقنيات الذكاء الاصطناعي
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">حماية البيانات</h3>
                <Separator className="my-4 w-1/3" />
                <p className="text-muted-foreground text-center">
                  نضمن أمان وخصوصية بياناتك المستخرجة من الصور مع الحفاظ على سرية المعلومات
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">تصحيح البيانات تلقائياً</h3>
                <Separator className="my-4 w-1/3" />
                <p className="text-muted-foreground text-center">
                  تحسين وتصحيح البيانات المستخرجة تلقائياً باستخدام خوارزميات ذكية وقواعد تصحيح متقدمة
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">دعم لجميل AI</h3>
                <Separator className="my-4 w-1/3" />
                <p className="text-muted-foreground text-center">
                  تحليل ذكي للصور باستخدام Gemini AI لاستخراج المعلومات المهمة وتنظيمها
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">معالجة سريعة</h3>
                <Separator className="my-4 w-1/3" />
                <p className="text-muted-foreground text-center">
                  استخراج البيانات من الصور بسرعة عالية مع الحفاظ على الدقة في النتائج
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <HeartHandshake className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">دعم فني متميز</h3>
                <Separator className="my-4 w-1/3" />
                <p className="text-muted-foreground text-center">
                  فريق دعم مخصص لمساعدتك في حل أي مشاكل قد تواجهها أثناء استخدام التطبيق
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-8 rounded-lg my-12">
            <h2 className="text-2xl font-bold mb-4 text-center">كيفية استخدام الخدمة</h2>
            <ol className="space-y-4 rtl">
              <li className="flex gap-3">
                <span className="font-bold bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                <div>
                  <p className="font-medium">قم بتحميل الصور التي تحتوي على النصوص المراد استخراجها</p>
                  <p className="text-muted-foreground">يمكنك سحب وإفلات الصور أو تحميلها من جهازك</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                <div>
                  <p className="font-medium">انتظر حتى تتم معالجة الصور واستخراج النصوص منها</p>
                  <p className="text-muted-foreground">يعمل النظام على تحليل الصور واستخراج البيانات منها بشكل دقيق</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                <div>
                  <p className="font-medium">قم بمراجعة وتعديل البيانات المستخرجة إذا لزم الأمر</p>
                  <p className="text-muted-foreground">يمكنك التأكد من دقة البيانات وتعديلها حسب الحاجة</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">4</span>
                <div>
                  <p className="font-medium">تصدير البيانات إلى Google Sheets أو تحميلها بصيغة Excel</p>
                  <p className="text-muted-foreground">سهولة حفظ البيانات واستخدامها في تطبيقاتك المختلفة</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              خدمات استخراج البيانات - &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ServicePage;
