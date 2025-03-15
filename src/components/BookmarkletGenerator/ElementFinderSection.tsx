
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash, Plus, MoreHorizontal, Repeat, ArrowDownUp } from "lucide-react";

interface ElementAction {
  id: string;
  name: string;
  finder: string;
  value: string;
  delay: string;
}

interface ElementFinderSectionProps {
  projectName?: string;
  projectUrl?: string;
}

const ElementFinderSection: React.FC<ElementFinderSectionProps> = ({ 
  projectName = "malhalal-exp.com",
  projectUrl = "https://malhalal-exp.com/add_newwaslinserter.php?add"
}) => {
  const [actions, setActions] = useState<ElementAction[]>([
    { id: "1", name: "", finder: "//input[@name=\"id_wasl\"][@id=\"id_wasl\"][@value=\"\"]", value: "12421311", delay: "" },
    { id: "2", name: "", finder: "//input[@name=\"phone_customer\"][@id=\"phone_customer\"]", value: "07710284844", delay: "" },
    { id: "3", name: "", finder: "//*[@id=\"botdiv\"]/div/span/span[1]/span", value: "صلاح الدين", delay: "" },
    { id: "4", name: "", finder: "/html/body/div/div/div[1]/div/div/div[4]/form/div[5]/div/select", value: "الصياد", delay: "1" },
    { id: "5", name: "", finder: "/html/body/div/div/div[1]/div/div/div[4]/form/div[6]/div/select", value: "جاسم دخيل", delay: "" },
    { id: "6", name: "", finder: "//input[@name=\"total_price\"][@id=\"total_price\"][@value", value: "45000", delay: "" },
  ]);
  
  const [enabled, setEnabled] = useState(true);
  const [projectNameInput, setProjectNameInput] = useState(projectName);
  const [projectUrlInput, setProjectUrlInput] = useState(projectUrl);
  
  const addNewAction = () => {
    const newId = (actions.length + 1).toString();
    setActions([...actions, { id: newId, name: "", finder: "", value: "", delay: "" }]);
  };
  
  const deleteAction = (id: string) => {
    setActions(actions.filter(action => action.id !== id));
  };
  
  const updateAction = (id: string, field: keyof ElementAction, value: string) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, [field]: value } : action
    ));
  };
  
  // استرجاع البيانات من التخزين المحلي عند بدء التشغيل
  useEffect(() => {
    const savedData = localStorage.getItem('element_finder_data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.actions && Array.isArray(data.actions)) {
          setActions(data.actions);
        }
        if (data.projectName) setProjectNameInput(data.projectName);
        if (data.projectUrl) setProjectUrlInput(data.projectUrl);
        if (data.enabled !== undefined) setEnabled(data.enabled);
      } catch (e) {
        console.error("خطأ في تحليل البيانات المحفوظة:", e);
      }
    }
  }, []);
  
  // حفظ البيانات في التخزين المحلي عند التغيير
  useEffect(() => {
    const dataToSave = {
      actions,
      projectName: projectNameInput,
      projectUrl: projectUrlInput,
      enabled
    };
    localStorage.setItem('element_finder_data', JSON.stringify(dataToSave));
  }, [actions, projectNameInput, projectUrlInput, enabled]);
  
  const generateScript = () => {
    const scriptTemplate = `// سكريبت تكوين تلقائي تم إنشاؤه
const config = {
  projectName: "${projectNameInput}",
  projectUrl: "${projectUrlInput}",
  actions: [
${actions.map(action => `    {
      name: "${action.name}",
      finder: "${action.finder.replace(/"/g, '\\"')}",
      value: "${action.value.replace(/"/g, '\\"')}",
      delay: "${action.delay}"
    }`).join(',\n')}
  ]
};

// تنفيذ الإجراءات
async function runActions() {
  console.log("بدء تنفيذ الإجراءات...");
  
  for (const action of config.actions) {
    try {
      // تأخير قبل كل إجراء
      const delay = parseInt(action.delay) || 0;
      if (delay > 0) {
        await new Promise(r => setTimeout(r, delay * 1000));
      }
      
      // العثور على العنصر
      let element;
      if (action.finder.startsWith("//") || action.finder.startsWith("/html")) {
        // XPath
        const elements = document.evaluate(action.finder, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (elements.snapshotLength > 0) {
          element = elements.snapshotItem(0);
        }
      } else if (action.finder.startsWith("#")) {
        // معرف
        element = document.querySelector(action.finder);
      } else if (action.finder.startsWith(".")) {
        // فئة
        element = document.querySelector(action.finder);
      } else if (action.finder.startsWith("Name::")) {
        // اسم
        const name = action.finder.replace("Name::", "");
        element = document.querySelector(\`[name="\${name}"]\`);
      } else if (action.finder.startsWith("TagName::")) {
        // اسم العلامة
        const tag = action.finder.replace("TagName::", "");
        element = document.querySelector(tag);
      } else if (action.finder.startsWith("ClassName::")) {
        // اسم الفئة
        const className = action.finder.replace("ClassName::", "");
        const classes = className.split(" ");
        let selector = "";
        for (const cls of classes) {
          selector += "." + cls;
        }
        element = document.querySelector(selector);
      } else if (action.finder.startsWith("Selector::")) {
        // محدد CSS
        const selector = action.finder.replace("Selector::", "");
        element = document.querySelector(selector);
      } else if (action.finder.startsWith("SelectorAll::")) {
        // محدد الكل
        const selector = action.finder.replace("SelectorAll::", "");
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          element = elements[0];
        }
      } else {
        // افتراضي: محاولة كمحدد css
        element = document.querySelector(action.finder);
      }
      
      if (!element) {
        console.error(\`لم يتم العثور على العنصر: \${action.finder}\`);
        continue;
      }
      
      // تعيين القيمة حسب نوع العنصر
      if (element.tagName === "SELECT") {
        // القائمة المنسدلة
        for (let i = 0; i < element.options.length; i++) {
          if (element.options[i].text === action.value || element.options[i].value === action.value) {
            element.selectedIndex = i;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      } else if (element.tagName === "INPUT") {
        // حقول الإدخال
        element.value = action.value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (element.tagName === "TEXTAREA") {
        // مناطق النص
        element.value = action.value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // عناصر أخرى (زر، نص)
        if (element.click) {
          element.click();
        } else {
          // محاولة محاكاة النقر
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          element.dispatchEvent(event);
        }
      }
      
      console.log(\`تم تنفيذ الإجراء "\${action.name || 'بلا اسم'}" بنجاح\`);
    } catch (error) {
      console.error(\`خطأ في تنفيذ الإجراء "\${action.name || 'بلا اسم'}":\`, error);
    }
  }
  
  console.log("انتهت جميع الإجراءات");
}

// بدء التنفيذ
if (window.location.href !== config.projectUrl) {
  console.log(\`الانتقال إلى \${config.projectUrl}\`);
  window.location.href = config.projectUrl;
} else {
  // انتظار تحميل الصفحة بالكامل
  if (document.readyState === 'complete') {
    runActions();
  } else {
    window.addEventListener('load', runActions);
  }
}`;

    return scriptTemplate;
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <span>التكوين.العنوان</span>
            <Badge variant="outline" className="mr-2 bg-amber-100">جديد</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-finder-switch" className="ml-2">تمكين التكوين</Label>
            <Switch
              id="auto-finder-switch"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Button variant="outline" size="icon">
              <ArrowDownUp className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Repeat className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="project-name">اسم التكوين</Label>
            <Input
              id="project-name"
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="project-url">configuration.url <span className="text-red-500">*</span></Label>
            <Input
              id="project-url"
              value={projectUrlInput}
              onChange={(e) => setProjectUrlInput(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-lg">عمل.عنوان</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              الدفعة.العنوان
            </Button>
            <Button variant="outline" size="sm" onClick={addNewAction}>
              <Plus className="h-4 w-4 ml-1" />
              عمل.إضافة
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-right">
                <th className="pb-2 font-medium text-sm">#</th>
                <th className="pb-2 font-medium text-sm">الاسم</th>
                <th className="pb-2 font-medium text-sm">
                  اكتشف العناصر <span className="text-red-500">*</span>
                </th>
                <th className="pb-2 font-medium text-sm">قيمة</th>
                <th className="pb-2 font-medium text-sm">
                  الفاصل الزمني R
                </th>
                <th className="pb-2 font-medium text-sm" colSpan={2}></th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id} className="border-t border-gray-200">
                  <td className="py-2 pr-2">{action.id}</td>
                  <td className="py-2 pr-2">
                    <Input 
                      value={action.name}
                      onChange={(e) => updateAction(action.id, 'name', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input 
                      value={action.finder}
                      onChange={(e) => updateAction(action.id, 'finder', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input 
                      value={action.value}
                      onChange={(e) => updateAction(action.id, 'value', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input 
                      value={action.delay}
                      onChange={(e) => updateAction(action.id, 'delay', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="py-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteAction(action.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                  <td className="py-2">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap justify-between gap-2 border-t pt-6">
        <div className="text-sm text-slate-500">
          {actions.length > 0
            ? `${actions.length} عنصر قابل للتنفيذ`
            : 'لا توجد إجراءات محددة بعد'}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // نسخ السكريبت إلى الحافظة
              const script = generateScript();
              navigator.clipboard.writeText(script);
              alert("تم نسخ السكريبت إلى الحافظة");
            }}
          >
            نسخ السكريبت
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              const script = generateScript();
              const blob = new Blob([script], {type: 'text/javascript'});
              const href = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = href;
              link.download = `${projectNameInput || 'config'}.js`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(href);
            }}
          >
            تصدير
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ElementFinderSection;
