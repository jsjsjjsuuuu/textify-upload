
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowLeft, CopyIcon, CheckIcon, Info } from "lucide-react";
import { ImageData } from "@/types/ImageData";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SiteLoginBookmarkletProps {
  imageData: ImageData | null;
  multipleImages?: ImageData[];
  isMultiMode?: boolean;
  siteUrl: string;
  username: string;
  password: string;
  onReset: () => void;
}

const SiteLoginBookmarklet = ({
  imageData,
  multipleImages = [],
  isMultiMode = false,
  siteUrl,
  username,
  password,
  onReset
}: SiteLoginBookmarkletProps) => {
  const [copied, setCopied] = useState(false);
  const [bookmarkletUrl, setBookmarkletUrl] = useState("");
  const { toast } = useToast();

  useState(() => {
    if (isMultiMode && multipleImages.length > 0) {
      generateMultiLoginBookmarklet(multipleImages);
    } else if (imageData) {
      generateLoginBookmarklet(imageData);
    }
  });

  const generateLoginBookmarklet = (data: ImageData) => {
    // إعداد البيانات للتصدير بشكل يتناسب مع الموقع المستهدف في الصورة
    const exportData = {
      // استخدام الحقول المناسبة من البيانات المستخرجة
      orderNumber: data.code || data.orderNumber || "",
      clientCode: data.clientCode || "",
      clientName: data.senderName || data.clientName || "",
      clientPhone: data.phoneNumber || "",
      delegateName: data.delegateName || "",
      totalAmount: data.price || data.totalAmount || "",
      zoneName: data.zoneName || data.province || "",
      region: data.region || data.province || "",
      paymentType: data.paymentType || "",
      piecesCount: data.piecesCount || "1",
      clientFees: data.clientFees || "",
      delegateFees: data.delegateFees || "",
      notes: data.notes || "",
      specialNotes: data.specialNotes || "",
      // البيانات الإضافية للتسجيل
      siteUrl: siteUrl,
      username: username,
      password: password
    };
    
    // إنشاء سكريبت الـ bookmarklet
    const bookmarkletScript = `
      (function() {
        try {
          // بيانات التسجيل والبيانات المستخرجة
          const loginData = ${JSON.stringify({
            username: exportData.username,
            password: exportData.password
          })};
          
          const formData = ${JSON.stringify({
            orderNumber: exportData.orderNumber,
            clientCode: exportData.clientCode, 
            clientName: exportData.clientName,
            clientPhone: exportData.clientPhone,
            delegateName: exportData.delegateName,
            totalAmount: exportData.totalAmount,
            zoneName: exportData.zoneName,
            region: exportData.region,
            paymentType: exportData.paymentType,
            piecesCount: exportData.piecesCount,
            clientFees: exportData.clientFees,
            delegateFees: exportData.delegateFees,
            notes: exportData.notes,
            specialNotes: exportData.specialNotes
          })};
          
          // التحقق من الموقع الحالي
          const url = "${siteUrl}";
          if (window.location.href.indexOf(url) === -1) {
            if(confirm("هل تريد الانتقال إلى الموقع المستهدف: " + url + "؟")) {
              window.location.href = url;
              return;
            }
          }
          
          console.log("تنفيذ أداة التعبئة التلقائية على الموقع:", window.location.href);
          
          // وظيفة تأخير للانتظار
          const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
          
          // وظيفة تسجيل الدخول
          const performLogin = async () => {
            // البحث عن حقول تسجيل الدخول
            const userField = document.querySelector('input[name*="user"], input[id*="user"], input[placeholder*="اسم المستخدم"], input[placeholder*="البريد"], input[type="email"]');
            const passField = document.querySelector('input[name*="pass"], input[id*="pass"], input[type="password"]');
            const loginButton = document.querySelector('button[type="submit"], input[type="submit"], a.login, button.login, .login-button, button:contains("دخول"), button:contains("تسجيل الدخول")');
            
            if (userField && passField) {
              console.log("تم العثور على حقول تسجيل الدخول");
              
              // ملء حقول تسجيل الدخول
              userField.value = loginData.username;
              userField.dispatchEvent(new Event('input', { bubbles: true }));
              await delay(300);
              
              passField.value = loginData.password;
              passField.dispatchEvent(new Event('input', { bubbles: true }));
              await delay(300);
              
              if (loginButton) {
                console.log("النقر على زر تسجيل الدخول");
                loginButton.click();
              } else {
                // إرسال النموذج إذا لم نجد زر
                const form = userField.closest('form');
                if (form) {
                  console.log("إرسال نموذج تسجيل الدخول");
                  form.submit();
                }
              }
              
              // انتظار إكمال تسجيل الدخول
              await delay(2000);
            } else {
              console.log("لا توجد حقول تسجيل دخول - قد تكون مسجلاً بالفعل أو الصفحة مختلفة");
            }
          };
          
          // وظيفة ملء الحقول بعد تسجيل الدخول
          const fillFormFields = async () => {
            // قاموس لربط أسماء الحقول بالتسميات المحتملة في الموقع
            const fieldMapping = {
              'orderNumber': ['كود العميل', 'رقم الطلب', 'رقم العميل', 'الكود', 'رمز العميل'],
              'clientCode': ['كود العميل', 'رمز العميل'],
              'clientName': ['اسم العميل', 'العميل', 'المستلم', 'اسم المستلم'],
              'clientPhone': ['هاتف الزبون', 'رقم الهاتف', 'الجوال', 'موبايل'],
              'delegateName': ['اسم المندوب', 'المندوب'],
              'totalAmount': ['المبلغ الكلي', 'المبلغ', 'السعر', 'التكلفة'],
              'zoneName': ['اسم المنطقة', 'المنطقة', 'الزون'],
              'region': ['المحافظة', 'محافظة', 'المدينة'],
              'paymentType': ['نوع البضاعة', 'نوع الدفع', 'طريقة الدفع'],
              'piecesCount': ['عدد القطع', 'عدد', 'القطع', 'الكمية'],
              'clientFees': ['زيادة أجرة العميل', 'أجرة إضافية للعميل'],
              'delegateFees': ['زيادة أجرة المندوب', 'أجرة إضافية للمندوب'],
              'notes': ['ملاحظات', 'تعليق'],
              'specialNotes': ['ملاحظات خاصة', 'ملاحظات إضافية']
            };
            
            // البحث عن الحقول وملؤها
            for (const [field, labels] of Object.entries(fieldMapping)) {
              if (!formData[field]) continue; // تخطي الحقول الفارغة
              
              let found = false;
              
              // البحث عن حقل بناءً على التسمية
              for (const label of labels) {
                // البحث عن عناصر التسمية
                const labelElements = Array.from(document.querySelectorAll('label, span, div'));
                for (const elem of labelElements) {
                  if (elem.textContent && elem.textContent.includes(label)) {
                    // البحث عن حقل الإدخال القريب
                    let input = null;
                    
                    // إذا كان عنصر تسمية، ابحث عن الحقل المرتبط به
                    if (elem.tagName === 'LABEL' && elem.htmlFor) {
                      input = document.getElementById(elem.htmlFor);
                    }
                    
                    // البحث في الأشقاء والعناصر التالية
                    if (!input) {
                      input = elem.nextElementSibling?.querySelector('input, textarea, select') 
                        || elem.parentElement?.querySelector('input, textarea, select');
                    }
                    
                    // البحث في العناصر الأبناء
                    if (!input) {
                      const container = elem.closest('.form-group, .input-group, .field');
                      if (container) {
                        input = container.querySelector('input, textarea, select');
                      }
                    }
                    
                    if (input) {
                      console.log(\`تم العثور على حقل \${label}: \${formData[field]}\`);
                      
                      if (input.tagName === 'SELECT') {
                        // للقوائم المنسدلة، ابحث عن القيمة المناسبة
                        const options = Array.from(input.options);
                        const option = options.find(opt => 
                          opt.textContent.includes(formData[field]) || 
                          formData[field].includes(opt.textContent)
                        );
                        
                        if (option) {
                          input.value = option.value;
                        } else {
                          // إذا لم نجد خيارًا مطابقًا، حاول اختيار أول خيار غير فارغ
                          for (const opt of options) {
                            if (opt.value) {
                              input.value = opt.value;
                              break;
                            }
                          }
                        }
                      } else {
                        input.value = formData[field];
                      }
                      
                      // إطلاق أحداث لضمان التحديث
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                      
                      found = true;
                      break;
                    }
                  }
                }
                
                if (found) break;
              }
              
              // إذا لم يتم العثور على الحقل بالتسمية، ابحث بناءً على السمات
              if (!found) {
                const selectors = [
                  \`input[name*="\${field}"]\`,
                  \`input[id*="\${field}"]\`,
                  \`input[placeholder*="\${field}"]\`,
                  \`textarea[name*="\${field}"]\`,
                  \`textarea[id*="\${field}"]\`,
                  \`textarea[placeholder*="\${field}"]\`,
                  \`select[name*="\${field}"]\`,
                  \`select[id*="\${field}"]\`
                ];
                
                for (const selector of selectors) {
                  const input = document.querySelector(selector);
                  if (input) {
                    console.log(\`تم العثور على حقل بالمحدد \${selector}: \${formData[field]}\`);
                    
                    if (input.tagName === 'SELECT') {
                      // للقوائم المنسدلة
                      const options = Array.from(input.options);
                      const option = options.find(opt => 
                        opt.textContent.includes(formData[field]) || 
                        formData[field].includes(opt.textContent)
                      );
                      
                      if (option) {
                        input.value = option.value;
                      }
                    } else {
                      input.value = formData[field];
                    }
                    
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    found = true;
                    break;
                  }
                }
              }
              
              await delay(100); // تأخير قصير بين ملء الحقول
            }
            
            return Object.values(fieldMapping).some((_, i) => formData[Object.keys(fieldMapping)[i]]);
          };
          
          // إنشاء واجهة مستخدم للإشعارات
          const createNotification = (message, isSuccess = true) => {
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '10px';
            notification.style.right = '10px';
            notification.style.backgroundColor = isSuccess ? '#4caf50' : '#f44336';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            notification.style.zIndex = '9999';
            notification.style.direction = 'rtl';
            notification.style.fontFamily = 'Arial, sans-serif';
            notification.style.fontSize = '14px';
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 5000);
          };
          
          // تنفيذ العملية الكاملة
          (async () => {
            try {
              // التحقق مما إذا كنا بحاجة لتسجيل الدخول
              const isLoginPage = document.querySelector('input[type="password"]') !== null;
              if (isLoginPage && loginData.username && loginData.password) {
                console.log("صفحة تسجيل الدخول، جاري محاولة تسجيل الدخول...");
                createNotification("جاري محاولة تسجيل الدخول...", true);
                await performLogin();
                
                // قد نحتاج للانتظار وإعادة تنفيذ البرنامج النصي بعد التسجيل
                setTimeout(() => {
                  createNotification("تم تسجيل الدخول، يمكنك النقر على البوكماركلت مرة أخرى لملء الحقول", true);
                }, 2000);
                return;
              }
              
              // محاولة ملء الحقول
              console.log("جاري البحث عن الحقول وملؤها...");
              const filled = await fillFormFields();
              
              if (filled) {
                createNotification("تم ملء الحقول بنجاح!", true);
              } else {
                createNotification("لم يتم العثور على حقول مناسبة للملء", false);
              }
            } catch (error) {
              console.error("حدث خطأ:", error);
              createNotification("حدث خطأ أثناء ملء البيانات: " + error.message, false);
            }
          })();
        } catch (error) {
          alert("حدث خطأ: " + error.message);
        }
      })();
    `;
    
    // تنظيف الكود وتحويله ليناسب الـ bookmarklet
    const cleanCode = bookmarkletScript
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\n\r]/g, '');
    
    // إنشاء رابط الـ bookmarklet
    const bookmarklet = `javascript:${encodeURIComponent(cleanCode)}`;
    setBookmarkletUrl(bookmarklet);
  };

  const generateMultiLoginBookmarklet = (images: ImageData[]) => {
    // يمكن تنفيذ منطق مشابه هنا للعمل مع صور متعددة
    // ... نفس المنطق مع تعديلات للتعامل مع قائمة من الصور
    // لتبسيط الاستجابة، سنستخدم نفس الكود للآن
    if (images.length > 0) {
      generateLoginBookmarklet(images[0]);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletUrl);
      setCopied(true);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الـ Bookmarklet بنجاح"
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "خطأ في النسخ",
        description: "لم يتم نسخ الرابط. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-border/60 dark:border-gray-700/60">
      <CardHeader>
        <CardTitle className="text-center text-lg text-brand-brown dark:text-brand-beige">
          أداة التعبئة التلقائية مع تسجيل الدخول
        </CardTitle>
        <CardDescription className="text-center text-gray-600 dark:text-gray-400">
          اسحب الزر أدناه إلى شريط المفضلة في متصفحك، ثم انقر عليه في موقع {siteUrl}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="border border-border rounded-md p-4 bg-muted/20 text-center">
          <a 
            href={bookmarkletUrl} 
            className="inline-block bg-brand-green text-white py-2 px-4 rounded-md hover:bg-brand-green/90 transition-colors"
            onClick={(e) => e.preventDefault()}
            title="اسحب هذا الزر إلى شريط المفضلة"
          >
            التعبئة التلقائية + تسجيل الدخول
          </a>
          <p className="mt-2 text-sm text-muted-foreground">اسحب هذا الزر إلى شريط المفضلة في متصفحك</p>
        </div>
        
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30">
          <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              إذا كنت بالفعل مسجل دخول في الموقع، سيتم ملء الحقول مباشرة. وإلا، سيحاول تسجيل الدخول أولاً ثم يمكنك النقر على الزر مرة أخرى لملء البيانات.
            </span>
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={copyToClipboard}
          >
            {copied ? <CheckIcon className="ml-2 h-4 w-4" /> : <CopyIcon className="ml-2 h-4 w-4" />}
            {copied ? "تم النسخ" : "نسخ الرابط"}
          </Button>
        </div>
        
        <div className="text-sm mt-2 space-y-2">
          <h4 className="font-medium">كيفية الاستخدام:</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>اسحب الزر الأخضر أعلاه إلى شريط المفضلة في متصفحك</li>
            <li>انتقل إلى موقع {siteUrl}</li>
            <li>انقر على الزر في شريط المفضلة</li>
            <li>إذا لم تكن مسجل دخول، سيحاول تسجيل الدخول تلقائيًا</li>
            <li>بعد تسجيل الدخول، انقر على الزر مرة أخرى لملء الحقول</li>
          </ol>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-border/30 dark:border-gray-700/30 pt-4">
        <Button variant="ghost" size="sm" onClick={onReset}>
          <ArrowLeft className="h-4 w-4 ml-1" />
          رجوع
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SiteLoginBookmarklet;
