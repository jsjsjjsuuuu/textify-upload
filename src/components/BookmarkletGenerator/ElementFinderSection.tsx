
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, AlertCircle, Search, Download, ExternalLink } from 'lucide-react';
import { AlertDescription, AlertTitle, Alert } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ElementFinderSectionProps {
  onCodeGenerated: (code: string) => void;
}

const ElementFinderSection: React.FC<ElementFinderSectionProps> = ({ onCodeGenerated }) => {
  const [elementSelector, setElementSelector] = useState('');
  const [attributeName, setAttributeName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [useEventListener, setUseEventListener] = useState(true);
  const [eventType, setEventType] = useState('click');
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBookmarklet, setIsBookmarklet] = useState(false);
  const [includeToast, setIncludeToast] = useState(true);
  const [includeCopyToClipboard, setIncludeCopyToClipboard] = useState(true);
  const [includeConsoleLog, setIncludeConsoleLog] = useState(true);
  const [customFunctionName, setCustomFunctionName] = useState('getElementInfo');
  const [customToastMessage, setCustomToastMessage] = useState('تم نسخ معلومات العنصر إلى الحافظة!');
  const [customConsoleLogMessage, setCustomConsoleLogMessage] = useState('معلومات العنصر:');
  const [isMinified, setIsMinified] = useState(true);

  const generateCode = () => {
    if (!elementSelector) {
      toast.error('الرجاء إدخال محدد العنصر أولاً');
      return;
    }

    setIsGenerating(true);

    try {
      // إنشاء الكود
      let code = `// وظيفة استخراج معلومات العناصر
function ${customFunctionName}() {
  try {
    const element = document.querySelector('${elementSelector}');
    if (!element) {
      console.error('لم يتم العثور على العنصر: ${elementSelector}');
      return null;
    }
    
    const elementInfo = {
      tagName: element.tagName.toLowerCase(),
      id: element.id || '',
      className: element.className || '',
      textContent: element.textContent?.trim() || '',
      ${attributeName ? `${attributeName}: element.getAttribute('${attributeName}') || '',` : ''}
      selector: '${elementSelector}'
    };
    
    ${includeConsoleLog ? `console.log('${customConsoleLogMessage}', elementInfo);` : ''}
    ${includeCopyToClipboard ? `
    // نسخ المعلومات إلى الحافظة
    const jsonString = JSON.stringify(elementInfo, null, 2);
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        ${includeToast ? `
        // إظهار إشعار نجاح
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.backgroundColor = '#4CAF50';
        toast.style.color = 'white';
        toast.style.padding = '16px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        toast.style.fontFamily = 'Arial, sans-serif';
        toast.style.direction = 'rtl';
        toast.textContent = '${customToastMessage}';
        document.body.appendChild(toast);
        
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transition = 'opacity 0.5s';
          setTimeout(() => document.body.removeChild(toast), 500);
        }, 3000);` : ''}
      })
      .catch(err => console.error('فشل نسخ المعلومات:', err));
    ` : ''}
    
    return elementInfo;
  } catch (error) {
    console.error('حدث خطأ:', error);
    return null;
  }
}

${useEventListener ? `
// إضافة مستمع حدث للعنصر
document.addEventListener('${eventType}', function(e) {
  if (e.target.matches('${elementSelector}')) {
    ${customFunctionName}();
  }
});` : `// تنفيذ الوظيفة مباشرة
${customFunctionName}();`}`;

      // تحويل الكود إلى بوكماركلت إذا كان مطلوباً
      if (isBookmarklet) {
        code = `javascript:(function(){${isMinified ? code.replace(/\s+/g, ' ').replace(/\/\/.*?(?=\n|$)/g, '') : code}})();`;
      }

      setGeneratedCode(code);
      onCodeGenerated(code);
      toast.success('تم إنشاء الكود بنجاح!');
    } catch (error) {
      console.error('حدث خطأ أثناء إنشاء الكود:', error);
      toast.error('حدث خطأ أثناء إنشاء الكود');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode)
      .then(() => {
        setIsCopied(true);
        toast.success('تم نسخ الكود إلى الحافظة!');
        setTimeout(() => setIsCopied(false), 3000);
      })
      .catch(err => {
        console.error('فشل نسخ الكود:', err);
        toast.error('فشل نسخ الكود');
      });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إنشاء أداة استخراج معلومات العناصر</CardTitle>
          <CardDescription>
            أنشئ أداة تساعدك في استخراج معلومات عن عناصر HTML المحددة في أي صفحة ويب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="element-selector">محدد العنصر (CSS Selector)</Label>
              <Input
                id="element-selector"
                placeholder="#myElement, .class-name, div[data-id], etc."
                value={elementSelector}
                onChange={(e) => setElementSelector(e.target.value)}
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="attribute-name">اسم السمة المخصصة (اختياري)</Label>
              <Input
                id="attribute-name"
                placeholder="data-id, href, src, etc."
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                dir="ltr"
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="use-event-listener"
                checked={useEventListener}
                onCheckedChange={setUseEventListener}
              />
              <Label htmlFor="use-event-listener">استخدام مستمع الحدث</Label>
            </div>

            {useEventListener && (
              <div>
                <Label htmlFor="event-type">نوع الحدث</Label>
                <select
                  id="event-type"
                  className="w-full p-2 border rounded-md"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option value="click">click</option>
                  <option value="mouseover">mouseover</option>
                  <option value="mouseenter">mouseenter</option>
                  <option value="focus">focus</option>
                </select>
              </div>
            )}

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="is-bookmarklet"
                checked={isBookmarklet}
                onCheckedChange={setIsBookmarklet}
              />
              <Label htmlFor="is-bookmarklet">تحويل إلى بوكماركلت</Label>
            </div>

            <Button
              variant="outline"
              onClick={() => setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen)}
            >
              {isAdvancedOptionsOpen ? 'إخفاء الخيارات المتقدمة' : 'عرض الخيارات المتقدمة'}
            </Button>

            {isAdvancedOptionsOpen && (
              <div className="space-y-4 p-4 border rounded-md">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="include-toast"
                    checked={includeToast}
                    onCheckedChange={setIncludeToast}
                  />
                  <Label htmlFor="include-toast">إظهار إشعار عند النسخ</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="include-copy"
                    checked={includeCopyToClipboard}
                    onCheckedChange={setIncludeCopyToClipboard}
                  />
                  <Label htmlFor="include-copy">نسخ المعلومات إلى الحافظة</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="include-console"
                    checked={includeConsoleLog}
                    onCheckedChange={setIncludeConsoleLog}
                  />
                  <Label htmlFor="include-console">عرض المعلومات في وحدة التحكم</Label>
                </div>

                <div>
                  <Label htmlFor="function-name">اسم الوظيفة</Label>
                  <Input
                    id="function-name"
                    value={customFunctionName}
                    onChange={(e) => setCustomFunctionName(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div>
                  <Label htmlFor="toast-message">رسالة الإشعار</Label>
                  <Input
                    id="toast-message"
                    value={customToastMessage}
                    onChange={(e) => setCustomToastMessage(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="console-message">رسالة وحدة التحكم</Label>
                  <Input
                    id="console-message"
                    value={customConsoleLogMessage}
                    onChange={(e) => setCustomConsoleLogMessage(e.target.value)}
                  />
                </div>

                {isBookmarklet && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="is-minified"
                      checked={isMinified}
                      onCheckedChange={setIsMinified}
                    />
                    <Label htmlFor="is-minified">تصغير الكود</Label>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={generateCode}
            disabled={isGenerating || !elementSelector}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isGenerating ? 'جاري الإنشاء...' : 'إنشاء الكود'}
          </Button>
        </CardFooter>
      </Card>

      {generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>الكود المُنشأ</span>
              <Button variant="ghost" size="sm" onClick={copyCode}>
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? 'تم النسخ' : 'نسخ'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <pre className="text-xs whitespace-pre-wrap overflow-x-auto" dir="ltr">
                {generatedCode}
              </pre>
            </ScrollArea>
          </CardContent>
          {isBookmarklet && (
            <CardFooter>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>استخدام البوكماركلت</AlertTitle>
                <AlertDescription>
                  اسحب هذا الرابط إلى شريط المفضلة الخاص بك أو انقر بزر الماوس الأيمن وأضفه إلى المفضلة.
                </AlertDescription>
              </Alert>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default ElementFinderSection;
