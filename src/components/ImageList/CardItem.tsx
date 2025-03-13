
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import DraggableImage from "./DraggableImage";
import ImageDataForm from "./ImageDataForm";
import ActionButtons from "./ActionButtons";
import BookmarkletGenerator from "@/components/BookmarkletGenerator";
import { autoFillWebsiteForm } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Send, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CardItemProps {
  image: ImageData;
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onTextChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

interface SavedCredential {
  domain: string;
  username: string;
  password: string;
  date: string;
}

const CardItem = ({ 
  image, 
  isSubmitting, 
  onImageClick, 
  onTextChange, 
  onDelete, 
  onSubmit, 
  formatDate 
}: CardItemProps) => {
  const isPhoneNumberValid = !image.phoneNumber || image.phoneNumber.replace(/[^\d]/g, '').length === 11;
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleExport = (imageId: string) => {
    if (imageId === image.id) {
      setIsBookmarkletOpen(true);
    }
  };

  const isGoogleUrl = (url: string) => {
    return url.includes('google.com') || url.includes('docs.google.com');
  };

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    
    try {
      // استعادة آخر URL مستخدم من التخزين المحلي
      const lastUsedUrl = localStorage.getItem('lastAutoFillUrl') || localStorage.getItem('lastPreviewUrl');
      
      // إذا لم يكن هناك URL سابق، نطلب من المستخدم إدخاله
      let targetUrl = lastUsedUrl;
      if (!targetUrl) {
        targetUrl = prompt("أدخل عنوان URL للموقع الذي تريد ملء البيانات فيه:", "https://");
        if (!targetUrl) {
          setIsAutoFilling(false);
          return;
        }
        // حفظ URL في التخزين المحلي للاستخدام القادم
        localStorage.setItem('lastAutoFillUrl', targetUrl);
      }
      
      localStorage.setItem('lastPreviewUrl', targetUrl);
      
      // التحقق مما إذا كان عنوان URL هو Google Sheets أو مستندات Google
      if (isGoogleUrl(targetUrl)) {
        toast({
          title: "تنبيه - مواقع Google",
          description: "مواقع Google مثل Sheets لا تدعم الإدخال التلقائي داخل التطبيق. سيتم فتح الموقع وتنفيذ سكريبت الإدخال تلقائياً.",
          variant: "warning",
          duration: 5000
        });
      }
      
      // إعداد البيانات للإرسال
      const formData = {
        senderName: image.senderName || "",
        phoneNumber: image.phoneNumber || "",
        province: image.province || "",
        price: image.price || "",
        companyName: image.companyName || "",
        code: image.code || "",
        extractedText: image.extractedText || ""
      };
      
      // فحص ما إذا كان هناك بيانات كافية للإدخال التلقائي
      const dataFields = Object.values(formData).filter(Boolean);
      if (dataFields.length <= 1) { // إذا كان هناك حقل واحد فقط أو لا يوجد حقول
        toast({
          title: "لا توجد بيانات كافية",
          description: "لا يوجد ما يكفي من البيانات المستخرجة للإدخال التلقائي. الرجاء استخراج المزيد من البيانات أولاً.",
          variant: "destructive"
        });
        setIsAutoFilling(false);
        return;
      }
      
      // استرجاع بيانات تسجيل الدخول المحفوظة
      const storedCredentials = localStorage.getItem("savedLoginCredentials");
      let savedCredentials: SavedCredential[] = [];
      
      if (storedCredentials) {
        try {
          savedCredentials = JSON.parse(storedCredentials);
        } catch (error) {
          console.error("خطأ في استرجاع بيانات تسجيل الدخول:", error);
        }
      }
      
      // البحث عن بيانات تسجيل الدخول للموقع المستهدف
      let loginCredential: SavedCredential | null = null;
      if (savedCredentials.length > 0 && targetUrl) {
        try {
          const urlObj = new URL(targetUrl);
          const domain = urlObj.hostname;
          loginCredential = savedCredentials.find(cred => cred.domain === domain) || null;
        } catch (error) {
          console.error("خطأ في تحليل URL:", error);
        }
      }
      
      // إنشاء نص البرمجة النصية مباشرة
      const scriptText = `
        (function() {
          const data = ${JSON.stringify(formData)};
          ${loginCredential ? `const savedLogin = ${JSON.stringify(loginCredential)};` : 'const savedLogin = null;'}
          
          // عرض إشعار حول النجاح أو الفشل
          const showNotification = (message, isSuccess) => {
            const notification = document.createElement('div');
            notification.style.cssText = \`
              position: fixed;
              top: 20px;
              right: 20px;
              background: \${isSuccess ? '#4CAF50' : '#F44336'};
              color: white;
              padding: 15px 20px;
              border-radius: 5px;
              z-index: 10000;
              direction: rtl;
              font-family: Arial;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            \`;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
          };
          
          // إنشاء عنصر لعرض حالة التقدم
          const progressBar = document.createElement('div');
          progressBar.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; height: 4px; background: #0f0; z-index: 9999; transition: width 0.3s;';
          document.body.appendChild(progressBar);
          
          // وظيفة لتحديث شريط التقدم
          const updateProgress = (percent) => {
            progressBar.style.width = percent + '%';
            if (percent === 100) {
              setTimeout(() => progressBar.remove(), 1000);
            }
          };
          
          // التحقق من الحاجة لتسجيل الدخول
          const checkForLoginForm = () => {
            updateProgress(20);
            const possibleLoginSelectors = [
              'input[type="password"]',
              'form[action*="login"]', 
              'form[action*="signin"]', 
              'form[id*="login"]', 
              'form[id*="signin"]', 
              'form[class*="login"]', 
              'form[class*="signin"]'
            ];
            
            const loginForm = possibleLoginSelectors.some(selector => document.querySelector(selector));
            if (loginForm) {
              showNotification('تم اكتشاف نموذج تسجيل دخول. سيتم محاولة تعبئة معلومات الدخول إذا كانت متوفرة.', true);
              
              // البحث عن حقول اسم المستخدم وكلمة المرور
              const possibleUsernameSelectors = [
                'input[name*="user"]', 'input[name*="email"]', 'input[id*="user"]', 
                'input[id*="email"]', 'input[type="email"]', 'input[placeholder*="بريد"]', 
                'input[placeholder*="اسم المستخدم"]'
              ];
              
              const usernameField = possibleUsernameSelectors
                .map(selector => document.querySelector(selector))
                .find(field => field);
                
              const passwordField = document.querySelector('input[type="password"]');
              
              if (usernameField && passwordField) {
                // إذا كان لدينا بيانات دخول محفوظة، نستخدمها
                if (savedLogin) {
                  try {
                    usernameField.value = savedLogin.username || '';
                    passwordField.value = savedLogin.password || '';
                    
                    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // البحث عن زر تسجيل الدخول
                    const loginButton = 
                      document.querySelector('button[type="submit"]') || 
                      document.querySelector('input[type="submit"]') ||
                      Array.from(document.querySelectorAll('button')).find(btn => 
                        btn.innerText.toLowerCase().includes('login') || 
                        btn.innerText.toLowerCase().includes('sign in') ||
                        btn.innerText.includes('تسجيل') || 
                        btn.innerText.includes('دخول')
                      );
                      
                    if (loginButton) {
                      // عرض رسالة للمستخدم وتنفيذ النقر بعد فترة
                      showNotification('سيتم تسجيل الدخول تلقائيًا خلال 3 ثوان. انقر أي مكان لإلغاء العملية.', true);
                      
                      const cancelClickHandler = () => {
                        clearTimeout(loginTimeout);
                        document.removeEventListener('click', cancelClickHandler);
                        showNotification('تم إلغاء تسجيل الدخول التلقائي', false);
                      };
                      
                      document.addEventListener('click', cancelClickHandler);
                      
                      const loginTimeout = setTimeout(() => {
                        document.removeEventListener('click', cancelClickHandler);
                        loginButton.click();
                        updateProgress(40);
                        
                        // انتظار انتهاء تسجيل الدخول
                        setTimeout(() => {
                          document.removeEventListener('click', cancelClickHandler);
                          fillFields();
                        }, 3000);
                      }, 3000);
                      
                      return true;
                    }
                  } catch (e) {
                    console.error('خطأ في استخدام بيانات تسجيل الدخول:', e);
                  }
                } else {
                  // اقتراح حفظ بيانات الدخول
                  showNotification('لم يتم العثور على بيانات تسجيل دخول محفوظة. قم بتسجيل الدخول يدويًا ثم استخدم زر حفظ بيانات الدخول.', false);
                  return true;
                }
              }
            }
            return false;
          };
          
          // وظيفة للبحث عن الحقول وملئها
          const fillFields = () => {
            updateProgress(60);
            const fields = {
              'senderName': ['sender', 'name', 'الاسم', 'المرسل', 'إسم', 'customer', 'client'],
              'phoneNumber': ['phone', 'tel', 'mobile', 'هاتف', 'موبايل', 'جوال', 'رقم'],
              'province': ['province', 'city', 'region', 'محافظة', 'المحافظة', 'المدينة', 'منطقة', 'address', 'عنوان'],
              'price': ['price', 'cost', 'amount', 'سعر', 'المبلغ', 'التكلفة', 'قيمة', 'total'],
              'companyName': ['company', 'vendor', 'شركة', 'المورد', 'البائع', 'supplier', 'provider'],
              'code': ['code', 'id', 'number', 'رقم', 'كود', 'معرف', 'reference', 'order']
            };
            
            let filledCount = 0;
            const totalFields = Object.keys(fields).length;
            
            // البحث عن وسوم الإدخال ذات الصلة
            const findRelevantElements = (selector) => {
              return [
                ...document.querySelectorAll(\`input[id*="\${selector}"i]\`),
                ...document.querySelectorAll(\`input[name*="\${selector}"i]\`),
                ...document.querySelectorAll(\`input[placeholder*="\${selector}"i]\`),
                ...document.querySelectorAll(\`textarea[id*="\${selector}"i]\`),
                ...document.querySelectorAll(\`textarea[name*="\${selector}"i]\`),
                ...document.querySelectorAll(\`textarea[placeholder*="\${selector}"i]\`),
                ...document.querySelectorAll(\`select[id*="\${selector}"i]\`),
                ...document.querySelectorAll(\`select[name*="\${selector}"i]\`),
                ...document.querySelectorAll(\`div[role="textbox"][aria-label*="\${selector}"i]\`)
              ];
            };
            
            for (const [dataKey, selectors] of Object.entries(fields)) {
              if (!data[dataKey]) continue;
              
              let fieldFilled = false;
              for (const selector of selectors) {
                const elements = findRelevantElements(selector);
                
                for (const element of elements) {
                  if (element.disabled || element.readOnly) continue;
                  
                  try {
                    if (element instanceof HTMLSelectElement) {
                      const options = Array.from(element.options);
                      const bestMatch = options.find(opt => 
                        opt.text.toLowerCase().includes(data[dataKey].toLowerCase())
                      );
                      if (bestMatch) {
                        element.value = bestMatch.value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        fieldFilled = true;
                        break;
                      }
                    } else if (element.getAttribute('role') === 'textbox') {
                      // للتعامل مع حقول النص في Google Docs/Sheets
                      element.textContent = data[dataKey];
                      element.dispatchEvent(new Event('input', { bubbles: true }));
                      fieldFilled = true;
                      break;
                    } else {
                      element.value = data[dataKey];
                      element.dispatchEvent(new Event('input', { bubbles: true }));
                      element.dispatchEvent(new Event('change', { bubbles: true }));
                      fieldFilled = true;
                      break;
                    }
                  } catch (e) {
                    console.error('Error filling field:', e);
                  }
                }
                
                if (fieldFilled) {
                  filledCount++;
                  updateProgress(60 + (filledCount / totalFields) * 30);
                  break;
                }
              }
            }
            
            // البحث عن الحقول بناءً على التسميات (labels)
            if (filledCount < totalFields) {
              const labels = document.querySelectorAll('label');
              
              for (const [dataKey, selectors] of Object.entries(fields)) {
                if (!data[dataKey] || selectors.some(s => findRelevantElements(s).length > 0)) continue;
                
                for (const label of labels) {
                  if (selectors.some(s => label.textContent.toLowerCase().includes(s.toLowerCase()))) {
                    const forAttr = label.getAttribute('for');
                    if (forAttr) {
                      const input = document.getElementById(forAttr);
                      if (input && !input.disabled && !input.readOnly) {
                        try {
                          input.value = data[dataKey];
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                          filledCount++;
                          updateProgress(60 + (filledCount / totalFields) * 30);
                        } catch (e) {
                          console.error('Error filling field by label:', e);
                        }
                      }
                    }
                  }
                }
              }
            }
            
            // البحث عن أزرار الإرسال أو حفظ النموذج
            setTimeout(() => {
              updateProgress(95);
              const submitButtonSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("حفظ")',
                'button:contains("إرسال")',
                'button:contains("تأكيد")',
                'button:contains("إضافة")',
                'button:contains("submit")',
                'button:contains("save")',
                'button:contains("confirm")',
                'button:contains("add")'
              ];
              
              const containsText = (element, text) => {
                return element.innerText.toLowerCase().includes(text.toLowerCase());
              };
              
              let submitButton = null;
              
              // تجربة المحددات المباشرة أولاً
              for (const selector of submitButtonSelectors) {
                if (selector.includes(':contains')) {
                  const text = selector.match(/:contains\\("(.+)"\\)/)[1];
                  submitButton = Array.from(document.querySelectorAll('button')).find(btn => containsText(btn, text));
                } else {
                  submitButton = document.querySelector(selector);
                }
                if (submitButton) break;
              }
              
              // إذا لم يتم العثور على زر، ابحث عن أي زر يحتوي على نص دال
              if (!submitButton) {
                const buttons = Array.from(document.querySelectorAll('button'));
                const submitTexts = ['حفظ', 'إرسال', 'تأكيد', 'إضافة', 'submit', 'save', 'confirm', 'add'];
                submitButton = buttons.find(btn => submitTexts.some(text => containsText(btn, text)));
              }
              
              if (submitButton) {
                // عرض إشعار للتحذير قبل النقر على زر الإرسال
                const clickConfirmation = document.createElement('div');
                clickConfirmation.style.cssText = \`
                  position: fixed;
                  bottom: 20px;
                  right: 20px;
                  background: rgba(0, 0, 0, 0.8);
                  color: white;
                  padding: 15px 20px;
                  border-radius: 5px;
                  z-index: 10000;
                  direction: rtl;
                  font-family: Arial;
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                \`;
                
                const message = document.createElement('div');
                message.textContent = 'سيتم إرسال النموذج تلقائياً خلال 5 ثوان. انقر "إلغاء" لإيقاف العملية';
                clickConfirmation.appendChild(message);
                
                const buttonContainer = document.createElement('div');
                buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';
                
                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'إلغاء';
                cancelButton.style.cssText = 'padding: 5px 15px; background: #f44336; border: none; border-radius: 3px; color: white; cursor: pointer;';
                
                const confirmButton = document.createElement('button');
                confirmButton.textContent = 'إرسال الآن';
                confirmButton.style.cssText = 'padding: 5px 15px; background: #4CAF50; border: none; border-radius: 3px; color: white; cursor: pointer;';
                
                buttonContainer.appendChild(cancelButton);
                buttonContainer.appendChild(confirmButton);
                clickConfirmation.appendChild(buttonContainer);
                
                document.body.appendChild(clickConfirmation);
                
                const submitTimeout = setTimeout(() => {
                  submitButton.click();
                  clickConfirmation.remove();
                  updateProgress(100);
                  showNotification('تم إرسال النموذج بنجاح', true);
                }, 5000);
                
                cancelButton.addEventListener('click', () => {
                  clearTimeout(submitTimeout);
                  clickConfirmation.remove();
                  updateProgress(100);
                  showNotification('تم إلغاء إرسال النموذج', false);
                });
                
                confirmButton.addEventListener('click', () => {
                  clearTimeout(submitTimeout);
                  submitButton.click();
                  clickConfirmation.remove();
                  updateProgress(100);
                  showNotification('تم إرسال النموذج بنجاح', true);
                });
              } else {
                updateProgress(100);
                if (filledCount > 0) {
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                    .then(() => console.log('تم نسخ البيانات إلى الحافظة'))
                    .catch(() => console.warn('فشل نسخ البيانات إلى الحافظة'));
                  showNotification(\`تم ملء \${filledCount} حقول بنجاح. لم يتم العثور على زر إرسال.\`, true);
                } else {
                  showNotification('لم يتم العثور على حقول متطابقة في هذه الصفحة', false);
                }
              }
            }, 1000);
            
            return filledCount;
          };
          
          // البدء بفحص وجود صفحة تسجيل دخول
          updateProgress(10);
          const isLoginPage = checkForLoginForm();
          
          // إذا لم تكن صفحة تسجيل دخول، ابدأ بملء الحقول مباشرة
          if (!isLoginPage) {
            setTimeout(fillFields, 500);
          }
        })();
      `;
      
      // تنفيذ السكريبت
      const bookmarkletUrl = `javascript:${encodeURIComponent(scriptText)}`;
      
      // تحويل المستخدم لصفحة المعاينة
      navigate('/preview?url=' + encodeURIComponent(targetUrl) + '&autoFill=true&script=' + encodeURIComponent(bookmarkletUrl));
      
      toast({
        title: "تم التحويل إلى صفحة المعاينة",
        description: "سيتم فتح الموقع وتنفيذ الإدخال التلقائي هناك تلقائياً.",
        variant: "default"
      });
    } catch (error) {
      console.error("خطأ في الإدخال التلقائي:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة الإدخال التلقائي: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const navigateToPreview = () => {
    const lastUsedUrl = localStorage.getItem('lastAutoFillUrl') || localStorage.getItem('lastPreviewUrl');
    if (lastUsedUrl) {
      localStorage.setItem('lastPreviewUrl', lastUsedUrl);
      navigate('/preview');
    } else {
      toast({
        title: "لم يتم تحديد موقع",
        description: "الرجاء استخدام خاصية الإدخال التلقائي أولاً لتحديد الموقع",
        variant: "default"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto"
    >
      <Card className="overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow border-border/60 dark:border-gray-700/60 rounded-xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* صورة العنصر (55% العرض) */}
            <div className="md:col-span-7 border-b md:border-b-0 md:border-l border-border/30 dark:border-gray-700/30">
              <DraggableImage 
                image={image} 
                onImageClick={onImageClick} 
                formatDate={formatDate} 
              />
            </div>
            
            {/* بيانات العنصر (45% العرض) */}
            <div className="md:col-span-5">
              <ImageDataForm 
                image={image} 
                onTextChange={onTextChange} 
              />
            </div>
          </div>
          
          <div className="px-4 pb-4 border-t border-border/30 dark:border-gray-700/30 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ActionButtons 
                imageId={image.id}
                isSubmitting={isSubmitting}
                isCompleted={image.status === "completed"}
                isSubmitted={!!image.submitted}
                isPhoneNumberValid={isPhoneNumberValid}
                onDelete={onDelete}
                onSubmit={onSubmit}
                onExport={handleExport}
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30"
                  onClick={handleAutoFill}
                  disabled={isAutoFilling || !image.extractedText}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isAutoFilling ? "جاري الإدخال..." : "إدخال تلقائي"}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                  onClick={navigateToPreview}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  معاينة الموقع
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <BookmarkletGenerator 
        isOpen={isBookmarkletOpen} 
        onClose={() => setIsBookmarkletOpen(false)} 
        imageData={isBookmarkletOpen ? image : null}
      />
    </motion.div>
  );
};

export default CardItem;
