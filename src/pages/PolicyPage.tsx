
import React from 'react';
import AppHeader from '@/components/AppHeader';
import { Shield, File, Lock, Eye, Share2, Award } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const PolicyPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <div className="container mx-auto p-4 flex-1">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center my-8">سياسة الخصوصية والشروط</h1>
          <p className="text-lg text-muted-foreground text-center mb-8">
            نلتزم بحماية خصوصية بياناتك وتوفير خدمة آمنة وموثوقة
          </p>

          <Tabs defaultValue="privacy" className="w-full my-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="privacy">سياسة الخصوصية</TabsTrigger>
              <TabsTrigger value="terms">شروط الاستخدام</TabsTrigger>
              <TabsTrigger value="faq">الأسئلة الشائعة</TabsTrigger>
            </TabsList>
            
            <TabsContent value="privacy" className="p-4 bg-card rounded-md mt-4 border">
              <div className="flex items-center justify-center mb-6">
                <Shield className="h-10 w-10 text-primary mr-3" />
                <h2 className="text-2xl font-bold">سياسة الخصوصية</h2>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-6">
                <div className="bg-muted/40 p-4 rounded-lg">
                  <div className="flex items-start mb-2">
                    <Lock className="h-5 w-5 text-primary mt-1 ml-2" />
                    <h3 className="text-xl font-semibold">جمع البيانات</h3>
                  </div>
                  <p className="text-muted-foreground pr-7">
                    نقوم بجمع معلومات محدودة فقط وهي ضرورية لتقديم خدماتنا. هذه المعلومات تشمل الصور التي تقوم بتحميلها والبيانات المستخرجة منها. لا نقوم بمشاركة هذه البيانات مع أي طرف ثالث دون موافقتك الصريحة.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-4 rounded-lg">
                  <div className="flex items-start mb-2">
                    <Eye className="h-5 w-5 text-primary mt-1 ml-2" />
                    <h3 className="text-xl font-semibold">استخدام البيانات</h3>
                  </div>
                  <p className="text-muted-foreground pr-7">
                    نستخدم البيانات التي تقدمها فقط لتوفير الخدمات التي طلبتها، مثل استخراج النصوص من الصور ومعالجتها. قد نستخدم بيانات مجهولة المصدر لتحسين خدماتنا وتطويرها.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-4 rounded-lg">
                  <div className="flex items-start mb-2">
                    <Share2 className="h-5 w-5 text-primary mt-1 ml-2" />
                    <h3 className="text-xl font-semibold">مشاركة البيانات</h3>
                  </div>
                  <p className="text-muted-foreground pr-7">
                    لا نقوم بمشاركة بياناتك الشخصية أو الصور التي تقوم بتحميلها مع أي جهة خارجية. في حالة اختيارك لتصدير البيانات إلى Google Sheets، فإننا نطلب إذنك الصريح لذلك ويتم التعامل مع البيانات وفقًا لسياسة خصوصية Google.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-4 rounded-lg">
                  <div className="flex items-start mb-2">
                    <Shield className="h-5 w-5 text-primary mt-1 ml-2" />
                    <h3 className="text-xl font-semibold">أمان البيانات</h3>
                  </div>
                  <p className="text-muted-foreground pr-7">
                    نتخذ تدابير أمنية مناسبة لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف. نستخدم تقنيات تشفير وممارسات أمنية متقدمة لحماية بياناتك.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="terms" className="p-4 bg-card rounded-md mt-4 border">
              <div className="flex items-center justify-center mb-6">
                <File className="h-10 w-10 text-primary mr-3" />
                <h2 className="text-2xl font-bold">شروط الاستخدام</h2>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">1. قبول الشروط</h3>
                  <p className="text-muted-foreground">
                    باستخدامك لتطبيقنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام تطبيقنا.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">2. استخدام الخدمة</h3>
                  <p className="text-muted-foreground">
                    يمكنك استخدام تطبيقنا لاستخراج النصوص من الصور بشرط عدم استخدامه لأغراض غير قانونية أو محظورة بموجب هذه الشروط. يحق لنا تعليق أو إنهاء حسابك إذا انتهكت هذه الشروط.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">3. حقوق الملكية الفكرية</h3>
                  <p className="text-muted-foreground">
                    جميع حقوق الملكية الفكرية المتعلقة بالتطبيق وخدماته محفوظة لنا. لا يجوز لك نسخ أو تعديل أو توزيع أو بيع أو تأجير أي جزء من خدماتنا أو البرمجيات المضمنة فيها.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">4. التغييرات في الشروط</h3>
                  <p className="text-muted-foreground">
                    نحتفظ بالحق في تعديل هذه الشروط في أي وقت. ستصبح التغييرات سارية المفعول فور نشرها على الموقع. يعتبر استمرارك في استخدام التطبيق بعد نشر التغييرات موافقة منك على الشروط المعدلة.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">5. المسؤولية القانونية</h3>
                  <p className="text-muted-foreground">
                    لا نتحمل أي مسؤولية عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو خاصة أو تبعية ناتجة عن استخدام أو عدم القدرة على استخدام خدماتنا.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="faq" className="p-4 bg-card rounded-md mt-4 border">
              <div className="flex items-center justify-center mb-6">
                <Award className="h-10 w-10 text-primary mr-3" />
                <h2 className="text-2xl font-bold">الأسئلة الشائعة</h2>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-6">
                <div className="bg-muted/40 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">كيف يعمل التطبيق؟</h3>
                  <p className="text-muted-foreground">
                    يستخدم التطبيق تقنيات التعرف الضوئي على الحروف (OCR) والذكاء الاصطناعي لاستخراج النصوص من الصور. يقوم بتحليل الصورة وتحديد النصوص فيها ثم استخراجها بشكل يمكن تحريره ونسخه.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">هل بياناتي آمنة؟</h3>
                  <p className="text-muted-foreground">
                    نعم، نحن نأخذ أمان البيانات بجدية كبيرة. جميع الصور والبيانات التي تقوم بتحميلها تُعامل بسرية تامة ولا يتم مشاركتها مع أي جهة خارجية دون موافقتك الصريحة.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">هل هناك حد لعدد الصور التي يمكنني معالجتها؟</h3>
                  <p className="text-muted-foreground">
                    يمكنك معالجة عدد غير محدود من الصور، ولكن قد تكون هناك قيود على حجم الملفات أو معدل المعالجة اعتمادًا على حزمة الاشتراك الخاصة بك.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">كيف يمكنني تصدير البيانات المستخرجة؟</h3>
                  <p className="text-muted-foreground">
                    يمكنك تصدير البيانات المستخرجة بعدة طرق: تصديرها مباشرة إلى Google Sheets، أو تنزيلها كملف Excel، أو نسخها إلى الحافظة لاستخدامها في أي تطبيق آخر.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">ماذا لو لم يتمكن التطبيق من استخراج النص بشكل صحيح؟</h3>
                  <p className="text-muted-foreground">
                    يوفر التطبيق إمكانية تعديل النص المستخرج يدويًا. إذا واجهت مشاكل متكررة، يمكنك الاتصال بفريق الدعم الفني للمساعدة.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              سياسة الخصوصية وشروط الاستخدام - &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PolicyPage;
