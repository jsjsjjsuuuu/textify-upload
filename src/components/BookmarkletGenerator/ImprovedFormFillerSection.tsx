
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clipboard, ExternalLink, AlertCircle, ArrowLeft, Info, Play, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImprovedFormFillerSectionProps {
  enhancedBookmarkletUrl: string;
  isGeneratingUrl: boolean;
  onCopyEnhancedBookmarklet: () => void;
  storedCount: number;
}

const ImprovedFormFillerSection: React.FC<ImprovedFormFillerSectionProps> = ({
  enhancedBookmarkletUrl,
  isGeneratingUrl,
  onCopyEnhancedBookmarklet,
  storedCount
}) => {
  const [externalUrl, setExternalUrl] = useState("");

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-brand-brown dark:text-brand-beige">
          أداة الإدخال المحسّنة للمواقع الخارجية
        </h3>
        
        <p className="text-sm text-muted-foreground">
          هذه الأداة تساعدك على ملء نماذج البيانات في مواقع الشحن الخارجية. استخدمها عندما تكون في الموقع الفعلي وتحتاج لإدخال البيانات بسرعة.
        </p>
        
        {storedCount > 0 ? (
          <div className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">كيفية استخدام هذه الأداة:</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                <ol className="text-sm list-decimal list-inside space-y-2 mt-1">
                  <li>اسحب الزر "أداة الإدخال المحسّنة" إلى شريط المفضلة في متصفحك</li>
                  <li>انتقل إلى موقع شركة التوصيل وقم بفتح صفحة إضافة شحنة جديدة</li>
                  <li>انقر على زر الأداة في شريط المفضلة لفتح لوحة التحكم</li>
                  <li>استخدم القائمة المنسدلة لاختيار العنصر المراد إدخاله</li>
                  <li>انقر على زر "املأ النموذج" لإدخال البيانات تلقائيًا</li>
                </ol>
              </AlertDescription>
            </Alert>
            
            {/* قسم جديد للإرسال الخارجي */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4">
              <div className="flex items-center mb-2">
                <Send className="h-4 w-4 ml-2 text-amber-600 dark:text-amber-400" />
                <h4 className="text-amber-800 dark:text-amber-300 font-medium">إرسال البيانات إلى نموذج خارجي</h4>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                يمكنك إرسال البيانات مباشرة إلى نموذج خارجي بدلاً من الإدخال اليدوي. أدخل عنوان URL للنموذج الخارجي أدناه:
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="external-url" className="text-sm ml-2 text-amber-800 dark:text-amber-300">عنوان النموذج الخارجي:</Label>
                  <Input 
                    id="external-url"
                    placeholder="https://example.com/api/form"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="flex-1 h-8 text-sm border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const tab = document.querySelector('[data-simulator-tab="simulation"]');
                      if (tab) {
                        tab.dispatchEvent(new Event('click'));
                        
                        // تعيين عنوان URL الخارجي وتفعيل الإرسال الخارجي
                        localStorage.setItem('external_form_url', externalUrl);
                      }
                    }}
                    className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                    disabled={!externalUrl}
                  >
                    <Send className="h-4 w-4 ml-2" />
                    الانتقال إلى نموذج المحاكاة
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-dashed border-muted-foreground/30"></span>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-gray-800 px-2 text-xs text-muted-foreground">سحب الزر إلى المفضلة</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-secondary/20 rounded-xl">
              <p className="text-xs text-muted-foreground">
                اسحب هذا الزر إلى شريط المفضلة في متصفحك
              </p>
              
              <a
                href={enhancedBookmarkletUrl}
                className="inline-flex items-center justify-center h-9 px-4 py-2 rounded bg-brand-green text-white font-medium text-sm hover:bg-brand-green/90 shadow-sm no-underline cursor-move"
                draggable="true"
                onClick={(e) => e.preventDefault()}
              >
                <ExternalLink className="h-4 w-4 ml-2" />
                أداة الإدخال المحسّنة
              </a>
              
              <Button
                onClick={onCopyEnhancedBookmarklet}
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={isGeneratingUrl}
              >
                <Clipboard className="h-3.5 w-3.5 ml-2" />
                نسخ رابط الأداة
              </Button>
            </div>
            
            <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-300">هل تفضل طريقة داخلية؟</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                يمكنك استخدام <strong>نظام محاكاة إدخال البيانات</strong> داخل التطبيق لتجربة إدخال البيانات دون الحاجة لزيارة المواقع الخارجية.
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                    onClick={() => {
                      const tab = document.querySelector('[data-simulator-tab="simulation"]');
                      if (tab) {
                        tab.dispatchEvent(new Event('click'));
                        
                        // محاولة تشغيل المحاكاة المباشرة
                        setTimeout(() => {
                          const liveSimButton = document.querySelector('[data-simulator-tab="simulation"] button:has(.lucide-play)');
                          if (liveSimButton) {
                            liveSimButton.dispatchEvent(new Event('click'));
                          }
                        }, 500);
                      }
                    }}
                  >
                    <Play className="h-4 w-4 ml-2" />
                    جرب المحاكاة المباشرة
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center space-y-3 bg-secondary/10 rounded-lg">
            <AlertCircle className="h-12 w-12 text-muted-foreground/60" />
            <p className="text-center text-muted-foreground">
              لا توجد بيانات مخزنة للاستخدام بعد. يرجى تصدير البيانات أولاً.
            </p>
            <Button variant="outline" onClick={() => document.querySelector('[data-value="export"]')?.dispatchEvent(new Event('click'))}>
              <ArrowLeft className="h-4 w-4 ml-2" />
              الانتقال إلى تصدير البيانات
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedFormFillerSection;
